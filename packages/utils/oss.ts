/**
 * @file 基于OSS的上传SDK
 */

import { loadScriptFromRemote } from '@wxp-ui/utils/dom'
import dayjs from 'dayjs'

function dateHasExpiredNow(date: any, offset = 0, unit = 'minute') {
  return dayjs(date).subtract(offset, unit).isBefore(dayjs())
}

interface IResource {
  file: File // required
  id?: string
  name?: string
  // 简单模式需要进度条
  needProgressForSimple?: boolean
  progress?: number | string // SDK写入的上传进度
  abortCheckpoint?: any // SDK写入的断点续传的断点信息，一般不需要业务指定
  onBeforeLoad?(): any
  onProgress?(percent: number | string): any
  onComplete?(data: any): any
  onError?(error: string | Error): any
  onResume?(): any
}

// 后端下发的临时访问凭证
interface ICredential {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  bucketName: string
  expiration?: string
  dir?: string
  host?: string
  region?: string
}

// SDK 配置参数
export interface IOSSOption {
  region?: string
  timeout?: number
  partSize?: number
  parallel?: number
  partLimit?: number
  partMIME?: string
  maxProgress?: number
  maxRetryTimes?: number
  // 业务指定的SDK地址，通过 script 加载
  sdkUrl?: string
  // 业务指定的临时凭证的API
  getOssAccessKey?: () => Promise<any>
}

const DEFAULT_CONFIG = {
  region: 'oss-cn-hangzhou',
  // 上传超时时间
  timeout: 120 * 1000, // 2min
  // 设置并发上传的分片数量。
  parallel: 5,
  // 设置分片大小。默认值为 1 MB，最小值为 100 KB
  partSize: 1024 * 1024,
  // 分片断点 80 MB
  partLimit: 80 * 1024 * 1024,
  // 最大进度
  maxProgress: 100,
  // 重新上传最大的次数
  maxRetryTimes: 3,
  // 业务指定的SDK地址，通过 script 加载
  sdkUrl: 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.17.1.min.js',
}

export class WXPOSS {
  ossClient: any

  credentials: ICredential

  options: IOSSOption

  // 多文件的断点
  checkpoints = {}

  // 分片上传重试次数
  retryTimes = 0

  // 缓存需要进度条的简单上传列表
  progressListInSimpleMode: any[] = []
  //
  progressTimer: number | undefined

  loadingPromise: Promise<any> | null = null

  static uid = 0
  static uploadSpeedBPS = 0

  constructor(options: IOSSOption = {}) {
    this.options = {
      ...DEFAULT_CONFIG,
      ...options,
    }

    this.credentials = {} as ICredential

    WXPOSS.bindNetwork()
  }

  // ---- 初始化OSS客户端 ----
  hasExpired() {
    const expiration = this.credentials.expiration
    return expiration && dateHasExpiredNow(expiration, 1, 'minute')
  }
  initAliOSSClient(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.ossClient && !this.hasExpired()) {
        return resolve()
      }

      this.ossClient?.cancel()
      
      const res = await this.options.getOssAccessKey()
      if (!res || !res.data || res.data.code !== 200) {
        return reject()
      }

      this.credentials = res.data.data || {}

      // 处理时区问题
      const { expiration = '' } = res.data.data || {}
      if (expiration && expiration.endsWith('Z')) {
        this.credentials.expiration = expiration.slice(0, -1)
      }

      const { accessKeyId, accessKeySecret, securityToken, bucketName, region } = this.credentials
      // @ts-ignore
      this.ossClient = new OSS({
        accessKeyId,
        accessKeySecret,
        stsToken: securityToken,
        bucket: bucketName,
        region: region || this.options.region,
        refreshSTSToken: async () => {
          // 向您搭建的STS服务获取临时访问凭证。
          const res = await this.options.getOssAccessKey()

          if (!res || !res.data || res.data.code !== 200) {
            return
          }  
          
          this.credentials = res.data.data
          
          const { accessKeyId, accessKeySecret, securityToken } = res.data.data
          
          return { accessKeyId, accessKeySecret, securityToken }
        },
        // 刷新临时访问凭证的时间间隔，单位为毫秒。
        refreshSTSTokenInterval: 30 * 60 * 1000,
      })

      resolve()
    })
  }
  ensureOSSClient() {
    if ((!this.ossClient && this.loadingPromise) || (this.ossClient && !this.hasExpired())) {
      return this.loadingPromise
    }

    this.loadingPromise = new Promise((resolve) => {
      resolve(
        loadScriptFromRemote(this.options.sdkUrl).then(() => {
          return this.initAliOSSClient()
        })
      )
    })

    return this.loadingPromise
  }

  // ---- 上传回调 ----
  onBeforeLoad(resource: IResource) {
    typeof resource.onBeforeLoad == 'function' && resource.onBeforeLoad()
  }
  onProgress(percent: number | string, resource: IResource) {
    typeof resource.onProgress == 'function' && resource.onProgress(percent)
  }
  onComplete(data: any, resource: IResource) {
    typeof resource.onComplete == 'function' && resource.onComplete(data)
  }
  onError(error: string | Error, resource: IResource) {
    typeof resource.onError == 'function' && resource.onError(error)
  }

  // ---- 前端模拟进度 ----
  add2ProgressList(resource: IResource) {
    this.progressListInSimpleMode.push({ resource, timestamp: Date.now(), fakeSize: 0 })
  }
  removeFromProgressList(resource: IResource) {
    if (resource.needProgressForSimple) {
      this.progressListInSimpleMode = this.progressListInSimpleMode.filter((n: any) => n.resource!.id !== resource.id)
    }
  }
  clearProgressTimer() {
    this.progressTimer && clearInterval(this.progressTimer)
    this.progressTimer = undefined
    this.progressListInSimpleMode = []
  }

  // ---- 上传中心 ----
  // 批量上传
  batchUpload(resourceList: IResource[], opts?: any) {
    resourceList.forEach((resource) => {
      this.autoUpload(resource, opts)
    })
  }

  // 无脑上传单个文件，内部自动判断是简单、分片
  autoUpload(resource: IResource, opts?: any) {
    const { file } = resource

    if (file.size > (this.options.partLimit || 0)) {
      this.partUpload(resource, opts)
    } else {
      this.simpleUpload(resource, opts)
    }
  }

  // case 1 简单上传
  async simpleUpload(resource: IResource, opts?: any): Promise<{ url: string; file: File } | undefined> {
    console.log('simple upload')

    // 开始上传回调
    this.onBeforeLoad(resource)

    try {
      await this.ensureOSSClient()
    } catch (e: any) {
      this.onError(e, resource)
    }

    const { file } = resource || {}

    const fileName = this.createFileName(file.name)

    // 进度条模拟
    if (resource.needProgressForSimple) {
      this.add2ProgressList(resource)

      const { maxProgress } = this.options || {}

      if (!this.progressTimer) {
        this.progressTimer = setInterval(() => {
          if (!this.progressListInSimpleMode.length) {
            return this.clearProgressTimer()
          }

          this.progressListInSimpleMode.forEach((item) => {
            // byte per sec * seconds / total size
            item.fakeSize += (WXPOSS.uploadSpeedBPS * (Date.now() - item.timestamp)) / 1000

            const fakeProgress = Math.min(
              maxProgress,
              Math.floor((item.fakeSize / item.resource.file.size) * maxProgress)
            )

            this.onProgress(fakeProgress, item.resource)

            item.timestamp = Date.now()

            if (fakeProgress >= maxProgress) {
              return this.removeFromProgressList(item.resource)
            }
          })
        }, 120)
      }
    }

    return this.ossClient
      .put(fileName, file, {
        timeout: opts?.timeout || this.options.timeout,
      })
      .then((res: any) => {
        const url = `${this.credentials.host}/${WXPOSS.encodeName(res.name)}`

        const data = { url, file }

        this.removeFromProgressList(resource)

        // 上传成功回调
        this.onComplete(data, resource)

        return data
      })
      .catch((err: string | Error) => {
        this.removeFromProgressList(resource)

        // 上传失败回调
        this.onError(err, resource)
      })
  }

  // case 2 分片上传
  async partUpload(resource: IResource, opts?: any) {
    // 开始上传回调
    this.onBeforeLoad(resource)

    try {
      await this.ensureOSSClient()
    } catch (e: any) {
      this.onError(e, resource)
    }

    console.log('part upload')

    const { file } = resource

    const fileName = this.createFileName(file.name)
    return this.ossClient
      .multipartUpload(fileName, file, {
        parallel: this.options.parallel,
        // 针对大文件1G的，增大分片大小
        partSize: this.options.partSize,
        progress: (p: number, cpt: any) => this.onMultipartUploadProgress(resource, p, cpt),
        // 设置MIME
        ...(this.options.partMIME ? { mime: this.options.partMIME } : null),
        // 设置断点
        ...(opts?.checkpoint ? { checkpoint: opts.checkpoint } : null),
      })
      .then((res: any) => {
        const url = `${this.credentials.host}/${WXPOSS.encodeName(res.name)}`

        const data = { url, file }

        // 上传成功回调
        this.onComplete(data, resource)
        this.retryTimes = 0

        return data
      })
      .catch((err: any) => {
        // 重试三次，超过三次就算失败
        this.retryTimes++
        if (this.retryTimes <= opts?.maxRetryTimes || this.options.maxRetryTimes) {
          this.resumeLoad(resource)
        } else {
          this.retryTimes = 0
          this.onError(err, resource)
        }
      })
  }
  onMultipartUploadProgress(resource: IResource, percent: number, checkpoint: any) {
    // 上传进度
    const progress = Math.floor(percent * 100)

    this.onProgress(progress, resource)
    resource.progress = progress

    // 保存断点，续传从断点开始，从上次的进度开始上传而不是重新上传
    resource.abortCheckpoint = checkpoint

    // 以后再做这里
    // this.checkpoints[checkpoint.uploadId] = checkpoint
  }

  // case 3 断点续传，
  // 恢复上传
  resumeLoad(resource: IResource) {
    this.resumeMultipartUpload(resource)
  }
  resumeMultipartUpload(resource: IResource | IResource[]) {
    if (Array.isArray(resource)) {
      // TODO:
      return
    }

    if (!('progress' in resource)) {
      return console.error('resume resource must have progress property')
    }

    if (!('abortCheckpoint' in resource)) {
      return console.error('resume resource must have abortCheckpoint property')
    }

    if (resource.progress! < this.options.maxProgress) {
      this.partUpload(resource, { checkpoint: resource.abortCheckpoint })
    }
  }

  createFileName(name: string) {
    return this.credentials.dir + WXPOSS.randomFileName() + '-' + name
  }

  destroy() {
    this.ossClient?.cancel()
    this.ossClient = null
    
    this.loadingPromise = null
    this.clearProgressTimer()
  }

  // ---- 工具函数 ----
  // 随机生成文件名称
  static randomFileName(prefix = ''): string {
    const time = Date.now()
    const random = Math.floor(Math.random() * 1000)

    WXPOSS.uid++

    return prefix + '_' + random + WXPOSS.uid + time
  }

  // https://stackoverflow.com/questions/332872/encode-url-in-javascript
  static encodeName(str: string) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+')
  }

  // 工厂函数
  static create(opts: IOSSOption = {}) {
    return new WXPOSS(opts)
  }

  // https://googlechrome.github.io/samples/network-information/
  static bindNetwork() {
    navigator.connection.addEventListener('change', changeHandler)

    function changeHandler() {
      WXPOSS.uploadSpeedBPS = (navigator.connection.downlink * 1024 * 1024) / 8
    }

    changeHandler()
  }
}


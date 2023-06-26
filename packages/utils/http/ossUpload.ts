/**
 * @file 基于OSS的上传SDK
 * @doc
 * - https://help.aliyun.com/document_detail/383950.html
 * - https://github.com/ali-sdk/ali-oss
 */

import { loadScriptFromRemote } from '../dom'

interface IResource {
  file: File // required
  id?: string
  name?: string

  onBeforeLoad?(): any
  onProgress?(percent: number | string): any
  onComplete?(data: any): any
  onError?(error: string | Error): any

  // SDK写入的
  _cptUploadId?: number | string // 断点
  _uniqueName?: string // filename
}

// @example
// accessKeyId: "STS"
// accessKeySecret: ""
// securityToken: ""
// bucketName: ""
// expiration: ""
// dir: ""
// host: ""

// 后端下发的临时访问凭证
interface ICredential {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  bucketName: string
  expiration?: string
  dir?: string
  host?: string
  endpoint?: string
}

export interface IOption {
  endpoint?: string
  timeout?: number
  maxRetryTimes?: number // SDK 自己会重试
  refreshInterval?: number
  // 以上是OSS instance的配置

  partSize?: number
  parallel?: number
  partLimit?: number
  partMIME?: string
  fakeProgress?: boolean
  // 业务指定的SDK地址，通过 script 加载
  sdkUrl?: string
  // 业务指定的临时凭证的API
  getOssAccessKey?: () => Promise<any>
}

const DEFAULT_CONFIG = {
  endpoint: 'oss-accelerate.aliyuncs.com',
  // instance level timeout for all operations, SDK 默认 1min
  timeout: 2 * 60 * 1000, // 2min
  // retry when request error is net error or timeout, SDK 默认 0
  maxRetryTimes: 2,
  // SDK 默认 5min
  refreshInterval: 30 * 60 * 1000, // 30min
  // 以上是OSS instance的配置

  // 设置并发上传的分片数量;
  parallel: 4,
  // 设置分片大小 0.5M; SDK 默认值为 1 MB，最小值为 100 KB
  partSize: 512 * 1024,
  // 分片断点 15 MB; SDK 建议 100M
  partLimit: 15 * 1024 * 1024,
  // 简单上传的虚拟进度条
  fakeProgress: false,
  // 业务指定的SDK地址，通过 script 加载
  sdkUrl: '',
}

export class MyOSSNext {
  ossClient: any

  credentials: ICredential

  options: IOption

  // 多文件的断点
  checkpoints = {}

  // 缓存需要进度条的简单上传列表
  progressListInSimpleMode: any[] = []
  //
  progressTimer: number | undefined

  // 简单上传, 上行速度默认值
  static uploadSpeedBPS = 10 * 1024 * 1024

  constructor(options: IOption = {}) {
    this.options = {
      ...DEFAULT_CONFIG,
      ...options,
    }

    this.credentials = {} as ICredential

    MyOSSNext.bindNetwork()
  }

  // ---- 初始化OSS客户端 ----
  private initAliOSSClient(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.destroy()

      const res = await this.options.getOssAccessKey!()
      if (res?.data?.code !== 200) {
        return reject()
      }

      this.credentials = res.data.data || {}

      const { accessKeyId, accessKeySecret, securityToken, bucketName, endpoint } =
        res.data.data || {}

      // @ts-ignore
      this.ossClient = new OSS({
        accessKeyId,
        accessKeySecret,
        stsToken: securityToken,
        bucket: bucketName,
        timeout: this.options?.timeout,
        retryMax: this.options?.maxRetryTimes,

        endpoint: endpoint || this.options?.endpoint,
        refreshSTSTokenInterval: this.options?.refreshInterval,
        refreshSTSToken: async () => {
          const res = await this.options.getOssAccessKey!()
          if (res?.data?.code !== 200) {
            return {}
          }

          this.credentials = res.data.data || {}

          const { accessKeyId, accessKeySecret, securityToken } = res.data.data || {}

          return { accessKeyId, accessKeySecret, securityToken }
        },
      })

      resolve()
    })
  }
  async ensureOSSClient() {
    if (!this.options?.sdkUrl) {
      return console.warn('SDK URL is required')
    }

    if (!this.ossClient) {
      await loadScriptFromRemote(this.options.sdkUrl)!.then(() => this.initAliOSSClient())
    }
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
  private add2ProgressList(resource: IResource) {
    this.progressListInSimpleMode.push({ resource, timestamp: Date.now(), fakeSize: 0 })
  }
  private removeFromProgressList(resource: IResource) {
    this.progressListInSimpleMode = this.progressListInSimpleMode.filter(
      (n: any) => n.resource!.id !== resource.id
    )
  }
  private clearProgressTimer() {
    this.progressTimer && clearInterval(this.progressTimer)
    this.progressTimer = undefined
    this.progressListInSimpleMode = []
  }

  // ---- 上传中心 ----
  // 批量上传
  batchUpload(resourceList: IResource[]) {
    resourceList.forEach(resource => {
      this.autoUpload(resource)
    })
  }

  // 无脑上传单个文件，内部自动判断是简单、分片
  autoUpload(resource: IResource) {
    const { file } = resource

    if (file.size > (this.options.partLimit || 0)) {
      this.partUpload(resource)
    } else {
      this.simpleUpload(resource)
    }
  }

  // --- case 1 简单上传
  async simpleUpload(resource: IResource): Promise<{ url: string; file: File } | undefined> {
    console.log('simple upload')

    // 开始上传回调
    this.onBeforeLoad(resource)

    try {
      await this.ensureOSSClient()
    } catch (e: any) {
      this.onError(e, resource)
      return
    }

    // 进度条模拟
    if (this.options?.fakeProgress) {
      this.add2ProgressList(resource)

      if (!this.progressTimer) {
        this.progressTimer = setInterval(() => {
          if (!this.progressListInSimpleMode.length) {
            return this.clearProgressTimer()
          }

          this.progressListInSimpleMode.forEach(item => {
            // byte per sec * seconds / total size
            item.fakeSize += (MyOSSNext.uploadSpeedBPS * (Date.now() - item.timestamp)) / 1024

            // 不能给满的，因为是假的进度
            const fakeProgress = Math.min(
              99,
              Math.floor((item.fakeSize / item.resource.file.size) * 100)
            )

            this.onProgress(fakeProgress, item.resource)

            item.timestamp = Date.now()

            // 进度条满了，不需要在监听了
            if (fakeProgress >= 99) {
              this.removeFromProgressList(item.resource)
            }
          })
        }, 120)
      }
    }

    //
    const { file } = resource || {}
    const dir = this.credentials?.dir || ''
    const fileName = this.createFileName(file.name, file?.uid)

    return this.ossClient
      .put(dir + fileName, file)
      .then((res: any) => {
        const url = `${this.credentials.host}/${dir}${fileName}`

        const data = { url, file }

        this.removeFromProgressList(resource)

        // 上传成功回调
        this.onComplete(data, resource)

        return data
      })
      .catch((err: string | Error) => {
        console.log('SimpleUploadError', err, resource)

        this.removeFromProgressList(resource)

        this.onError(err, resource)
      })
  }

  // --- case 2 分片上传
  async partUpload(resource: IResource) {
    console.log('part upload')

    // 开始上传回调
    this.onBeforeLoad(resource)

    try {
      await this.ensureOSSClient()
    } catch (e: any) {
      this.onError(e, resource)
      return
    }

    this.startPartUpload(resource)
  }
  private startPartUpload(resource: IResource) {
    const { file, _uniqueName } = resource

    const dir = this.credentials?.dir || ''
    const fileName = this.createFileName(file.name, file?.uid)
    // for 断点续传
    resource._uniqueName = _uniqueName || dir + fileName

    return this.ossClient
      .multipartUpload(resource._uniqueName, file, {
        parallel: this.options.parallel,
        partSize: this.options.partSize,
        progress: (p: number, cpt: any) => {
          this.onProgress(Math.floor(p * 100), resource)

          if (cpt) {
            this.checkpoints[cpt.uploadId] = cpt

            resource._cptUploadId = cpt.uploadId
          }
        },
        // 设置MIME
        ...(this.options.partMIME ? { mime: this.options.partMIME } : null),
        // 设置断点
        ...(resource._cptUploadId && this.checkpoints[resource._cptUploadId]
          ? { checkpoint: this.checkpoints[resource._cptUploadId] }
          : null),
      })
      .then(() => {
        const url = `${this.credentials.host}/${dir}${fileName}`

        const data = { url, file }

        // 上传成功回调
        this.onComplete(data, resource)

        return data
      })
      .catch(async (err: any) => {
        console.log('PartUploadError', err, resource)

        this.abortPartUpload(resource)

        this.onError(err, resource)
      })
  }
  // case 3 暂停续传
  abortPartUpload(resource: IResource) {
    if (!resource?._uniqueName) return

    const uploadId = (resource?._cptUploadId && this.checkpoints[resource._cptUploadId])?.uploadId
    if (!uploadId) {
      return
    }

    try {
      this.ossClient.abortMultipartUpload(resource?._uniqueName, uploadId)
    } catch (e) {}
  }

  private createFileName(name: string, uid?: string) {
    // 优先使用文件的uid，但是因为其他浏览器的兼容性问题，拿不到uid就取时间戳随机数
    const fileUid = uid ? uid : Date.now() + parseInt(Math.random() * 10000, 10)
    return fileUid + '.' + name.substring(name.lastIndexOf('.') + 1)
  }

  destroy() {
    console.log('destroy oss client', this.ossClient)

    this.ossClient?.cancel()
    this.ossClient = null

    // @ts-ignore
    this.credentials = {}
    this.checkpoints = {}

    this.clearProgressTimer()
  }

  // 工厂函数
  static create(opts: IOption = {}) {
    return new MyOSSNext(opts)
  }

  // https://googlechrome.github.io/samples/network-information/
  static bindNetwork() {
    if (!navigator.connection?.downlink) {
      return
    }

    navigator.connection.addEventListener('change', changeHandler)

    function changeHandler() {
      MyOSSNext.uploadSpeedBPS = (navigator.connection.downlink * 1024 * 1024) / 8
    }

    changeHandler()
  }
}

import { isFunction } from './is'

interface IOption {
  container: HTMLElement
  url: string
  width: number
  height: number
  poster?: string
  preload?: string

  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  // 创建的时候就加载资源
  loadWhenCreate: boolean
  // 是否需要前端预读取时长
  needDuration?: boolean

  onLoadedMetadata?: (duration: number) => void
  onLoadedData?: () => void
  onSeeking?: () => void
  onSeeked?: () => void
  onWaiting?: () => void
  onPlaying?: () => void
  onProgress?: (progress: number) => void
  onPlay?: () => void
  onPause?: () => void
  onAbort?: () => void
  onEnd?: () => void
  onError?: (err: Error) => void
}

const DEFAULT_OPTIONS = {
  preload: 'metadata',
  autoplay: false,
  loop: false,
  muted: false,
  controls: false,
  poster: '',
  needDuration: false,
  loadWhenCreate: false,
}

export class MyVideo {
  elem: HTMLVideoElement | undefined | null

  options: IOption

  duration: number = 0

  timer: null | number = null

  constructor(options: IOption) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    this.init()
  }

  async init() {
    this.elem = this.createVideo()

    this.bindEvents()

    this.options.container.appendChild(this.elem)
  }

  createVideo() {
    const video = document.createElement('video')

    video.setAttribute('preload', this.options.preload!)

    if (this.options.poster) {
      video.setAttribute('poster', this.options.poster)
    }

    if (this.options.autoplay) {
      video.setAttribute('autoplay', 'true')
    }

    if (this.options.muted) {
      video.muted = true
    }

    if (this.options.loop) {
      video.setAttribute('loop', 'true')
    }

    video.src = this.options.url
    video.width = this.options.width
    video.height = this.options.height

    if (this.options.loadWhenCreate) {
      video.load()
    }

    return video
  }

  bindEvents() {
    if (!this.elem) return

    this.elem.addEventListener('loadedmetadata', () => {
      console.log('loadedmetadata')

      const duration = this.elem ? this.elem!.duration * 1000 : 0

      this.duration = duration

      typeof this.options.onLoadedMetadata == 'function' && this.options.onLoadedMetadata(duration)
    })

    this.elem.addEventListener('loadeddata', () => {
      typeof this.options.onLoadedData == 'function' && this.options.onLoadedData(duration)
    })

    this.elem.addEventListener('seeking', () => {
      typeof this.options.onSeeking == 'function' && this.options.onSeeking()
    })
    this.elem.addEventListener('seeked', () => {
      typeof this.options.onSeeked == 'function' && this.options.onSeeked()
    })

    this.elem.addEventListener('timeupdate', () => {
      this.timer && cancelAnimationFrame(this.timer)

      const step = () => {
        // float second
        const currentTime = this.elem ? this.elem!.currentTime * 1000 : 0

        typeof this.options.onProgress == 'function' && this.options.onProgress(currentTime)

        this.timer = window.requestAnimationFrame(step)
      }
      step()
    })

    // Fired when playback has stopped because of a temporary lack of data.
    this.elem.addEventListener('waiting', () => {
      this.clearTimer()

      typeof this.options.onWaiting == 'function' && this.options.onWaiting()
    })
    // Fired when playback is ready to start after having been paused or delayed due to lack of data
    this.elem.addEventListener('playing', () => {
      typeof this.options.onPlaying == 'function' && this.options.onPlaying()
    })
    this.elem.addEventListener('play', () => {
      typeof this.options.onPlay == 'function' && this.options.onPlay()
    })
    this.elem.addEventListener('pause', () => {
      this.clearTimer()

      typeof this.options.onPause == 'function' && this.options.onPause()
    })

    // the resource was not fully loaded, but not as the result of an error.
    this.elem.addEventListener('abort', () => {
      console.log('abort')

      this.clearTimer()

      typeof this.options.onAbort == 'function' && this.options.onAbort()
    })
    this.elem.addEventListener('ended', () => {
      console.log('ended')

      this.clearTimer()

      typeof this.options.onEnd == 'function' && this.options.onEnd()
    })
    // Fired when the resource could not be loaded due to an error.
    this.elem.addEventListener('error', e => {
      this.clearTimer()

      typeof this.options.onError == 'function' && this.options.onError(e)
    })
  }

  play() {
    if (!this.elem) return

    if (!this.elem.paused) return

    // ready to play for the next frame
    if (this.elem.readyState <= 2) return

    this.elem.play()
  }

  pause() {
    if (!this.elem) return

    if (this.elem.paused) return

    this.elem.pause()
  }

  openMute() {
    if (!this.elem) return
    this.elem.muted = true
  }

  closeMute() {
    if (!this.elem) return
    this.elem.muted = false
  }

  seek(progress: number) {
    if (!this.elem || !this.duration) return
    this.elem.currentTime = (progress * this.duration) / 1000
  }

  clearTimer() {
    this.timer && cancelAnimationFrame(this.timer)
  }

  destroy() {
    this.clearTimer()
    this.elem = null
  }
}

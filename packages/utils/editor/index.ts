import { EventEmitter } from 'eventemitter3'
import { getElementViewOffset, setCSS } from '../dom'
import { DragListener } from '../dom/drag'
import { isNullOrUndef, isString, isUrl } from '../is'
import { Video } from '../video'

type IOption = {
  url: string,
  canvasId: any
  width: number
  height: number
  background: string
  type: EDITOR_TYPE,
}

export enum EDITOR_TYPE {
  IMAGE = 1,
  VIDEO = 2
}

export enum EDITOR_PRESET_BG {
  GAUSSIAN = 'gaussian',
  BLACK = 'black',
  WHITE = 'white',
  CUSTOM = 'custom'
}

export enum CLIP_MODE {
  COVER = 1,
  CONTAIN = 2,
  WIDTH = 3,
  HEIGHT = 4,
}

const BLUR_RADIUS = 20

export class Editor extends EventEmitter {
  options
  canvas
  type
  
  private _objects: ObjectLayer[] = []
  
  private _canvasWidth
  private _canvasHeight
  private _canvasStyleWidth
  private _canvasStyleHeight
  
  private _background
  private _blurBackground
  private _blurContext

  currentTime = 0
  duration = 0
  
  baseContainerRatio

  constructor(options: IOption) {
    super()
    this.options = options
    this.type = options.type
    this.canvas = isString(options.canvasId) ? document.querySelector(options.canvasId) : options.canvasId
    this.restore()
  }
  
  get defaultOption() {
    return {
      background: 'rgba(0, 0, 0, 1)',
    }
  }
  get isVideo() {
    return this.type == EDITOR_TYPE.VIDEO
  }
  get isImage() {
    return this.type == EDITOR_TYPE.IMAGE
  }

  // --- 画布尺寸 CSS Layout
  set width(w: number) {
    this._canvasStyleWidth = w
    this.canvas.style.width = this._canvasStyleWidth + 'px'
  }
  get width() {
    return this._canvasStyleWidth
  }
  set height(h: number) {
    this._canvasStyleHeight = h
    this.canvas.style.height = this._canvasStyleHeight  + 'px'
  }
  get height() {
    return this._canvasStyleHeight
  }
  
  // -- 画布背景颜色 color or image url or video url
  set background(color: string) {
    this._background = color
    
    console.log('set background', color)
    
    // 背景是图片、视频，则高斯模糊
    if (isUrl(color)) {
      if (this.isImage) {
        this._drawBgWithBlurImage(color)
      }
  
      else if (this.isVideo) {
        this._drawBgWithBlurVideo(color)
      }

      this._showBlurBg()
    } else {
      this._hideBlurBg()
      this.canvas.style.background = color
    }
  }
  get background() {
    return this._background
  }
  private _drawBgWithBlurVideo(url: string) {
    if (!this._blurBackground) {
      const realCanvas = document.createElement('canvas')

      realCanvas.id = 'mogic-video-edit-blur'
      realCanvas.width = this.width
      realCanvas.height = this.height
      this.canvas.insertBefore(realCanvas, this.canvas.firstChild)
      
      this._blurBackground = realCanvas
      this._blurContext = this._blurBackground.getContext('2d')
      this._blurContext.filter = `blur(${BLUR_RADIUS}px)`
      
      this._drawVideoFrame()
    }
  }
  private _drawVideoFrame() {
    // 没有选择高斯模糊，没必要绘制
    if (!isUrl(this.background) || !this._blurContext) return
    
    const vLayer = this.getActiveObj() as VideoLayer

    if (!vLayer.videoIns?.elem) {
      return console.log('_drawVideoFrame video is not ready')
    }

    try {
      const { left, top, width, height } = vLayer.getPositionByMode(CLIP_MODE.COVER)
      
      this._blurContext.drawImage(vLayer.videoIns?.elem,left, top, width, height)
    } catch (e) {
      console.log('_drawVideoFrame', e)
    }
  }
  
  private _drawBgWithBlurImage(url: string) {
    if (!this._blurBackground) {
      const div = document.createElement('div')

      div.className = 'mogic-image-edit-blur'
      this._blurBackground = div
      
      setCSS(div, {
        backgroundImage: `url(${url})`,
      })
      this.canvas.insertBefore(div, this.canvas.firstChild)
    }
  }
  private _hideBlurBg() {
    if (!this._blurBackground) return
    this._blurBackground.style.display = 'none'
  }
  private _showBlurBg() {
    if (!this._blurBackground) return
    this._blurBackground.style.display = 'block'
  }

  // --- 添加绘制对象
  loadImageFromUrl(url: string, config?) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      
      img.draggable = false
      
      img.onload = () => {
        resolve(new ImageLayer(img, {
          container: this,
          config,
        }))
      }

      img.onerror = (e) => { reject(e) }
      
      img.src = url
    })
  }
  loadVideoFromUrl(url: string, config) {
    return new Promise((resolve) => {
      const videoIns = new Video({
        url,
        onProgress: (c: number) => {
          this.currentTime = c
          
          this.emit('onProgress', c)
          
          this._drawVideoFrame()
        },
        onLoadedMetadata: (d: number) => {
          this.duration = d
          
          this.emit('onLoadedMetadata', d)
          
          resolve(new VideoLayer(videoIns, {
            container: this,
            config,
          }))
        },
        onPlay: () => {
          this.emit('play')
        },
        onPause: () => {
          this.emit('pause')
        }
      })
    })
  }
  addObject(obj: ImageLayer | VideoLayer) {
    this._add(obj)
  }
  addImage(obj: ImageLayer) {
    this._add(obj)
  }
  addVideo(obj: VideoLayer) {
    this._add(obj)
  }
  private _add(obj: ObjectLayer) {
    this._objects.push(obj)
    this.canvas.appendChild(obj.elem)
    this.canvas.appendChild(obj.controlElem)
  }
  // 目前就一个
  getActiveObj() {
    return this._objects[0]
  }

  // --- 重置、更新画布
  private _getParentRect() {
    // TODO IMPROVE PERF: 容器的宽、高
    const parentNode = this.canvas.parentNode
    const { width, height } = getElementViewOffset(parentNode)
    
    return {
      width,
      height
    }
  }
  resize(nextCanvasW, nextCanvasH?) {
    const { width, height } = this._getParentRect()

    // 画布的宽、高
    this._canvasWidth = nextCanvasW || this._canvasWidth
    this._canvasHeight = nextCanvasH || this._canvasHeight

    // 短边为准，这样画布可以 contain 在容器
    const ratioX = width / this._canvasWidth
    const ratioY = height / this._canvasHeight
    
    this.baseContainerRatio = Math.min(ratioX, ratioY)
    console.log('min canvas ratio', ratioX, ratioY)

    // 竖版，水平居中显示
    if (ratioX > ratioY) {
      this.height = height
      this.width = ratioY * this._canvasWidth
    } else {
      // 横版，垂直居中显示
      this.width = width
      this.height = ratioX * this._canvasHeight
    }

    this.emit('resize', this.width, this.height)
  }
  // 重置画布
  restore() {
    // 调整画布大小
    this.resize(this.options.width, this.options.height)

    // 设置画布背景色
    this.background = this.options.background || this.defaultOption.background
    
    // 重置所有对象
    this._objects?.forEach(o => o.render())
  }
  // 更新画布
  renderAll() {
    this._objects.forEach((o: ObjectLayer) => o.render())
  }

  // --- 序列化&反序列化
  toJSON() {
    const child = this._objects.map((o: ObjectLayer) => o.toJSON())
    
    return {
      width: this._canvasWidth,
      height: this._canvasHeight,
      
      styleWidth: this.width,
      styleHeight: this.height,
      
      background: this.background,
      ratio: this.baseContainerRatio,
      child,
    }
  }
  loadFromObject(json: any) {}

  // --- 视频相关
  play() {
    if (this.isVideo) {
      const obj = this.getActiveObj() as VideoLayer
      obj?.videoIns.play()
    }
  }
  pause() {
    if (this.isVideo) {
      const obj = this.getActiveObj() as VideoLayer
      obj?.videoIns.pause()
    }
  }
  openMute() {
    if (this.isVideo) {
      const obj = this.getActiveObj() as VideoLayer
      obj?.videoIns.openMute()
      this.emit('muteOn')
    }
  }
  closeMute() {
    if (this.isVideo) {
      const obj = this.getActiveObj() as VideoLayer
      obj?.videoIns.closeMute()
      this.emit('muteOff')
    }
  }
  
  // --- 销毁一切
  destroy() {
    // empty style
    setCSS(this.canvas, {
      width: 0,
      height: 0,
      background: 'none',
    })
    this._canvasStyleWidth = 0
    this._canvasStyleHeight = 0
    this._canvasWidth = 0
    this._canvasHeight = 0

    this._background = ''
    try {
      if (this.canvas && this._blurBackground) {
        this.canvas.removeChild(this._blurBackground)
      }
    } catch (e) {}
    this._blurBackground = null

    this._objects.forEach((o) => o.destroy())
    this._objects = []

    this.off('onLoadedMetadata')
    this.off('onProgress')
    this.off('play')
    this.off('pause')
    this.off('muteOn')
    this.off('muteOff')
    this.off('resize')
    this.off('dragEnd')
  }
}

class ObjectLayer {
  id
  elem
  controlElem
  editor: Editor | null
  
  defaultPosition

  width
  height
  scaleX = 1
  scaleY = 1
  left = 0
  top = 0
  naturalWidth
  naturalHeight

  private _dragger
  
  static __uid = 0

  constructor(elem: HTMLImageElement | HTMLVideoElement, options) {
    this.elem = elem
    
    this._createControl()
    
    this.editor = options?.container
    
    if (options.config.defaultPosition) {
      const { left, top, width, height } = options.config.defaultPosition
      
      this.defaultPosition = {
        left: left * this.editor!.baseContainerRatio,
        top: top * this.editor!.baseContainerRatio,
        width: width * this.editor!.baseContainerRatio,
        height: height * this.editor!.baseContainerRatio,
      } 
    }

    this.id = ++ObjectLayer.__uid

    this._bindDrag()
  }

  private _createControl() {
    this.controlElem = document.createElement('div')
    
    this.controlElem.className = 'mogic-image-edit-control'
    
    const controlHTML = `
       <span class="mogic-image-edit-control-corner tl"></span>
       <span class="mogic-image-edit-control-corner tr"></span>
       <span class="mogic-image-edit-control-corner br"></span>
       <span class="mogic-image-edit-control-corner bl"></span>
    `
    this.controlElem.innerHTML = controlHTML
  }
  
  // 拖拽、缩放
  private _bindDrag() {
    this._dragger = new DragListener(this.controlElem)
    
    let startX, startY, startW, startH, isCornerTL, isCornerTR, isCornerBR, isCornerBL 
    
    this._dragger.on('dragStart', (e) => { 
      isCornerTL = e.target.classList?.contains('tl')
      isCornerTR = e.target.classList?.contains('tr')
      isCornerBR = e.target.classList?.contains('br')
      isCornerBL = e.target.classList?.contains('bl')

      startX = this.left
      startY = this.top
      
      startW = this.width
      startH = this.height
    })
    
    this._dragger.on('drag', (x, y) => { 
      if (isCornerTL) {
        const isZoomIn = x < 0 && y < 0

        const offsetX = (isZoomIn ? 1 : -1) * Math.round(Math.abs(x))
        const offsetY = (isZoomIn ? 1 : -1) * this.naturalHeight / this.naturalWidth * Math.round(Math.abs(x))

        const nextW = startW + offsetX
        const nextH = startH + offsetY

        this.render({
          left: startX - offsetX,
          top: startY - offsetY,
          width: nextW,
          height: nextH,
          scaleX: nextW / this.naturalWidth,
          scaleY: nextH / this.naturalHeight,
        })

        this.editor!.canvas.style['cursor'] = 'nwse-resize'
        this.controlElem.style['cursor'] = 'nwse-resize'
        return
      } 

      else if (isCornerTR) {
        const isZoomIn = x > 0 && y < 0

        const offsetX = (isZoomIn ? 1 : -1) * Math.round(Math.abs(x))
        const offsetY = (isZoomIn ? 1 : -1) * this.naturalHeight / this.naturalWidth * Math.round(Math.abs(x))

        const nextW = startW + offsetX
        const nextH = startH + offsetY

        this.render({
          left: startX,
          top: startY - offsetY,
          width: nextW,
          height: nextH,
          scaleX: nextW / this.naturalWidth,
          scaleY: nextH / this.naturalHeight,
        })
        
        this.editor!.canvas.style['cursor'] = 'nesw-resize'
        this.controlElem.style['cursor'] = 'nesw-resize'
        return
      }

      else if (isCornerBR) {
        const isZoomIn = x > 0 && y > 0

        const offsetX = (isZoomIn ? 1 : -1) * Math.round(Math.abs(x))
        const offsetY = (isZoomIn ? 1 : -1) * this.naturalHeight / this.naturalWidth * Math.round(Math.abs(x))

        const nextW = startW + offsetX
        const nextH = startH + offsetY

        this.render({
          left: startX,
          top: startY,
          width: nextW,
          height: nextH,
          scaleX: nextW / this.naturalWidth,
          scaleY: nextH / this.naturalHeight,
        })

        this.editor!.canvas.style['cursor'] = 'nesw-resize'
        this.controlElem.style['cursor'] = 'nesw-resize'
        return
      }
      
      else if (isCornerBL) {
        const isZoomIn = x < 0 && y > 0

        const offsetX = (isZoomIn ? 1 : -1) * Math.round(Math.abs(x))
        const offsetY = (isZoomIn ? 1 : -1) * this.naturalHeight / this.naturalWidth * Math.round(Math.abs(x))

        const nextW = startW + offsetX
        const nextH = startH + offsetY

        this.render({
          left: startX - offsetX,
          top: startY,
          width: nextW,
          height: nextH,
          scaleX: nextW / this.naturalWidth,
          scaleY: nextH / this.naturalHeight,
        })

        this.editor!.canvas.style['cursor'] = 'nesw-resize'
        this.controlElem.style['cursor'] = 'nesw-resize'
        return
      }
      
      else {
        this.move(startX + x, startY + y)
      }
    })

    this._dragger.on('dragEnd', () => {
      this.editor!.canvas.style['cursor'] = 'default'
      this.controlElem.style['cursor'] = 'grab'
      
      this.editor!.emit('dragEnd')
    })
  }

  // ----
  _set(key, val?) {
    if (typeof key == 'object') {
      Object.keys(key).forEach((k) => this._set(k, key[k]))
    } else {
      this[key] = val
    }
  }
  
  draw(o: { left?, top?, scaleX?, scaleY?, width?, height? }) {
    Object.keys(o).forEach(k => {
      this._set(k, o[k])

      if (k != 'scaleX' && k != 'scaleY') {
        setCSS(this.elem, {
          position: 'absolute',
          [k]: `${o[k]}px`
        })

        setCSS(this.controlElem, {
          position: 'absolute',
          [k]: `${o[k]}px`
        })
      }
    })
  }

  render(overrideConfig?) {
    this.draw(overrideConfig || this.defaultPosition || this.getPositionByMode(CLIP_MODE.COVER))
  }
  
  // ---
  getPositionByMode(cmode: CLIP_MODE, scaleX = 1, scaleY = 1) {
    const ratioX = this.editor!.width / this.naturalWidth
    const ratioY = this.editor!.height / this.naturalHeight

    let imgWidth, imgHeight
    
    const widthBase = cmode == CLIP_MODE.COVER ? ratioX > ratioY : cmode == CLIP_MODE.WIDTH
    
    if (widthBase) {
      imgWidth = this.editor!.width * scaleX
      imgHeight = ratioX * this.naturalHeight * scaleY
    } else {
      imgHeight = this.editor!.height * scaleY
      imgWidth = ratioY * this.naturalWidth  * scaleX
    }

    const left = (this.editor!.width - imgWidth) / 2
    const top = (this.editor!.height - imgHeight) / 2

    return {
      left,
      top,
      width: imgWidth,
      height: imgHeight,
      scaleX,
      scaleY
    }
  }
  
  move(left?, top?) {
    if (!isNullOrUndef(left)) {
      this.draw({ left, })
    }

    if (!isNullOrUndef(top)) {
      this.draw({ top, })
    }
  }

  scale(x, y) {
    const imgWidth = this.naturalWidth * x
    const imgHeight = this.naturalHeight * y

    const left = (this.editor!.width - imgWidth) / 2
    const top = (this.editor!.height - imgHeight) / 2

    this.draw({ 
      left, 
      top, 
      width: imgWidth,
      height: imgHeight,
      scaleX: x,
      scaleY: y
    })
  }
  
  // 高度撑满, 重新绘制
  fitHeight() {
    const r = this.getPositionByMode(CLIP_MODE.HEIGHT)
    this.draw(r)
  }
  
  // 宽度撑满, 重新绘制
  fitWidth() {
    const r = this.getPositionByMode(CLIP_MODE.WIDTH)
    this.draw(r)
  }
  
  // ----
  toJSON() {
    return {
      url: this.elem.src,
      width: Math.round(this.width / this.editor!.baseContainerRatio),
      height: Math.round(this.height / this.editor!.baseContainerRatio),
      left: Math.round(this.left / this.editor!.baseContainerRatio),
      top: Math.round(this.top / this.editor!.baseContainerRatio),
      
      naturalWidth: this.naturalWidth,
      naturalHeight: this.naturalHeight,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
    }
  }

  destroy() {
    if (this.editor?.canvas) {
      this.editor.canvas?.removeChild(this.elem)
      this.editor.canvas?.removeChild(this.controlElem)
    }

    this.editor = null

    this.elem = null
    this.controlElem = null
  }
}

class ImageLayer extends ObjectLayer {
  constructor(elem: HTMLImageElement, options) {
    super(elem, options)
    
    this.naturalWidth = elem.naturalWidth
    this.naturalHeight = elem.naturalHeight
  }
}

class VideoLayer extends ObjectLayer {
  videoIns
  
  constructor(videoIns: Video, options) {
    // @ts-ignore
    super(videoIns.elem, options)

    this.naturalWidth = videoIns.elem?.videoWidth
    this.naturalHeight = videoIns.elem?.videoHeight

    this.videoIns = videoIns
  }

  destroy() {
    this.videoIns?.destroy()
    super.destroy()
  }
}

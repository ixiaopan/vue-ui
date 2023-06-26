// 滚动滚轮 = Y 方向滚动
// left click || 按住滚轮拖拽 = 拖拽画布
// Ctrl/Command(mac) + 滚轮 = 放大、缩小

import { EventEmitter } from 'eventemitter3'
import { getElementViewOffset, throttle, setCSS } from '../dom'

interface IOption {
  container: HTMLElement
  url: string
  minZoom: number
  maxZoom: number
  step: number
  enableWheel?: boolean
  enableDrag?: boolean
}

export enum FIT_MODE {
  ORIGINAL_SIZE = 'ORIGINAL_SIZE',
  AUTO_FIT_VIEW ='AUTO_FIT_VIEW',
}

enum CURSOR_TYPE {
  GRAB = 'grab',
  GRABBING = 'grabbing',
  DEFAULT = 'default',
}

enum SCROLL_BAR_DIR  {
  VERTICAL = 1,
  HORIZONTAL,
}

// 
const OFFSET_PER_WHEEL = 2

export class MyZoom extends EventEmitter {
  options: IOption

  private _bindMouseWheel
  private _bindKeyDown
  private _bindKeyUp
  private _cancelResize
  
  elem: HTMLImageElement | undefined
  width
  height
  scaleValue = 100
  
  // 正值
  left = 0
  // 负值
  top = 0

  private _naturalWidth = 1
  private _naturalHeight = 1
  private _containerWidth = 1
  private _containerHeight = 1

  private _ctrlPressed = false

  private _horizontalBar
  private _verticalBar

  constructor(opts: IOption) {
    super()

    this.options = opts

    const { container } = this.options
    if (!container) {
      console.error('container is null')
      return
    }
    // 初始化容器
    setCSS(this.options.container, { position: 'relative' })

    // 加载图片
    this._loadImageFromUrl(this.options.url)

    // 创建虚拟滚动条
    this._horizontalBar = new ScrollBar({
      dir: SCROLL_BAR_DIR.HORIZONTAL,
      app: this,
    })
    this._verticalBar = new ScrollBar({
      dir: SCROLL_BAR_DIR.VERTICAL,
      app: this,
    })

    // 绑定手势、鼠标等交互
    if (this.options.enableWheel) {
      this._bindWheel()
    }
    if (this.options.enableDrag) {
      this._bindDrag()
    }
  }

  private _resizeContainer() {
    const { width, height } = getElementViewOffset(this.options.container)
    this._containerWidth = width
    this._containerHeight = height
  }

  private _loadImageFromUrl(url: string) {
    const imageElement = document.createElement('img')
    
    imageElement.draggable = false

    this.elem = imageElement

    imageElement.onload = () => {
      this._naturalWidth = imageElement.naturalWidth
      this._naturalHeight = imageElement.naturalHeight

      // 重新算一下，在这里容器的layout就该准备好了
      this._resizeContainer()
      this.autoFit()
      this._cancelResize = this._bindResize()

      this.options.container.appendChild(imageElement)

      this.emit('scaler:init', this.scaleValue)
    }

    imageElement.onerror = () => {}
    
    imageElement.src = url
  }

  get remainedBottom() {
    return this.height - this._containerHeight + this.top
  }
  get remainedRight() {
    return this.width - this._containerWidth + this.left
  }

  // 容器大小发生变化
  _bindResize() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target == this.options.container) {
          this._resizeContainer()
          this._render(this.width, this.height)
          break
        }
      }
    })
    
    resizeObserver.observe(this.options.container)

    return () => {
      if (this.options.container) {
        resizeObserver.unobserve(this.options.container)
      }
      resizeObserver.disconnect()
    }
  }

  // --- 手势绑定
  private _bindWheel() {
    const _zoomOut = () => {
      this.zoomOut()
      this.emit('zoom:change', this.scaleValue)
    }
    const _zoomIn = () => {
      this.zoomIn()
      this.emit('zoom:change', this.scaleValue)
    }
    const _zoomHandler = throttle((e) => {
      // 缩小/向上
      if (e.deltaY > 0) {
        _zoomOut()
      }
      
      // 放大/向下
      else if (e.deltaY < 0) {
        _zoomIn()
      }
    }, 10)
    this._bindMouseWheel = (e: any) => {
      // 阻止默认行为
      e.preventDefault()
    
      // 同方向 左右
      // 8 是 threshold，不然向下滚动也会触发这里，这就太灵敏了
      if (this._shouldGrabX() && (e.deltaX < -8 || e.deltaX > 8)) {
        const nextLeft = this.left + (-1 * e.deltaX) * OFFSET_PER_WHEEL
        this.moveTo(nextLeft, this.top)
        return
      }
      
      // 滚轮触发 放大缩小
      // - 双指不同方向, e.ctrlKey 为 true
      // - 同方向 上下&按住了ctrl/command
      if (e.ctrlKey || this._ctrlPressed) {
        _zoomHandler(e)
      }

      // 同方向 上下 >0 向下
      else if (this._shouldGrabY() && (e.deltaY > 0 || e.deltaY < 0)) {
        const nextTop = this.top + (-1 * e.deltaY) * OFFSET_PER_WHEEL
        this.moveTo(this.left, nextTop)
      }
    }
    this.options.container.addEventListener('wheel', this._bindMouseWheel, { passive: false })

    // 监听键盘
    this._bindKeyDown = (e: any) => {
      // ctrl or command(mac) 实现滚轮放大、缩小
      this._ctrlPressed = e.keyCode == 91 || e.keyCode == 17
    }
    this._bindKeyUp = () => this._ctrlPressed = false
    document.addEventListener('keydown', this._bindKeyDown)
    document.addEventListener('keyup', this._bindKeyUp)
  }
  private _bindDrag() {
    const { container } = this.options
    
    let leftButtonPressed = false, middleButtonPressed = false    
    let isDraggingStart = false, isDragging = false, lastPosX = 0, lastPosY = 0
    let diffX = 0, diffY = 0

    container.addEventListener('mousedown', (evt: any) => {
      // 按住了鼠标中间的按键
      leftButtonPressed = evt.button == 0
      middleButtonPressed = evt.button == 1

      if ((leftButtonPressed || middleButtonPressed) && this._shouldGrab()) {
        evt.preventDefault()
        evt.stopPropagation()
        
        isDraggingStart = true
        lastPosX = evt.clientX
        lastPosY = evt.clientY
      }
    })
    container.addEventListener('mousemove', (e: any) => {
      if (isDraggingStart) {
        isDragging = true
        
        diffX = 0
        diffY = 0
        
        if (this._shouldGrabY()) {
          diffY = e.clientY - lastPosY
          // >0 向上看 top 越来越小
          diffY = diffY > 0 ? Math.min(Math.abs(this.top), diffY) : -Math.min(this.remainedBottom, -diffY)
        }

        if (this._shouldGrabX()) {
          diffX = e.clientX - lastPosX
         
          // >0 向左看 left 越来越小
          diffX = diffX > 0 ? Math.min(Math.abs(this.left), diffX) : -Math.min(this.remainedRight, -diffX)
        }

        this._translate(diffX, diffY)
        this._setCursor(CURSOR_TYPE.GRABBING)
      }
    })
    
    const cancelDrag = (e: any) => {
      if (isDraggingStart && !isDragging) {
        isDraggingStart = false
      }
      
      else if (isDragging) {
        // 从 container 里的A 移动到 container 其他元素 不触发，即 离开 container 触发
        // if (e.target != e.currentTarget) return
        
        isDraggingStart = false
        isDragging = false
        
        leftButtonPressed = false
        middleButtonPressed = false
        
        this.moveTo(this.left + diffX, this.top + diffY)
        this._setCursor(CURSOR_TYPE.GRAB)
      }
    }
    container.addEventListener('mouseup', cancelDrag)
    container.addEventListener('mouseleave', cancelDrag)
  }
  // 画布拖拽 超出画布显示 grab；拖拽中显示 grabbing
  private _shouldGrab() {
    return this._shouldGrabX() || this._shouldGrabY()
  }
  private _shouldGrabY() {
    return this.height > this._containerHeight
  }
  private _shouldGrabX() {
    return this.width > this._containerWidth
  }
  private _setCursor(t: string) {
    if (this.elem) {
      this.elem.style.cursor = t
    }
  }

  // -- 重新调整大小、位置
  private _set(key, val?) {
    if (typeof key == 'object') {
      Object.keys(key).forEach(k => this._set(k, key[k]))
    } else {
      this[key] = val
    }
  }
  private _draw(o: { width?; height? }) {
    Object.keys(o).forEach(k => {
      this._set(k, o[k])

      setCSS(this.elem, {
        position: 'absolute',
        [k]: `${o[k]}px`,
      })
    })

    // 缩放倍数
    if (o.width && o.height) {
      this.scaleValue = o.width / this._naturalWidth * 100
    }
  }
  private _render(nextW: number, nextH: number) {
    this._draw({
      width: nextW,
      height: nextH,
    })

    this.moveTo((this._containerWidth - nextW) / 2, (this._containerHeight - nextH) / 2)

    // 渲染虚拟滚动条
    this._verticalBar?.draw()
    this._horizontalBar?.draw()

    this._setCursor(this._shouldGrab() ? CURSOR_TYPE.GRAB : CURSOR_TYPE.DEFAULT)
  }
  private _translate(dx: number, dy: number) {
    if (!this.elem) return
    this.elem.style.transform = `translate(${this.left + dx}px, ${this.top + dy}px)`
  }
  private _moved(dx: number, dy: number) {
    this.left += dx
    this.top += dy
    // this.left = Math.max(0, this.left + dx)
    // this.top = Math.max(0, this.top + dy)
  }
  // 垂直方向上能滚动，nextTop 必然是负的;
  // 垂直方向上 通过滚轮触发，所以值很可能越界
  moveTo(nextLeft: number, nextTop: number) {
    // 不能越界
    if (this._shouldGrabY()) {
      nextTop = Math.min(0, Math.max(this._containerHeight - this.height, nextTop))
    }
    // 不能越界
    if (this._shouldGrabX()) {
      nextLeft = Math.min(0, Math.max(this._containerWidth - this.width, nextLeft))
    }

    this._translate(-this.left + nextLeft, -this.top + nextTop)
    this._moved(-this.left + nextLeft, -this.top + nextTop)

    // 虚拟滚动条
    this._verticalBar?.moveTo(-1 * nextTop)
    this._horizontalBar?.moveTo(-1 * nextLeft)
  }

  // --- methods exported to the outer comp
  zoomIn() {
    const nextScale = Math.min(this.options.maxZoom, this.scaleValue + this.options.step) / 100
    this._render(this._naturalWidth * nextScale, this._naturalHeight * nextScale)
  }
  zoomOut() {
    const nextScale = Math.max(this.options.minZoom, this.scaleValue - this.options.step) / 100
    this._render(this._naturalWidth * nextScale, this._naturalHeight * nextScale)
  }
  // 自适应视口
  autoFit() {
    // 短边为准，这样可以 contain 在容器
    const ratio = this._naturalWidth / this._naturalHeight
    // 竖
    if (ratio < this._containerWidth / this._containerHeight) {
      this._render(ratio * this._containerHeight, this._containerHeight)
    } 
    // 横屏
    else {
      this._render(this._containerWidth, 1 / ratio * this._containerWidth)
    }
  }
  // 图片原始尺寸
  autoFixed() {
    this._render(this._naturalWidth, this._naturalHeight)
  }
  destroy() {
    if (this.options.enableWheel) {
      this.options.container?.removeEventListener('wheel', this._bindMouseWheel)
      this._bindMouseWheel = null
      
      this._bindKeyDown = null
      this._bindKeyUp = null
      document.removeEventListener('keydown', this._bindKeyDown)
      document.removeEventListener('keyup', this._bindKeyUp)
    }

    try {
      this.elem && this.options.container?.removeChild(this.elem)
    } catch (e) {
    }

    if (this._cancelResize) {
      this._cancelResize()
      this._cancelResize = null
    }

    this.elem = undefined
  }
}


interface IScrollBarOption {
  dir: SCROLL_BAR_DIR
  app: MyZoom
}

class ScrollBar extends EventEmitter {
  readonly app
  
  private _elem
  private _dir
  private _container

  // 垂直
  top = 0
  height = 0
  
  // 水平
  left = 0
  width = 0

  hRatio = 0.25 // ratio = bar / object
  vRatio = 0.25

  private _visible = false

  constructor(options: IScrollBarOption) {
    super()
    
    this.app = options.app
    this._dir = options.dir

    if (this.isHorizontal) {
      this._createHBar(this.app.options.container)
    } else {
      this._createVBar(this.app.options.container)
    }

    this._bindEvent()
  }

  get isVertical() {
    return this._dir == SCROLL_BAR_DIR.VERTICAL
  }
  get isHorizontal() {
    return this._dir == SCROLL_BAR_DIR.HORIZONTAL
  }
  
  private _createHBar(container: HTMLElement) {
    const div = document.createElement('div')
    setCSS(div, {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '11px',
      'z-index': 1,
    })
    const span = document.createElement('span')
    
    setCSS(span, {
      display: 'none',
      position: 'absolute',
      background: 'rgba(0, 0, 0, 0.35)',
      outline: 'rgba(255, 255, 255, 0.4) solid 1px',
      // box-shadow: 0 0px 2px rgb(255 255 255 / 70%);
      borderRadius: '6px',
      height: '5px',
      bottom: '3px',
      left: 0,
      zIndex: 2,
    })
    
    this._container = div
    this._elem = span
    
    div.appendChild(span)
    container.appendChild(div)
  }
  private _createVBar(container: HTMLElement) {
    const div = document.createElement('div')
    setCSS(div, {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '11px',
      'z-index': 1,
    })
    const span = document.createElement('span')
    
    setCSS(span, {
      display: 'none',
      position: 'absolute',
      top: 0,
      width: '5px',
      right: '3px',
      background: 'rgba(0, 0, 0, 0.35)',
      borderRadius: '6px',
      outline: 'rgba(255, 255, 255, 0.4) solid 1px',
      zIndex: 2,
    })
    
    this._container = div
    this._elem = span
    
    div.appendChild(span)
    container.appendChild(div)
  }
  private _show() {
    setCSS(this._elem, {
      display: 'block',
    })

    this._visible = true
    
    return this
  }
  private _hide() {
    setCSS(this._elem, {
      display: 'none',
    })
    
    this._visible = false
    
    return this
  }
  
  // - 水平方向：left width
  // - 垂直方向：top height
  private _render(rect: { left?: number, width?: number, top?: number, height?: number}, sync = true) {
    Object.keys(rect).forEach(k => {
      let val = rect[k]

      if (k == 'top') {
        val = Math.max(0, Math.min(this.app._containerHeight - this.height, val))
      }
      
      else if (k == 'left') {
        val = Math.max(0, Math.min(this.app._containerWidth - this.width, val))
      }

      setCSS(this._elem, {
        [k]: val + 'px'
      })

      if (sync) {
        this[k] = val
      }
    })

    return this
  }

  _bindEvent() {
    let dragStart = false, dragging = false, lastPosY = 0, lastPosX = 0
    
    const cancelDrag = (e) => {
      if (dragStart && !dragging) {
        dragStart = false
      } 
      
      else if (dragging) {
        dragStart = false
        dragging = false
        
        const diffY = e.clientY - lastPosY
        const diffX = e.clientX - lastPosX

        if (this.isHorizontal) {
          setCSS(this._container, { height: '11px' })
          this.moveTo(this.left + diffX, false)

          // 同步移动图片 >0即向右
          const realPx = diffX > 0 ? Math.min(this.app.remainedRight, diffX / this.hRatio) : Math.max(this.app.left, diffX / this.hRatio)
          this.app._translate(-1 * realPx, 0)
          this.app._moved(-1 * realPx, 0)
        } 

        if (this.isVertical) {
          setCSS(this._container, { width: '11px' })
          this.moveTo(this.top + diffY, false)
  
          // 同步移动图片 >0即向下
          const realPx = diffY > 0 ? Math.min(this.app.remainedBottom, diffY / this.vRatio) : Math.max(this.app.top, diffY / this.vRatio)
          this.app._translate(0, -1 * realPx)
          this.app._moved(0, -1 * realPx)
        }
      }
    }

    this._container.addEventListener('mousedown', (e) => {
      dragStart = true

      e.preventDefault()
      e.stopPropagation()

      if (this.isHorizontal) {
        setCSS(this._container, { height: '100%' })
      } else {
        setCSS(this._container, { width: '100%' })
      }

      lastPosX = e.clientX
      lastPosY = e.clientY
    })
    this._container.addEventListener('mousemove', (e) => {
      if (dragStart) {
        dragging = true

        const diffY = e.clientY - lastPosY
        const diffX = e.clientX - lastPosX
        
        if (this.isVertical) {
          this.moving(diffY)
          
          // 同步移动图片 >0即向下
          const realPx = diffY > 0 ? Math.min(this.app.remainedBottom, diffY / this.vRatio) : Math.max(this.app.top, diffY / this.vRatio)
          this.app._translate(0, -1 * realPx)
        }
        
        if (this.isHorizontal) {
          this.moving(diffX)
          
          // 同步移动图片 >0即向右
          const realPx = diffX > 0 ? Math.min(this.app.remainedRight, diffX / this.hRatio) : Math.max(this.app.left, diffX / this.hRatio)
          this.app._translate(-1 * realPx, 0)
        }
      }
    })
    this._container.addEventListener('mouseleave', cancelDrag)
    this._container.addEventListener('mouseup', cancelDrag)
  }
  
  // --- exported public methods
  // 重新绘制，改了zoom大小
  draw() {
    if (this.isHorizontal) {
      if (this.app.width > this.app._containerWidth) {
        // 按比例缩放图片对象的 X偏移
        let left = Math.max(0, Math.max(0, -this.app.left) * this.hRatio)
        
        // 避免太小了 16是bar的最小宽度
        const maxLeft = (this.app._containerWidth - 16) / 2
        if (left > maxLeft) {
          left = maxLeft
          this.hRatio = isFinite(left / -this.app.left) ? left / -this.app.left : this.hRatio
        }
        
        // 上下边距相等，即滚动条居中
        const width = (this.app._containerWidth - left * 2)

        this._render({
          left,
          width,
        })
        
        this._show()
      } else {
        this._hide()
      }
    }

    else if (this.isVertical) {
      if (this.app.height > this.app._containerHeight) {
        // 按比例缩放图片对象的 Y偏移
        let top = Math.max(0, Math.max(0, -this.app.top) * this.vRatio)

        // 避免太小了 16是bar的最小高度
        const maxTop = (this.app._containerHeight - 16) / 2
        if (top > maxTop) {
          top = maxTop
          this.vRatio = isFinite(top / -this.app.top) ? top / -this.app.top : this.vRatio
        }

        // 上下边距相等，即滚动条居中
        const height = (this.app._containerHeight - top * 2)

        this._render({
          top,
          height,
        })
        
        this._show()
      } else {
        this._hide()
      }
    }
  }

  moving(dv: number) {
    if (!this._visible) return

    // 垂直滚动条
    if (this.isVertical) {
      this._render({ top: this.top + dv }, false)
    }
    else if (this.isHorizontal) {
      this._render({ left: this.left + dv }, false)
    }
  }
  
  // 只有可见的时候，才能调整位置，高度不变
  moveTo(v: number, needRatio = true) {
    if (!this._visible) return
    
    if (this.isVertical) {
      this._render({
        top: needRatio ? v * this.vRatio : v,
      })
    }

    else if (this.isHorizontal) {
      this._render({
        left: needRatio ? v * this.hRatio : v,
      })
    }
  }
  
  destroy() {
    if (this._elem) {
      this.app.options.container?.removeChild(this._elem)
    }
    this._elem = null
  }
}

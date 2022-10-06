// https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
import { EventEmitter } from 'eventemitter3'

export class DragListener extends EventEmitter {
  private _doc: Document
  private _elem: HTMLElement

  private _startX: number
  private _startY: number

  private _thresholdX: number
  private _thresholdY: number

  private _tracking: boolean

  private _onPointerDown = (ev: PointerEvent) => this.onPointerDown(ev)
  private _onPointerMove = (ev: PointerEvent) => this.onPointerMove(ev)
  private _onPointerUp = (ev: PointerEvent) => this.onPointerUp(ev)

  constructor(elem: HTMLElement, options?) {
    super()

    this._doc = document
    this._elem = elem

    this._startX = 0
    this._startY = 0

    this._thresholdX = options?.thresholdX || 0
    this._thresholdY = options?._thresholdY || 0

    this._tracking = false

    this._elem.addEventListener('pointerdown', this._onPointerDown, { passive: true })
  }

  private onPointerDown(e: PointerEvent) {
    if (e.isPrimary) {
      this._startX = e.pageX
      this._startY = e.pageY
      
      this._tracking = true
      
      this.emit('dragStart', e)
      
      this._doc.addEventListener('pointermove', this._onPointerMove)
      this._doc.addEventListener('pointerup', this._onPointerUp, { passive: true })
    }
  }

  private onPointerMove(e: PointerEvent) {
    e.preventDefault()

    const diffX = e.pageX - this._startX
    const diffY = e.pageY - this._startY

    if (Math.abs(diffX) > this._thresholdX || Math.abs(diffY) > this._thresholdY) {
      this.emit('drag', diffX, diffY)

      if (Math.abs(diffX) > Math.abs(diffY)) {
        this.emit('dragH', diffX, diffY)
      } else {
        this.emit('dragV', diffX, diffY)
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (this._tracking) {
      this._doc.removeEventListener('pointermove', this._onPointerMove)
      this._doc.removeEventListener('pointerup', this._onPointerUp)

      this._tracking = false
      this.emit('dragEnd', e)
    }
  }

  destroy() {
    this._elem.removeEventListener('pointerdown', this._onPointerDown)
  }
}

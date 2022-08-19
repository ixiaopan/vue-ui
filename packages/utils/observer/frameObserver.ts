import debounce from 'lodash.debounce'

import { resizeObserverEnabled, intersectionObserverEnabled, isFunction } from '../is'

class FrameResizeObserver {
  private observerIns
  
  private debounceReflow

  constructor() {
    this.debounceReflow = debounce((entries) => {
      entries.forEach(item => {
        const elem = item.target as HTMLElement

        if (!elem._observed) {
          elem._observed = true
          return
        }

        console.log('FrameResizeObserver')

        this.load(elem).catch((e) => {
          console.log('loading video frame error due to resize', e)
        })
      })
    }, 1000)

    if (resizeObserverEnabled) {
      this.observerIns = new ResizeObserver(this.debounceReflow)
    }
  }

  observe(node) {
    if (resizeObserverEnabled) {
      this.observerIns.observe(node)
    }
  }

  unobserve(node) {
    if (resizeObserverEnabled) {
      this.observerIns.unobserve(node)
    }
  }

  load(elem: HTMLElement) {
    return new Promise<void>((resolve, reject) => {
      resolve(elem._load())
    })
  }

  destroy() {
    if (resizeObserverEnabled) {
      if (isFunction(this.observerIns?.disconnect)) {
        this.observerIns?.disconnect()
      }
      
      this.observerIns = null
    } 
  }
}

class FrameIntersectionObserver {
  private io
  
  constructor() {
    if (!intersectionObserverEnabled) {
      return
    }

    this.io = new IntersectionObserver(entries => {
      entries.forEach(item => {
        const elem = item.target as HTMLElement

        if (item.isIntersecting) {
          console.log('intersection');
          
          elem._load()
            .then((ok) => {
              if (ok) {
                this.io.unobserve(elem)
              }
            })
            .catch((e) => {
              console.log('loading video frame error due to intersection', e)
            })
        }
      })
    })
  }

  observe(elem: HTMLElement) {
    if (this.io) {
      this.io.observe(elem)
    }
  }
  unobserve(node) {
    if (intersectionObserverEnabled) {
      this.io.unobserve(node)
    }
  }

  destroy() {
    this.io.disconnect()
    this.io = null
  }
}

export const frameResizeIns = new FrameResizeObserver()

export const frameIntersectionIns = new FrameIntersectionObserver()

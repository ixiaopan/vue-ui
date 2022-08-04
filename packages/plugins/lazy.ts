
import type { App, Directive, DirectiveBinding } from 'vue'

import { intersectionObserverEnabled, on, webpSupported } from '@wxp-ui/utils' 

const webpExt = '?x-oss-process=image/format,webp'

let enableWebp

class Lazyload {
  io: any

  constructor() {
    this.io = this.initObserve()
  }

  initObserve() {
    if (!intersectionObserverEnabled) {
      return
    }

    return new IntersectionObserver(entries => {
      entries.forEach(item => {
        const elem = item.target as HTMLElement

        if (item.isIntersecting) {
          this.load(elem)
            .then(() => {
              this.io.unobserve(elem)
            })
            .catch(() => {
              console.log('loading image error');
            })
        }
      })
    })
  }

  observe(elem: HTMLElement) {
    if (!elem.getAttribute('data-src')) return

    if (this.io) {
      this.io.observe(elem)
    } else {
      this.load(elem)
    }
  }

  load(elem: HTMLElement) {
    return new Promise<void>((resolve, reject) => {
      let src = elem.getAttribute('data-src')

      if (!src) return resolve()

      const isImageNode = elem.nodeName.toLowerCase() === 'img'

      const img = isImageNode ? elem : new Image()

      // 使用 webp 的话
      // @ts-ignore
      const webpUrl = enableWebp || elem.webp ? (webpSupported() ? src + webpExt : src) : src

      on(img, 'load', () => {
        if (!isImageNode) {
          // @ts-ignore
          elem.style['background-image'] = 'url(' + webpUrl + ')'
        }

        elem.removeAttribute('data-src')

        resolve()
      })

      on(img, 'error', () => {
        elem.removeAttribute('src')
        reject()
      })

      img.setAttribute('src', webpUrl)
    })
  }

  
}

let lazy
const lazyDirective: Directive = {
  beforeMount() {
    if (!lazy) {
      lazy = new Lazyload()
    }
  },

  mounted(el: HTMLElement, binding: DirectiveBinding<any>) {
    // @ts-ignore
    el.webp = binding.value?.indexOf('webp') > -1

    lazy.observe(el)
  },

  updated(el) {
    lazy.observe(el)
  },

  beforeUnmount() {
    lazy.io?.disconnect()
  }
}

export default {
  install: (app: App, options) => {
    enableWebp = options?.webp || false
    app.directive('lazy', lazyDirective)
  }
}

/**
 * https://clipboardjs.com/
 * @Example v-copy
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import Clipboard from 'clipboard'

import { on } from '@wxp-ui/utils'

const copyDirective: Directive = {
  beforeMount(el: Element) {
    on(el, 'click', () => {
      const clipboard = new Clipboard(el)

      clipboard.on('success', () => {
        clipboard.destroy()
      })
      
      clipboard.on('error', () => {
        clipboard.destroy()
      })
    }, true)
  },
}
 
export function setupCopyDirective(app: App) {
  app.directive('copy', copyDirective)
}

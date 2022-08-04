/**
 * Prevent repeated clicks
 * @Example v-repeat-click="()=>{}"
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import { on } from '@wxp-ui/utils'

const throttleDirective: Directive = {
  beforeMount(el: Element, binding: DirectiveBinding<any>) {
    let timer
    
    const threshold = binding.value || 1000

    on(el, 'click', (e) => {
      if ((e as any).button !== 0) return;

      if (!timer) {
        timer = setTimeout(() => {
          clearTimeout(timer)
          timer = null
        }, threshold);
      } else {
        e.stopImmediatePropagation()
      }
    }, true)
  },
}

export function setupRepeatDirective(app: App) {
  app.directive('throttle', throttleDirective)
}

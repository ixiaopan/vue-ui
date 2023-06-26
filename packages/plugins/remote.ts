/**
 * load the 3rd lb
 * @Example v-remote.oss v-remote.echarts
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import { loadScriptFromRemote } from '@wxp-ui/utils'

let urlMap

const aliOSSDirective: Directive = {
  beforeMount(el: Element, binding: DirectiveBinding<any>) {
    if (!urlMap) return
    
    const { modifiers } = binding || {}
    if (!modifiers) return

    Object.keys(modifiers)?.forEach((name: string) => {
      loadScriptFromRemote(urlMap[name])
    })
  },
}

export default {
  install: (app: App, options) => {
    if (!options || !Object.keys(options)?.length) {
      return console.error('url map is required')
    }

    urlMap = options
    
    app.directive('remote', aliOSSDirective)
  }
}

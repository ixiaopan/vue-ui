/**
 * load oss
 * @Example v-ali-oss
 */

 import type { App, Directive, DirectiveBinding } from 'vue'
 import { loadScriptFromRemote } from '@wxp-ui/utils'
 
 let ossUrl = ''
 
 const aliOSSDirective: Directive = {
   beforeMount(el: Element, binding: DirectiveBinding<any>) {
     loadScriptFromRemote(ossUrl)
   },
 }
 
 export default {
   install: (app: App, options) => {
     if (!options?.url) {
       return console.error('ali-oss url is required')
     }
 
     ossUrl = options?.url
 
     app.directive('ali-oss', aliOSSDirective)
   }
 }
 
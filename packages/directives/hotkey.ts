/**
 * shortcuts
 * @Example 
 *    v-hotkey="{'ctrl + s': save}" 
 *    v-hotkey="{'up': save}"
 */

 import type { App, Directive, DirectiveBinding } from 'vue';

 const defaultModifiers = {
   ctrlKey: false,
   altKey: false,
   shiftKey: false,
   metaKey: false
 }
 const defaultCode = {
   tab: 9,
   esc: 27,
   
   backspace: 8,
   enter: 13,
   space: 32,
 
   '⇧': 16,
   shift: 16,
   '⌃': 17,
   ctrl: 17,
   '⌥': 18,
   alt: 18,
   '⌘': 91,
   meta: 91,
   windows: 91,
 
   left: 37,
   up: 38,
   right: 39,
   down: 40,
 
   '+': 187,
   '-': 189,
   '[': 219,
   ']': 221,
 }
 const alternativeKeyNames = {
   control: 'ctrl',
   option: 'alt',
   command: 'meta',
   cmd: 'meta',
   escape: 'esc',
   plus: '+',
 }
 
 function parseKeys(keyStr: string) {
   const keyList = keyStr.split(/\+/)
   
   const ret = { keyModifiers: { ...defaultModifiers }, keyCode: -1 }
   
   keyList.forEach(k => {
     k = k.trim()
     
     k = alternativeKeyNames[k] || k
     
     if ((k + 'Key') in defaultModifiers) {
       ret.keyModifiers = { ...defaultModifiers, [`${k}Key`]: true }
     }
 
     // 只支持单个有效字符
     ret.keyCode = defaultCode[k] || k.charCodeAt(0)
   })
 
   return ret
 }
 
 function findCallback(keyMap, keyCode, keyModifiers) {
   const item = keyMap.find(o => o.keyCode == keyCode && Object.keys(keyModifiers).every(k => o.keyModifiers[k] == keyModifiers[k]))
   return item?.callback
 }
 
 const bindEvent = (el: Element, binding: DirectiveBinding<any>) => {
   const { value, modifiers } = binding
   
   if (!Object.keys(value).length) return
 
   el._keyMap = Object.keys(value).reduce((memo, hotkeys) => {
     const { keyCode, keyModifiers } = parseKeys(hotkeys)
     
     const callback = value[hotkeys]
     
     // console.log('keyCode, keyModifiers', keyCode, keyModifiers);
     
     memo.push({
       keyCode,
       keyModifiers,
       callback,
     })
 
     return memo
   }, [])
 
   el._handler = e => {
     // 慎用！！
     if (modifiers.prevent) {
       e.preventDefault()
     }
 
     if (modifiers.stop) {
       e.stopPropagation()
     }
     
     const { nodeName, isContentEditable } = document.activeElement
     if (isContentEditable) return
     if (['INPUT', 'TEXTAREA', 'SELECT'].includes(nodeName)) {
       // 默认拦截
       if (!modifiers.arrow) {
         return
       }
       
       // 不是方向键，拦截
       if (![defaultCode.left, defaultCode.right, defaultCode.up, defaultCode.down].includes(e.keyCode) ) {
         return
       }
     }
 
     const { keyCode, ctrlKey, altKey, shiftKey, metaKey } = e
     const keyModifiers = { ctrlKey, altKey, shiftKey, metaKey }
 
     // console.log('down', el._keyMap, keyCode, keyModifiers);
     
     const cb = findCallback(el._keyMap, keyCode, keyModifiers)
     if (!cb) return
     cb()
   }
 
   document.addEventListener('keydown', el._handler)
 }
 
 const unbindEvent = (el: Element) => {
   document.removeEventListener('keydown', el._handler)
 }
 
 export function setupHotkeyDirective(app: App) {
   app.directive('hotkey', {
     created(el: Element, binding: DirectiveBinding<any>) {
       bindEvent(el, binding)
     },
   
     updated(el: Element, binding: DirectiveBinding<any>) {
       if (binding.value != binding.oldValue) {
         unbindEvent(el)
         bindEvent(el, binding)
       }
     },
   
     beforeUnmount(el: Element) {
       unbindEvent(el)
     }
   })
 }
 
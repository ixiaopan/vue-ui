/**
 * 高亮文案，比如搜索关键词，高亮的文本最好就是纯文本，不要有HTML标签
 * @Example v-highlight="keyword"
 */

import type { App, Directive, DirectiveBinding } from 'vue'

function highlightMe(el, keyword) {
  if (!keyword) {
    // el.innerHTML = el.textContent
    return
  }
  
  const text = el.textContent
  const kwdRegExp = new RegExp(keyword, 'gi')
  el.innerHTML = text.replace(kwdRegExp, (match) => '<em class="highlight">' + match + '</em>')
}

const highlightDirective: Directive = {
  mounted(el: Element, binding: DirectiveBinding<string>) {
    highlightMe(el, binding.value)
  },

  updated(el: Element, binding: DirectiveBinding<string>) {
    highlightMe(el, binding.value)
  },
}

export function setupHighlightDirective(app: App) {
  app.directive('highlight', highlightDirective)
}

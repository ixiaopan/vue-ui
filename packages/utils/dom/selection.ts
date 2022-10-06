let lastSelection
let idx = -1
let lastFocusIdx = -1

export function registerSelection(textRefList) {
  function onGlobalSelectionChange() {
    const nextSelection = document.getSelection()
    if (!nextSelection) return

    const compNode = nextSelection?.focusNode?.parentNode?.parentNode?.parentNode

    // 联动处理: focus 到标注上，标签要高亮
    if (nextSelection.isCollapsed) {
      // 标识是否在文本上进行操作
      let focusIdx = -1
      try {
        focusIdx = Array.from(document.querySelectorAll('.wxp-text-selection') || []).findIndex(o => o == compNode)
      } catch (e) {}
      
      if (lastFocusIdx > -1) {
        // 兼容业务
        const textRef = textRefList[lastFocusIdx]?.value || textRefList[lastFocusIdx]
        textRef?.cancelHighlightSegment()
        
        lastFocusIdx = -1
      }
      
      if (focusIdx > -1) {
        // 兼容业务
        const textRef = textRefList[focusIdx]?.value || textRefList[focusIdx]
        
        const hlElem = nextSelection?.focusNode?.parentNode
    
        const valid = textRef?.highlightSegment(hlElem)
        
        lastFocusIdx = valid ? focusIdx : -1
      }
      return
    }

    // @ts-ignore
    lastSelection = nextSelection
    
    // 标识是否在文本上进行操作
    try {
      idx = Array.from(document.querySelectorAll('.wxp-text-selection') || []).findIndex(o => o == compNode)
    } catch (e) {}

    // 兼容业务
    const textRef = textRefList[idx]?.value || textRefList[idx]
    
    if (idx > -1) {
      textRef?.onSelectionChange(nextSelection)
    }
  }

  function onClick(e) {
    if (!lastSelection) return
  
    if (!textRefList[idx]) return
    
    const textRef = textRefList[idx].value || textRefList[idx]

    if (lastSelection.isCollapsed) {
      textRef?.clickOutside(e)
    } else {
      textRef?.showToolKit(lastSelection)
    }
  }

  document.body.addEventListener('click', onClick, false)
  
  document.addEventListener('selectionchange', onGlobalSelectionChange)
}

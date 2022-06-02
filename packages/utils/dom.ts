export function getComputedStyle(elem: HTMLElement, prop: string): string {
  return window.getComputedStyle(elem, null).getPropertyValue(prop)
}

export function getLineHeight(element: HTMLElement): number | void {
  const lineHeight = getComputedStyle(element, 'line-height');

  if (lineHeight === 'normal') {
    console.error('请明确设置 行高 line-height')
    return
  }

  return parseInt(lineHeight, 10);
}

export function getElementHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height;
}
export function getElementWidth(element: HTMLElement): number {
  return element.getBoundingClientRect().width;
}


// export function setWordBreak(element: HTMLElement, value: string): void {
//   element.style.wordBreak = value;
// }
// // 让文字折行显示，这样就可以通过高度计算是否超出容器高度，进而截断
// export function registerWordBreak(element: HTMLElement): string | void {
//   const wordBreak = getComputedStyle(element, 'word-break')
//   // eg: normal
//   if (wordBreak !== 'word-break' && wordBreak !== 'break-all') {
//     element.style.wordBreak = 'break-word'
//   }
// }


export function on(
  element: Element | HTMLElement | Document | Window,
  event: string,
  handler: EventListenerOrEventListenerObject,
  useCapture: boolean = false
): void {
  if (element && event && handler) {
    element.addEventListener(event, handler, useCapture)
  }
}

export function off(
  element: Element | HTMLElement | Document | Window,
  event: string,
  handler: any,
): void {
  if (element && event && handler) {
    element.removeEventListener(event, handler, false);
  }
}

export function once(el: HTMLElement, event: string, fn: EventListener): void {
  const listener = function (this: any, ...args: unknown[]) {
    if (fn) {
      fn.apply(this, args);
    }
    off(el, event, listener);
  };
  on(el, event, listener);
}

const customCache = new Set<string>()
function createScriptUrlElements(scriptUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof scriptUrl !== 'string' || !scriptUrl.length) {
      return reject()
    }

    if (customCache.has(scriptUrl)) {
      return resolve()
    }

    const script = document.createElement('script')
    script.setAttribute('src', scriptUrl)
    script.setAttribute('data-namespace', scriptUrl)
    
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject()
    }

    customCache.add(scriptUrl)
    document.body.appendChild(script)
  })
}
export function loadScriptFromRemote(scriptUrl: string) {
  if (
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    typeof document.createElement === 'function'
  ) {
    return createScriptUrlElements(scriptUrl)
  }
}

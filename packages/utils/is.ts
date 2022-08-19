export function isNull(val: unknown): val is null {
  return val == null
}

export function isUndef(val: unknown) {
  return typeof val == 'undefined'
}

export function isNullOrUndef(val: unknown): val is null | undefined {
  return isUndef(val) || isNull(val)
}

export function isString(val: unknown): boolean {
  return typeof val == 'string'
}
export function isNumber(val: unknown): boolean {
  return typeof val == 'number'
}

export function isFunction(fn) {
  return typeof fn == 'function'
}


export const isArray = Array.isArray

// env
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/** Whether the environment support -webkit-line-clamp. */
export const nativeEllipsisEnabled = isBrowser() && typeof document.body.style.webkitLineClamp !== 'undefined'

/** Whether the environment support ResizeObserver. */
export const resizeObserverEnabled = isBrowser() && typeof ResizeObserver !== 'undefined'

export const intersectionObserverEnabled = isBrowser() && typeof IntersectionObserver !== 'undefined'

export const isSafari = isBrowser() && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)


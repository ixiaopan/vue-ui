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

export function isUrl(path: string): boolean {
  const reg =
    /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/
  return reg.test(path)
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

export function omit(obj, fields) {
  // eslint-disable-next-line prefer-object-spread
  const shallowCopy = Object.assign({}, obj);
  for (let i = 0; i < fields.length; i += 1) {
    const key = fields[i];
    delete shallowCopy[key];
  }
  return shallowCopy;
}


export function webpSupported() {
  try {
    const webpCache = localStorage.getItem('WXP_WEBP')
    
    if (webpCache) {
      return parseInt(webpCache) === 1
    }

    const yes = document.createElement('canvas').toDataURL('image/webp', 0.5).indexOf('data:image/webp') == 0
    
    localStorage.setItem('WXP_WEBP', yes ? '1' : '0')
    
    return yes
  } catch(err) {
    return false
  }
}

// 去除最后一位字符
export function cutLastStr(old: string, splitSep: RegExp) {
  let newstr = old
  //循环变量 小数部分长度
  const leng = old.length

  for (let i = leng; i > 0; i--) {
    newstr = newstr.trim()
    //如果newstr末尾是str
    if (splitSep.test(newstr.slice(newstr.length - 1))) {
      newstr = newstr.substring(0, newstr.length - 1)
    }
  }
  return newstr
}

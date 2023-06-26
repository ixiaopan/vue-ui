export function omit(obj, fields) {
  // eslint-disable-next-line prefer-object-spread
  const shallowCopy = Object.assign({}, obj);
  for (let i = 0; i < fields.length; i += 1) {
    const key = fields[i];
    delete shallowCopy[key];
  }
  return shallowCopy;
}

export function noop() {}

export function parseJSON(o: string) {
  try {
    return JSON.parse(o)
  } catch (e) {
    console.error(e)
    // return {}
  }
}

// 跳到外部
export function goOutside(url: string) {
  if (!url) return

  if (/https?:\/\//.test(url)) {
    return window.open(url, '_blank')
  }

  console.log('https?:// is required')
}

// 生成唯一 ID
const hexList: string[] = []
for (let i = 0; i <= 15; i++) {
  hexList[i] = i.toString(16)
}

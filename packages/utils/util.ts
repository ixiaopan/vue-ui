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

// JSON序列化
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

export function guid(): string {
  let uuid = ''
  for (let i = 1; i <= 36; i++) {
    if (i === 9 || i === 14 || i === 19 || i === 24) {
      uuid += '-'
    } else if (i === 15) {
      uuid += 4
    } else if (i === 20) {
      uuid += hexList[(Math.random() * 4) | 8]
    } else {
      uuid += hexList[(Math.random() * 16) | 0]
    }
  }
  return uuid.replace(/-/g, '')
}

let unique = 0
export function gid(prefix = ''): string {
  const time = Date.now()
  const random = Math.floor(Math.random() * 1000000000)
  unique++
  return prefix + '_' + random + unique + '_' + String(time)
}

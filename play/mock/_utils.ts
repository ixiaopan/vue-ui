// Interface data format used to return a unified format

export function resultSuccess(data) {
  return {
    code: 200,
    data,
    type: 'success',
    success: true,
    message: '操作成功',
    msg: '操作成功',
  }
}

export function resultError(data = null) {
  return {
    code: -1,
    data,
    type: 'error',
  }
}

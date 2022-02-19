import request from '@/request'

export function getMemberInfo() {
  return request({
    url: '/getMemberInfo',
    method: 'get',
  })
}

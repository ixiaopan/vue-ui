import request from '@/request'

export function getMemberInfo() {
  return request({
    url: '/getMemberInfo',
    method: 'get',
  })
}
export function getMemberNotFound() {
  return request({
    url: '/getMemberNotFound',
    method: 'get',
  })
}


export function getGoodsList() {
  return request({
    url: '/getGoodsList',
    method: 'get',
  })
}
export function queryCategory() {
  return request({
    url: 'queryCategory',
    method: 'get',
  })
}
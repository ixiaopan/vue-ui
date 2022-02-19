import { MockMethod } from 'vite-plugin-mock'
import { resultSuccess, resultError } from '../_utils'

const memberInfo = [
  {
    name: '张一',
    uid: 1,
    mobilePhone: '123456',
  },
  {
    name: '李四',
    uid: 2,
    mobilePhone: '18292998234',
  },
  {
    name: '张三',
    uid: 3,
    mobilePhone: '18220498234',
  },
]

export default [
  {
    url: '/getMemberInfo',
    timeout: 1000,
    method: 'get',
    response: () => {
      return resultSuccess(memberInfo);
    },
  },

] as MockMethod[]

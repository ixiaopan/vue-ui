
import { MockMethod } from 'vite-plugin-mock'
import { resultSuccess, resultError } from '../_utils'


const cateInfo = [
  {
    "children": [],
    "label": "游戏话费",
    "value": "G_1"
  },
  {
    "label": "游戏话费",
    "value": "G_1",
    "children": [
      {
        "label": "腾讯QQ专区",
        "value": "40",
      },
      {
        "label": "网络游戏点卡",
        "value": "199",
        "children": [
          {
            "label": "J-街机三国",
            "value": "434"
          },
          {
            "label": "S-水浒Q传2",
            "value": "2323"
          },
        ]
      }
    ]
  },
  {
    "label": "汽配摩托",
    "value": "G_3",
  },
  {
    "label": "测试",
    "value": "G_43",
  }
]

export default [
  {
    url: '/queryCategory',
    timeout: 1000,
    method: 'get',
    response: () => {
      return resultSuccess(cateInfo);
      // return resultSuccess(memberInfoExact);
      // return resultSuccess(memberInfoEmpty);
    },
  },
]


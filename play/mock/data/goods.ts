import { resultSuccess, resultError } from '../_utils'

const goods = [
  {
    "children": [],
    "label": "通用类目",
    "value": "00000000000",
  },
  {
    "label": "游",
    "value": "G_K1",
    "children": [
      {
        "label": "腾讯QQ专区",
        "value": "40",
        "children": [
          {
            "label": "QQ秀",
            "value": "50005457",
            "children": [
              {
                "label": "QQ秀服饰",
                "value": "50005482"
              },
              {
                "label": "QQ秀美容",
                "value": "50005483"
              },
              {
                "label": "QQ秀配饰",
                "value": "50005484"
              },
              {
                "label": "QQ秀场景",
                "value": "50005485"
              },
            ],
          },
          {
            "label": "QQ宠物",
            "value": "50005458",
            "children": [
              {
                "label": "QQ宠物挂机",
                "value": "50005467"
              },
              {
                "label": "宠物礼包",
                "value": "50005468"
              },
              {
                "label": "宠物元宝",
                "value": "50005469"
              }
            ],
            
          },
          {
            "label": "QQ币/QQ卡",
            "value": "50232005462"
          },
          {
            "label": "QQ其它",
            "value": "50005491132"
          },
          {
            "children": [
              {
                "children": [],
                "label": "QQ音速服装",
                "value": "50007186"
              },
              {
                "children": [],
                "label": "QQ音速道具",
                "value": "50007187"
              }
            ],
            "idPath": "[40,50007185]",
            "label": "QQ音速",
            "value": "50007185"
          },
          {
            "children": [],
            "idPath": "[40,50007211]",
            "label": "QQ游戏大厅道具",
            "value": "50007211"
          }
        ],
      },
      {
        "label": "网络游戏点卡",
        "value": "99",
        "children": [
          {
            "children": [],
            "label": "J-街机三国",
            "value": "826009"
          },
          {
            "children": [],
            "label": "J-极光世界",
            "value": "3006"
          },
          {
            "children": [],
            "label": "S-水浒Q传2",
            "value": "12006"
          },
          {
            "children": [],
            "label": "D-斗战神",
            "value": "120804"
          },
          {
            "children": [],
            "label": "DOTA2",
            "value": "120006"
          },
        ]
      }
    ],
    
  },
  {
    "label": "都是",
    "value": "G_13",
  },
  {
    "label": "测试",
    "value": "G_43",
  }
]

export default [
  {
    url: '/getGoodsList',
    timeout: 1000,
    method: 'get',
    response: () => {
      // return resultSuccess(memberInfo);
      // return resultSuccess(memberInfoExact);
      return resultSuccess(goods);
    },
  },
]

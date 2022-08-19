import type { ExtractPropTypes } from "vue" 

export const textProps = {
  // one of [1-5] 对应 HTML 的h1, h2, ..., h6
  level: Number,

  ellipsis: Boolean,
  // 过长使用 ... 进行占位
  ellipsisText: {
    type: String,
    default: '...'
  },
  
  // 静态文本
  staticText: String,

  // 动态替换，必须使用这个
  dynamic: Boolean,
  dynamicText: String,
  
  // 缩略符点击回调事件
  ellipsisClick: Function,
  // 自适应 resize 事件
  autoResize: Boolean,
  
  width: Number,
  // 二选一：默认单行；也可以输入最大高度
  maxHeight: Number,
  rows: {
    type: Number,
    default: 1,
  },

  tooltipAlways: {
    type: Boolean,
    default: false,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
  // 默认是文本本身，你也可以自定义 tip
  tooltip: String,


  // 同 antd
  trigger: {
    type: String,
    default: 'hover'
  },
  overlayClassName: String,
  overlayStyle: Object,
  placement: {
    type: String,
    default: 'top',
  },

  type: {
    type: String,
    // default, disabled, warning, error, success, 
    default: 'default',
  },
  del: Boolean,
  strong: Boolean,
  italic: Boolean,
  underline: Boolean,
}

export type TextProps = ExtractPropTypes<typeof textProps>

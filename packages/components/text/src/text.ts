import type { ExtractPropTypes } from "vue" 

export const textProps = {
  // case 1: one of [1-5] 对应 HTML 的h1, h2, ..., h6
  level: Number,

  // case 2: 省略号
  ellipsis: Boolean,

  // 不管是静态还是动态，都是可以使用 css 的；只是不精准
  // 静态文本
  staticText: String,
  // 动态替换，必须使用这个
  dynamic: Boolean,
  dynamicText: String,

  // 二选一：默认单行；也可以输入最大高度
  maxHeight: Number,
  lineHeight: Number, // is it necessary?
  rows: {
    type: Number,
    default: 1,
  },

  // 过长使用 ... 进行占位
  ellipsisText: {
    type: String,
    default: '...',
  },

  // 自适应宽度变化，不是所有都要加的
  autoResize: Boolean,

  width: Number, // what's this?

  // tooltip 相关
  tooltipAlways: {
    type: Boolean,
    default: false,
  },
  showTooltip: {
    type: Boolean,
    default: true,
  },
  // 同 antd
  trigger: {
    type: String,
    default: 'hover',
  },
  overlayClassName: String,
  overlayStyle: Object,
  placement: {
    type: String,
    default: 'top',
  },
  // debounce会在 immediate 时间间隔的开始调用这个函数
  immediate: {
    type: Number,
    default: 800,
  },

  // case 3
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

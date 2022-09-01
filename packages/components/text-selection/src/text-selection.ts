import type { ExtractPropTypes } from 'vue'

export const textSelectionProps = {
  text: String,

  defaultList: Array,

  // 下拉选择的列表
  optionList: Array,

  editable: {
    type: Boolean,
    default: true,
  },
  
  // 文案最大长度
  maxCount: Number,

  marginTop: {
    type: Number,
    default: 10,
  },

  theme: {
    type: String,
    default: 'dark', // dark , light
  }
}

export type TextSelectionProps = ExtractPropTypes<typeof textSelectionProps>

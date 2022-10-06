import type { ExtractPropTypes } from "vue" 

export const dynamicInputProps = {
  hasClear: {
    type: Boolean,
    default: true,
  },

  placement: {
    type: String,
    default: 'top',
  },

  maxCount: {
    type: [Number, String],
    default: 99,
  },
  
  placeholder: String,
  
  addText: String,
  
  disabledHint: String,

  clearText: {
    type: String,
    default: '清空选择',
  },

  // 是否监听初始值
  // 比如放在表单使用，因为表单变化会大概率rerender
  // 禁用这个，可以保持避免重置组件
  listenDefault: {
    type: Boolean,
    default: true,
  },
  defaultList: Array
}


export type DynamicInputProps = ExtractPropTypes<typeof dynamicInputProps>

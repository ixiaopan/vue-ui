import type { ExtractPropTypes } from "vue" 

export const tabProps = {
  // [
  //   {
  //     name: '',
  //     id: 'no',
  //     disabled: false,
  //   },
  //   {
  //     name: '',
  //     id: 'yes'
  //   }
  // ]
  
  tabList: Array,
  tabKey: String,
  defaultTabId: String,
  value: [Number, String],
  // 自适应宽度模式，默认是每个 tab 平分宽度
  autoResize: Boolean,
  size: {
    type: String,
    // normal small
    default: 'normal'
  },
  onlyTab: {
    type: Boolean,
    default: true,
  },
}

export type TabProps = ExtractPropTypes<typeof tabProps>

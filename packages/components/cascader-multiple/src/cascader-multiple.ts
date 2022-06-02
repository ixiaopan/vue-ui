import type { ExtractPropTypes } from "vue" 

export const cascaderMultipleProps = {
  options: Array, // 列表数据
  placeholder: String,
  // 业务对每个 node 自己的处理逻辑，
  transformer: Function,
  // 业务的标签格式化
  formatInput: Function,
  width: {
    type: [Number, String],
    default: 450,
  },
  height: {
    type: [Number, String],
    default: 80,
  },
  tipText: {
    type: String,
    default: '父项被选中时禁用'
  },
  disabled: Boolean,
  disabledHint: String,
  required: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: '请输入必填项',
  },
  defaultTagList: Array,
  // true 是否可以选择到中间层
  intermediate: {
    type: Boolean,
    default: false,
  },
  selectAll: Boolean,
  // 通用类目，与其他互斥；选择了通用类目就不能选择别人，权利最大；
  majestyId: String,
  // 最多展示多少层
  // maxDepth: {
  //   type: Number,
  //   default: 3,
  // },
  debounceTime: {
    type: Number,
    default: 100,
  },
  // 禁用的情况，是否可以展开下一级
  clickableWhenDisabled: {
    type: Boolean,
    default: true,
  },
  // 选了父亲，就不能选择孩子；做个开关
  higherLevelFirst: {
    type: Boolean,
    default: true,
  },

  // 模糊搜索下拉框的高度
  queryOptionHeight: {
    type: Number,
    default: 192,
  },
  queryErrorMsg: {
    type: String,
    default: '未选择商品类目，请重新选择'
  },
  // 是否是组件内部模糊查询
  isSelfQuery: {
    type: Boolean,
    default: true,
  },
  // 自定义自查询匹配规则
  // selfQueryRule: Function,
  // 自定义子查询返回的格式
  // selfQueryFormat: Function,
  // 空列表的高度
  emptyHeight: {
    type: Number,
    default: 102,
  },
}

export type CascaderMultipleProps = ExtractPropTypes<typeof cascaderMultipleProps>

import type { ExtractPropTypes } from "vue" 

export const cascaderProps = {
  options: Array, // 列表数据
  queryOptions: Array, // 模糊搜索列表数据
  placeholder: String,

  // 业务对每个 node 自己的处理逻辑，
  transformer: Function,
  // 业务的标签格式化
  formatInput: Function,
  // 回显
  defaultOption: Array,
  width: [Number, String],
  required: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: '请输入必填项',
  },
  // true 是否可以选择到中间层
  intermediate: {
    type: Boolean,
    default: false,
  },
  // 最多展示多少层
  maxDepth: {
    type: Number,
    default: 3,
  },
  debounceTime: {
    type: Number,
    default: 100,
  },

  // 模糊搜索下拉框的高度
  queryOptionHeight: {
    type: Number,
    default: 192,
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
  queryErrorMsg: {
    type: String,
    default: '未选择商品类目，请重新选择'
  },
}

export type CascaderProps = ExtractPropTypes<typeof cascaderProps>

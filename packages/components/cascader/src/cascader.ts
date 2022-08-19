import type { ExtractPropTypes } from "vue" 

export const cascaderProps = {
  options: Array, // 列表数据
  
  queryOptions: Array, // 模糊搜索列表数据
  
  placeholder: String,

  // 改为 teleport 后，可以自定义 marginTop 距离输入框的距离
  marginTop: {
    type: Number,
    default: 0,
  },

  // 业务对每个 node 自己的处理逻辑，
  transformer: Function,
  
  // 业务的标签格式化
  formatInput: Function,
  
  // 回显 eg: [p1, p2, leaf]
  defaultOption: Array,
  // 2022-07-06新增，尽量用这个；
  // 回显 只给叶子节点，内部自动找到路径 eg: leaf => [p1, p2, leaf]
  defaultLeaf: [String, Number],
  // 有些给后端的不是 id，是其他字段
  defaultLeafId: {
    type: String,
    default: 'id'
  },
  
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
  // 禁用的情况，是否可以展开下一级
  clickableWhenDisabled: Boolean,
  disabledTip: String,
  
  // 输入框ICON的定制
  searchIcon: {
    type: String,
    default: 'search',
  },
  clearIcon: {
    type: String,
    default: 'backspace',
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
  // 每行后面加统计数据
  // 默认没有
  isShowCount: {
    type: Boolean,
    default: false
  },
  // 如果统计数据为0，是否展示
  // 默认不展示
  isShowZero: {
    type: Boolean,
    default: false
  },
}

export type CascaderProps = ExtractPropTypes<typeof cascaderProps>

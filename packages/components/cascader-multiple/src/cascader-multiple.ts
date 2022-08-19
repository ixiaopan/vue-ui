import type { ExtractPropTypes } from "vue" 

export const cascaderMultipleProps = {
  options: Array, // 列表数据
  
  placeholder: String,
  
  // 业务对每个 node 自己的处理逻辑，
  transformer: Function,

  // 下拉列表的类名
  listClass: String,
  // 隐藏第一列的复选框
  hideFirstCheckbox: Boolean,
  teleportTo: {
    type: [String, HTMLElement],
    default: 'body',
  },
  
  // 业务的标签格式化
  formatTag: Function,

  // 改为 teleport 后，可以自定义 marginTop 距离输入框的距离
  marginTop: {
    type: Number,
    default: 0,
  },
  
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
  // 业务自定义禁用状态 true 禁用 false 走组件内部逻辑
  disableChecker: Function,
  
  required: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: '请输入必填项',
  },
  
  // @deprecated [p2/p1, p1/p3]
  defaultTagList: Array,
  // 2022-07-06 只需要传选择的节点即可，内部自动检索路径，[p1, p3]
  defaultList: Array,
  defaultListId: {
    type: String,
    default: 'id',
  },

  // true 是否可以选择到中间层
  intermediate: {
    type: Boolean,
    default: false,
  },
  // tha maximum number of tag showing in the input, -1 means no limitation
  maxTagCount: {
    type: Number,
    default: -1,
  },
  tagEllipsis: Boolean,
  selectAll: Boolean,
  
  // 通用类目，与其他互斥；选择了通用类目就不能选择别人，权利最大；
  majestyId: String,
  
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

  showCloseDisable: {
    type: Boolean,
    default: true,
  },
  
  // 支持在多选模式下，仅仅使用叶子搜索
  leafSearchOnly: Boolean,
  
  // 只能选叶子节点，这种才显示 checkbox；其他不显示checkbox
  leafSelectOnly: Boolean,

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
  emptyHeight: {
    type: Number,
    default: 102,
  },
}

export type CascaderMultipleProps = ExtractPropTypes<typeof cascaderMultipleProps>

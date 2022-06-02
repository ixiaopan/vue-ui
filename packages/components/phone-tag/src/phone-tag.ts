import type { ExtractPropTypes } from "vue" 

export const phoneTagProps = {
  mode: {
    type: String,
    default: 'sole', // one of ['sole', 'multiple']
  },
  placeholder: String,
  width: Number,
  height: Number,
  debounceTime: {
    type: Number,
    default: 100,
  },

  // 是否需要异步获取数据显示在下拉框内，仅对多选模式生效
  withAsync: {
    type: Boolean,
    default: true,
  },

  // 空格自动生成标签
  splitSep: {
    type: RegExp,
    default: /\s+/,
  },

  // 下拉框的高度
  optionHeight: {
    type: Number,
    default: 192,
  },
  // 空列表的高度
  emptyHeight: {
    type: Number,
    default: 102,
  },
  // 每个列表项的 id
  rowId: String,
  // 不能选择，根据哪个字段控制
  disabledKey: String,
  // 列表数据
  options: Array,
  // 下拉列表的 loading
  loading: {
    type: Boolean,
    default: false,
  },
  // 默认高亮第几个
  highlightIndex: {
    type: Number,
    default: 0,
  },

  // 最终显示的格式
  formatInput: Function,
  // 校验规则
  validator: Function,
  validateTrigger: {
    type: String,
    default: 'blur'
  },

  // -- 仅 multiple 模式
  // 业务方对列表进行过滤，比如已存入标签的不在列表显示
  filterList: Function,
  // 允许重复标签
  repeatable: {
    type: Boolean,
    default: false,
  },
  maxTagCount: {
    type: Number,
    default: 10,
  },
  tagWarningIcon: {
    type: String,
    default: 'warning-circle',
  },
  tagWarningColor: {
    type: String,
    default: '#F59700',
  },
  tagWarningSize: {
    type: Number,
    default: 14,
  },
  tagWarningTips: String,
  batchSearch: Function,

  // 不限身份
  // showEmpty: {
  //   type: Boolean,
  //   default: true,
  // },
}

export type PhoneTagProps = ExtractPropTypes<typeof phoneTagProps>

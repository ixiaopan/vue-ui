import type { ExtractPropTypes } from "vue" 

export const scrollableProps = {
  // 支持翻页加载 (true，需提供pageIndex, totalPage)
  // 普通内容嵌入 (false)
  withAsync: {
    type: Boolean,
    default: true,
  },

  // unique key for diff
  itemKey: String,
  // 点击每个 item
  itemClick: Function,
  // 列表数据源
  dataSource: Array,
  // 是否在加载
  loading: Boolean,

  // 分页信息
  pageIndex: Number,
  totalPage: Number,

  loadingText: {
    type: String,
    default: '加载中'
  },
  threshold: {
    type: Number,
    default: 32,
  },
}

export type ScrollableProps = ExtractPropTypes<typeof scrollableProps>

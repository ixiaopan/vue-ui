import type { ExtractPropTypes } from "vue" 

export const videoFrameProps = {
  coverUrl: String, // 封面

  // 算法生成的长图，优先
  frameFirst: Boolean,
  frameUrl: String,
  frameHeight: Number,
  frameWidth: Number,
  frameCount: {
    type: Number, 
    default: 15,
  },

  // 容器的宽度、高度；可以不指定，从 parentNode 算
  width: Number,
  height: Number,

  // 前端生成的
  src: String,
  // 开启自适应，必须有 parentNode
  autoResize: Boolean,
  // 可以独立使用，前提是不自适应
  // 以父元素高度为准
  parentNode: HTMLElement,
  // ms
  startTime: {
    type: Number,
    default: 0,
  },
  endTime: {
    type: Number,
    default: 0,
  },
}

export type VideoFrameProps = ExtractPropTypes<typeof videoFrameProps>

import type { ExtractPropTypes } from "vue" 

export const progressProps = {
  currentTime: {
    type: [Number, String],
    default: 0,
  },

  duration: [Number, String],

  // 指针
  pointer: Boolean,

  seekable: Boolean,

  color: {
    type: String,
    default: '#029C94'
  }
}

export type ProgressProps = ExtractPropTypes<typeof progressProps>

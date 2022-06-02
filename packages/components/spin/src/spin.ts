import type { ExtractPropTypes } from "vue" 

export const spinProps = {
  tips: String,
  spinning: {
    type: Boolean,
    default: true,
  },
  async: Boolean,
}

export type SpinProps = ExtractPropTypes<typeof spinProps>

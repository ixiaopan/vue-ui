import type { ExtractPropTypes } from "vue" 

export const buttonProps = {
  type: {
    type: String,
    default: 'primary'
  },

  size: {
    type: String,
    // one of ['large', 'normal', 'small']
    default: 'normal'
  },

  disabled: {
    type: Boolean,
    default: false,
  },
}

export type ButtonProps = ExtractPropTypes<typeof buttonProps>

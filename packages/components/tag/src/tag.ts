import type { ExtractPropTypes } from "vue" 

export const tagProps = {
  type: {
    type: String,
    // square, rounded
    default: 'square',
  },
  // green, red,
  color: {
    type: String,
    default: 'green'
  },
}

export type TagProps = ExtractPropTypes<typeof tagProps>

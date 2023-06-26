import type { ExtractPropTypes } from "vue" 

export const iconProps = {
  type: String,
  color: String,
  size: Number,
  click: Function,
}

export type IconProps = ExtractPropTypes<typeof iconProps>

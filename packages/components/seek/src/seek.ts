import type { ExtractPropTypes } from "vue" 

export const seekProps = {
  scrollable: Boolean
}

export type SeekProps = ExtractPropTypes<typeof seekProps>

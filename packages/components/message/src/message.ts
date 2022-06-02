import type { ExtractPropTypes } from "vue" 

export const messageProps = {
  type: String,
  message: String,
  duration: {
    type: Number,
    default: 2000,
  },
  onClose: Function,
  offset: {
    type: Number,
    default: 100,
  },
  zIndex: Number,
}

export const messageTypes = ['success', 'error','warning', 'info', 'loading'] as const

export type MessageProps = ExtractPropTypes<typeof messageProps>

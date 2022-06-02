import { createVNode, render } from 'vue'

import MessageConstructor from './message.vue'
import { messageTypes } from './message'

const instances = []
let seed = 1
let maxCount = 9999

const message = function (options = {}) {
  if (instances.length >= maxCount) {
    return
  }

  if (typeof options === 'string') {
    options = { message: options }
  }

  let verticalOffset = options.offset || 20
  instances.forEach(({ vm }) => {
    verticalOffset += (vm.el?.offsetHeight || 0) + 20
  })
  verticalOffset += 20

  const id = `message_${seed++}`
  const props = {
    zIndex: options.zIndex,
    offset: verticalOffset,
    ...options,
    id,
    onClose: () => close(id),
  }

  // dom
  const container = document.createElement('div')
  container.className = `container_${id}`

  const vm = createVNode(
    MessageConstructor,
    props,
    null,
  )

  vm.props!.onDestroy = () => {
    render(null, container)
  }

  render(vm, container)
  instances.push({ vm })
  document.body.appendChild(container.firstElementChild!)

  return {
    close: () => (vm.component!.proxy).visible = false,
    update: (val) => {
      vm.component.props.message = val.message
    }
  }
}

messageTypes.forEach((type) => {
  message[type] = (options = {}) => {
    if (typeof options === 'string') {
      options = {
        message: options,
      }
    }
    return message({
      ...options,
      type,
    })
  }
})

export function close(id: string) {
  const idx = instances.findIndex(({ vm }) => id === vm.props.id)
  if (idx === -1) return

  const { vm } = instances[idx]
  if (!vm) return
  
  const removedHeight = vm.el!.offsetHeight
  instances.splice(idx, 1)

  // adjust other instances vertical offset
  const len = instances.length
  if (len < 1) return
  for (let i = idx; i < len; i++) {
    const pos =
      parseInt(instances[i].vm.el!.style['top'], 10) - removedHeight - 20

    instances[i].vm.component!.props.offset = pos
  }
}

message.config = (opts) => {
  if (opts.maxCount) {
    maxCount = opts.maxCount
  }
} 

export default message

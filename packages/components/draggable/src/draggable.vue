<template>
  <div class="wxp-draggable" ref="pointerRef">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

import { draggableProps } from './draggable'

import { DragListener } from '@wxp-ui/utils'

export default defineComponent({
  name: 'MDraggable',
  props: draggableProps,
  emits: ['dragStart', 'drag', 'dragEnd', 'dragH', 'dragV'],
  setup(props, { emit }) {
    const pointerRef = ref()
    
    function onDragStart(e: PointerEvent) {
      emit('dragStart', e)
    }
    function onMove(x, y) {
      emit('drag', x, y)
    }
    function onDragHorizontal(x, y) {
      emit('dragH', x, y)
    }
    function onDragVertical(x, y) {
      emit('dragV', x, y)
    }
    function onDragEnd(e: PointerEvent) {
      emit('dragEnd', e)
    }
    
    onMounted(() => {
      if (pointerRef.value) {
        const myDrag = new DragListener(pointerRef.value)

        myDrag.on('dragStart', onDragStart)
        myDrag.on('drag', onMove)
        myDrag.on('dragH', onDragHorizontal)
        myDrag.on('dragH', onDragVertical)
        myDrag.on('dragEnd', onDragEnd)
      }
    })

    return {
      pointerRef,
      onMove,
      onDragStart,
      onDragHorizontal,
      onDragVertical,
      onDragEnd,
    }
  }
})
</script>

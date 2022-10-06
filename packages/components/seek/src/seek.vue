<template>
  <div class="wxp-seek" ref="seekRef" @click="onClick">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

import { seekProps } from './seek'

export default defineComponent({
  name: 'MSeek',
  props: seekProps,
  emits: ['seek'],
  setup(props, { emit }) {
    const seekRef = ref()
    
    let seekWidth = 0
    
    function onClick(e) {
      if (seekWidth) {
        const ratio = (props.scrollable ? e.clientX : e.offsetX) / seekWidth
        emit('seek', ratio, seekWidth)
      }
    }

    onMounted(() => {
      seekWidth = seekRef.value.clientWidth
    })

    return {
      onClick,
      seekRef,
    }
  }
})
</script>

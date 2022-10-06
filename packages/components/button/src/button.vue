<template>
  <button  
    :class="[
      'wxp-btn',
      type ? 'wxp-btn-' + type : '',
      size ? 'wxp-btn-' + size : '',
    ]"
    :disabled="disabled"
  >
   <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { buttonProps } from './button'

export default defineComponent({
  name: 'MButton',
  props: buttonProps,
  components: {
  },
})
</script>

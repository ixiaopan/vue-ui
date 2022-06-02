<template>
  <span 
    :class="[
      'wxp-tag',
      `wxp-tag-${type}`,
      color ? `wxp-tag-predefined wxp-tag-predefined-${color}` : '',
    ]"
    @click="myClick"
  >
    <span class="wxp-tag-text"><slot></slot></span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { tagProps } from './tag'

export default defineComponent({
  name: 'MTag',
  props: tagProps,
  setup(props, { emit }) {
    function myClick() {
      emit('close')
    }
    return {
      myClick,
    }
  },
})
</script>

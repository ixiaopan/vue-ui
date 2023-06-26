<template>
  <span 
    role="img" 
    class="wxp-icon" 
  >
    <svg :class="'svg-' + type" width="1em" height="1em" fill="currentColor">
      <use :xlink:href="`#${type}`"></use>
    </svg>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iconProps } from './icon'

export default defineComponent({
  name: 'MIcon',
  props: iconProps,
  setup(props, { emit }) {

  }
})
</script>

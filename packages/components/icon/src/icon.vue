<template>
  <div class="wxp-icon">
  </div>
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

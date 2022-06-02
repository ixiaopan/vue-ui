<template>
  <div v-if="$slots.default" 
    :class="[
      'wxp-spin',
      spinning ? 'wxp-spin-ing' : ''
    ]"
  >
    <div class="wxp-spin-inner" v-show="!async || spinning">
      <span class="wxp-spin-icon" />
      <span class="wxp-spin-text" v-if="tips">{{ tips }}</span>
    </div>
    
    <slot />
  </div>

  <div v-else 
    :class="[
      'wxp-spin',
      'wxp-spin-inline',
      spinning ? 'wxp-spin-ing' : ''
    ]"
  >
    <span class="wxp-spin-icon" />
    <span class="wxp-spin-text" v-if="tips">{{ tips }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { spinProps } from './spin'

export default defineComponent({
  name: 'MSpin',
  props: spinProps,
  components: {
  },
  setup(props, { emit }) {

  }
})
</script>

<style lang="less">
</style>

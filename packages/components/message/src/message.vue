<template>
  <transition
    name="wxp-message-fade"
    @before-leave="onClose"
    @after-leave="$emit('destroy')"
  >
    <div
      v-show="visible"
      :class="[
        'wxp-message',
        type ? 'wxp-message-'+type : '',
      ]"
      :style="customStyle"
    >
      <slot>{{ message }}</slot>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue'
import { messageProps } from './message'

export default defineComponent({
  name: 'MMessage',
  props: messageProps,
  emits: ['destroy'],
  setup(props) {
    const visible = ref(false)
    let timerId = null

    const customStyle = computed(() => ({
      top: `${props.offset}px`,
      zIndex: props.zIndex,
    }))

    function startTimer() {
      if (props.duration > 0) {
        timerId = setTimeout(() => {
          if (visible.value) {
            close()
          }
        }, props.duration)
      }
    }

    function clearTimer() {
      clearTimeout(timerId)
    }

    function close() {
      visible.value = false
      clearTimer()
    }

    onMounted(() => {
      startTimer()
      visible.value = true
    })

    return {
      customStyle,
      visible,
      close,
      clearTimer,
      startTimer,
    }
  }
})
</script>

<style lang="less">
</style>

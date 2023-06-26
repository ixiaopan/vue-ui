<template>
  <div
    :class="['wxp-progress', seekable ? 'wxp-progress-seek' : '']"
    ref="progressRef"
    @click="onClick"
  >
    <div :class="['wxp-progress-inner']">
      <div
        :style="{
          'width': widthPercent + '%',
          'background-color': color
        }"
        :class="['wxp-progress-bar', ended ? 'wxp-progress-bar-ended' : '']"
      ></div>

      <m-draggable 
        v-if="pointer" 
        class="wxp-progress-pointer" 
        :style="pointerStyleObj"
        @dragStart="onDragStart" 
        @dragH="onDraggingH" 
        @dragEnd="onDragEnd"
      >
      </m-draggable>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { progressProps } from './progress'

export default defineComponent({
  name: 'MProgress',
  props: progressProps,
  components: {
    [MDraggable.name]: MDraggable,
  },
  setup(props, { emit }) {
    // 1. 计算容器宽度
    const containerWidth = ref(0)
    const progressRef = ref()
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target == progressRef.value) {
          containerWidth.value = entry.contentRect?.width
          break
        }
      }
    })
    
    onMounted(() => {
      resizeObserver.observe(progressRef.value)
    })
    onUnmounted(() => {
      resizeObserver.disconnect()
    })

    // 2.
    // 是否拖拽中
    let dragging = false

    const ended = computed(() => props.currentTime >= props.duration)
    
    const widthPercent = computed(() => {
      const percent = props.duration > 0 ? props.currentTime / props.duration * 100 : 0

      // 没在拖拽中，更新进度条的同时，同步更新 pointer 的位置
      if (!dragging) {
        setLeft(containerWidth.value * percent / 100)
      }

      return percent >= props.minPercent ? Math.min(100, percent) : 0
    })
    
    // 3. 支持拖拽
    const pointerLeft = ref(0)
    let lastLeft = 0 // 最近一次拖拽停止的地方
    
    const pointerStyleObj = computed(() => {
      return { 
        left: Math.min(containerWidth.value - 14, pointerLeft.value) + 'px'
      }
    })

    function setLeft(x: number) {
      pointerLeft.value = Math.max(0, Math.min(containerWidth.value, x))
    }

    // 
    function onDragStart() {
      dragging = true
      lastLeft = unref(pointerLeft)
    }
    function onDraggingH(x) {
      setLeft(lastLeft + x)
    }
    function onDragEnd() {
      emit('dragEnd', Math.max(0, Math.min(100, unref(pointerLeft) / containerWidth.value)))
      dragging = false
    }

    // 4. 支持 seek
    function onClick(e) {
      if (!props.seekable) return
      
      if (e.target?.classList?.contains('wxp-progress-pointer')) return
      
      emit('seek', e.offsetX / containerWidth.value)
    }

    return {
      progressRef,
      widthPercent,
      ended,
      pointerStyleObj,
      onClick,
      onDragStart,
      onDraggingH,
      onDragEnd,
    }
  }
})
</script>

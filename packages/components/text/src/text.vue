<template>
  <h1 v-if="level==1" class="wxp-text">
    <slot />
  </h1>
  <h2 v-else-if="level==2" class="wxp-text">
    <slot />
  </h2>
  <h3 v-else-if="level==3" class="wxp-text">
    <slot />
  </h3>
  <h4 v-else-if="level==4" class="wxp-text">
    <slot />
  </h4>
  <h5 v-else-if="level==5" class="wxp-text">
    <slot />
  </h5>

  <span 
    v-else-if="ellipsis"
    ref="wrapRef"
    :class="[
      'wxp-text wxp-text-ellipsis',
      rows > 1 ? 'wxp-text-multiple-line' : 'wxp-text-single-line',
      needTruncate ? 'wxp-text-truncate' : '',
    ]"
    :style="{ 'width': width + 'px'}"
  >
    <a-tooltip 
      :overlayClassName="overlayClassName"
      :overlayStyle="overlayStyle"
      :placement="placement"
      :trigger="trigger"
      :title="tooltipAlways || (showTooltip && needTruncate) ? innerTooltip : ''"
      destroyTooltipOnHide
    >
      <span class="wxp-text-ellipsis-inner" @click="myClick">
        <span class="wxp-text-content" ref="textRef">{{ innerTooltip }}</span>
        <span class="wxp-text-ellipsis" ref="ellipsisRef">{{ ellipsisText }}</span>
        <slot />
      </span>
    </a-tooltip>
  </span>

  <span v-else :class="[
    'wxp-text',
    type ? `wxp-text-${type}` : ''
  ]">
    <strong v-if="strong"><slot /></strong>
    <i v-else-if="italic"><slot /></i>
    <del v-else-if="del"><slot /></del>
    <u v-else-if="underline"><slot /></u>
    <slot v-else />
  </span>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { Tooltip } from 'ant-design-vue'

import { resizeObserverEnabled } from '@wxp-ui/utils/is'
import { getLineHeight, getElementHeight, } from '@wxp-ui/utils/dom'

import { textProps } from './text'

import 'ant-design-vue/es/tooltip/style'

export default defineComponent({
  name: 'MText',
  props: textProps,
  components: {
    [Tooltip.name]: Tooltip,
  },
  emits: ['truncated', 'click'],
  setup(props, { emit }) {
    const wrapRef = ref(null)
    const textRef = ref(null)
    const ellipsisRef = ref(null)

    const innerTooltip = computed(() => props.staticText || props.dynamicText)

    const needTruncate = ref(false)

    let observer: any = null
    let truncated = false

    // 进行截断
    function truncateText(container: HTMLElement, textContainer: HTMLElement, max: number) {
      const text = textContainer.textContent || ''
      let currentText = ''

      binarySearch(0, text.length, (l, r, m) => {
        const added = text.slice(l, m + 1)

        textContainer.innerText = currentText + added

        const height = getElementHeight(container)

        if (height > max) {
          // 太长了
          return true
        } else {
          // 太短了
          currentText += added
        }
      })

      textContainer.innerText = currentText
    }

    function reflow() {
      if (!ellipsisRef.value || !wrapRef.value || !textRef.value) return

      // 如果一开始就不需要截断，这个就不该出现
      ellipsisRef.value.style.display = 'none'

      // 二选一
      const visualH = props.maxHeight
        ? props.maxHeight || 0
        : (getLineHeight(wrapRef.value) || 0) * props.rows

      if (!visualH) {
        return console.error('mogic-text: visual area 高度为 0')
      }

      nextTick(() => {
        const wrapH = getElementHeight(wrapRef.value)

        // case 1: 容器够大无需截断
        if (wrapH <= visualH) {
          needTruncate.value = false
          truncated = true
        }
        // case 2: 需要截断
        else {
          needTruncate.value = true

          ellipsisRef.value.style.display = 'inline'
          textRef.value.style.wordBreak = 'break-all'

          truncateText(wrapRef.value, textRef.value, visualH)
          truncated = true
        }

        observeMe()
      })
    }

    function observeMe() {
      if (!observer && props.autoResize && resizeObserverEnabled) {
        observer = new ResizeObserver(() => {
          // 上面的代码恢复监听，会被拦截掉，防止死循环reflow
          if (truncated) {
            truncated = false
            return
          }

          // 取消监听，防止下面的代码更新textRef.textContent继续触发observer
          cancelObserveMe()
          reflow()
        })
      }

      observer?.observe(wrapRef.value)

      return observer
    }
    function cancelObserveMe() {
      if (props.ellipsis && props.autoResize && resizeObserverEnabled && observer) {
        observer.disconnect()
      }
    }
    onMounted(() => {
      if (props.ellipsis) {
        nextTick(() => reflow())
      }
    })
    onBeforeUnmount(() => {
      cancelObserveMe()
    })

    function binarySearch(
      l: number,
      r: number,
      callback: (l: number, r: number, m: number) => boolean
    ): void {
      while (l <= r) {
        const m = Math.floor((l + r) / 2)

        if (callback(l, r, m)) {
          // 太长了
          r = m - 1
        } else {
          // 太短了
          l = m + 1
        }
      }
    }

    function myClick() {
      emit('click')
    }

    return {
      myClick,
      innerTooltip,
      needTruncate,
      wrapRef,
      textRef,
      ellipsisRef,
      reflow,
    }
  },
})
</script>

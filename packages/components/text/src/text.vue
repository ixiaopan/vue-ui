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
      :title="tooltipAlways || (showTooltip && needTruncate && !truncating) ? innerTooltip : ''"
      destroyTooltipOnHide
    >
      <span class="wxp-text-ellipsis-inner" @click="myClick">
        <!-- 省略号的地方 -->
        <span class="wxp-text-content" ref="textRef">
          <template v-if="!dynamic">{{ staticText }}</template>
        </span>

        <span
          class="wxp-text-ellipsis"
          ref="ellipsisRef"
        >{{ ellipsisText }}</span>

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
import { defineComponent, ref, onBeforeUnmount, onMounted, watch, nextTick } from 'vue'
import { Tooltip } from 'ant-design-vue'
import debounce from 'lodash.debounce'

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
    let observer = null

    const wrapRef = ref(null)
    const textRef = ref(null)
    const ellipsisRef = ref(null)

    const innerTooltip = ref(props.tooltip || props.staticText || props.dynamicText)
    
    const needTruncate = ref(false)
    const truncating = ref(false)

    
    function setTextValue(val) {
      innerTooltip.value = props.tooltip || val

      if (textRef.value) {
        textRef.value.textContent = val
      }
    }

    watch(() => props.dynamicText, async (nextVal) => {
      setTextValue(nextVal)
      reflow({ force: true, })
    })

    // 进行截断
    function truncateText(container: HTMLElement, textContainer: HTMLElement, max: number) {
      const text = textContainer.textContent || ''
      let currentText = ''

      binarySearch(0, text.length, (l, r, m) => {
        const added = text.slice(l, m + 1)

        textContainer.innerText = currentText + added
        
        const height = getElementHeight(container)

        if (height > max) { // 太长了
          return true
        } else { // 太短了
          currentText += added
        }
      })

      textContainer.innerText = currentText

      emit('truncated')
    }

    // 重新计算
    function reflow(opts = {}) {
      if (!opts.force && truncating.value) {
        return
      }

      if (opts.reset) {
        if (props.dynamic) {
          setTextValue(props.dynamicText)
        }
      }

      // 如果一开始就不需要截断，这个就不该出现
      ellipsisRef.value.style.display = 'none'

      // 二选一
      const visualH = props.maxHeight ? (props.maxHeight || 0) : (getLineHeight(wrapRef.value) || 0) * props.rows
      if (!visualH) {
        return console.error('wxp-text: visual area 高度为 0')
      }
      const wrapH = getElementHeight(wrapRef.value)

      // console.log('wxp-text', textRef.value.textContent, '可见高度', visualH, '容器高度', wrapH);

      // case 1: 容器够大无需截断
      // TODO < or <=
      if (wrapH <= visualH) {
        needTruncate.value = false
        emit('truncated')
      } else { // case 2: 需要截断
        needTruncate.value = true
        truncating.value = true
        
        ellipsisRef.value.style.display = 'inline'        
        truncateText(wrapRef.value, textRef.value, visualH)
        
        truncating.value = false
      }
    }

    const debounceReflow = debounce(() => {
      reflow({ force: true, reset: true })
    }, 100)

    onMounted(() => {
      if (props.dynamic) {
        setTextValue(props.dynamicText)
      }

      if (props.ellipsis) {
        reflow()
      }

      // 只对文本截断 且开启 自适应
      if (props.ellipsis && props.autoResize) {
        if (resizeObserverEnabled) {
          observer = new ResizeObserver((e) => {
            if (truncating.value) return
            debounceReflow()
          })
          observer.observe(wrapRef.value)
        }
        else {
          // 开启节流
          window.addEventListener('resize', debounceReflow)
        }
      }
    })

    onBeforeUnmount(() => {
      if (props.ellipsis && props.autoResize) {
        if (resizeObserverEnabled && observer && observer.disconnect) {
          observer.disconnect()
        }
        else {
          window.removeEventListener('resize', debounceReflow)
        }
      } 
    })

    function binarySearch(
      l: number, 
      r: number,
      callback: (l: number, r: number, m: number) => boolean
    ): void {
      while (l <= r) {
        const m = Math.floor((l + r) / 2)

        if (callback(l, r, m)) { // 太长了
          r = m - 1
        } else { // 太短了
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
      truncating,
      wrapRef,
      textRef,
      ellipsisRef,
      reflow,
    }
  },
})
</script>

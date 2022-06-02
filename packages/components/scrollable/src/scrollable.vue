<template>
  <div 
    :class="[
      'wxp-scrollable',
      withAsync && !loading && (!dataSource || !dataSource.length) ? 'wxp-scrollable-empty' : ''
    ]" 
    ref="scrollRef"
    @scroll-capture="onScrollCapture" 
  >
    <template v-if="withAsync">
      <!-- 分页加载，每一条的数据 -->
      <div class="wxp-scrollable-list">
        <slot name="row" 
          v-for="record in dataSource" 
          :record="record" 
          :key="record[itemKey]" 
        />
      </div>

      <!-- 空数据 -->
      <slot 
        name="empty" 
        v-if="!loading && (!dataSource || !dataSource.length)"
      />

      <!-- 加载中 -->
      <transition
        name="wxp-scrollable-loading-init-fade"
      >
        <div v-show="loading && isFirstPage" class="wxp-scrollable-loading-init">
          <m-spin v-if="!$slots.loading && loadingText" :tips="loadingText" />
          <slot v-else name="loading" />
        </div>
      </transition>

      <div v-show="loading && !isFirstPage" class="wxp-scrollable-loading-footer">
        <m-spin v-if="!$slots.loading && loadingText" :tips="loadingText" />
        <slot v-else name="loading" />
      </div>

      <!-- 没有更多了 -->
      <slot v-if="!loading && !hasMore" name="hasEnded" />
    </template>

    <!-- 正常嵌入 -->
    <slot v-else />
  </div>
</template>

<script lang="ts">

import { defineComponent, computed, ref } from 'vue'
import { scrollableProps } from './scrollable'

import MSpin from '@wxp-ui/components/spin'

import { smoothScroll } from '@wxp-ui/utils/smooth-scroll'

export default defineComponent({
  name: 'MScrollable',
  props: scrollableProps,
  components: {
    [MSpin.name]: MSpin,
  },
  emits: ['loadmore', 'scroll'],
  setup(props, { emit }) {
    const scrollRef = ref(null)
    
    const isFirstPage = computed(() => props.pageIndex == 1)
    const hasMore = computed(() => props.pageIndex <= props.totalPage)

    function onScrollCapture(e: Event) {
      emit('scroll', e)

      if (props.withAsync) {
        const scrollEle = e.target
        if ( 
          scrollEle.scrollTop + scrollEle.clientHeight + props.threshold >= scrollEle.scrollHeight 
          && !props.loading && hasMore.value
        ) {
          emit('loadmore')
        }
      }
    }

    function goTop() {
      smoothScroll(scrollRef.value, { y : 0 })
    }

    return {
      scrollRef,
      hasMore,
      goTop,
      isFirstPage,
      onScrollCapture
    }
  }
})
</script>

<template>
  <div :class="['wxp-tab', autoResize ? 'wxp-tab-auto' : '' ]">
    <div :class="['wxp-tab-nav', 'wxp-tab-nav-' + size]">
     <div class="wxp-tab-nav-inner" ref="navRef">
        <div 
          v-for="tab in tabList" 
          :key="tab[tabKey]"
          :class="[
            'wxp-tab-nav-item',
            curTabId == tab[tabKey] ? 'wxp-tab-nav-item-active' : '',
            tab.disabled ? 'wxp-tab-nav-item-disabled' : '',
          ]"
          @click="tabClick(tab)"
        >
          <span>{{ tab.name }}</span>
        </div>
     </div>

      <!-- 高亮的滑块 -->
      <div 
        class="wxp-tab-nav-active" 
        :style="autoResize ? {
          transform: 'translateX(' + translateX + 'px)',
        } : {
          width: tabList.length ? 100/tabList.length + '%' : 0,
          transform: 'translateX(' + translateX + '%)',
        }"
      >
        <div class="wxp-tab-nav-active-inner">{{ curTab.name }}</div>
      </div>
    </div>

    <div class="wxp-tab-content" v-if="!onlyTab">
      <div class="wxp-tab-panel">
        Panel
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted, nextTick } from 'vue'

import { tabProps } from './tab'

export default defineComponent({
  name: 'MTab',
  props: tabProps,
  emits: ['change'],
  setup(props, { emit }) {
    // 计算每个 tab 的宽度
    const navRef = ref(null)
    // 第一个偏移是0
    let offsetXList = [0]

    const translateX = ref(0)
    
    const curTabId = ref(props.defaultTabId || (props.tabList[0] || {})[props.tabKey])
    
    const curTab = computed(() => {
      move2CurTab(props.tabList)
      return props.tabList?.filter(t => t[props.tabKey] == curTabId.value)[0]
    })
    
    function move2CurTab(tabList) {
      const index = tabList?.findIndex(t => t[props.tabKey] == curTabId.value)
      
      if (props.autoResize) {
        translateX.value = offsetXList[index] || 0
      } else {
        translateX.value = index > -1 ? 100 * index : 0
      }
    }

    // 计算每个 tab 的宽度
    function calculateOffset(tabList) {
      if (props.autoResize) {
        nextTick(() => {
          offsetXList = [0]
          
          const itemNodeList = navRef.value.querySelectorAll('.wxp-tab-nav-item')
          
          Array.from(itemNodeList).slice(0, -1).forEach((o) => {
            const lastOffsetX = offsetXList[offsetXList.length - 1] || 0
            const nextOffsetX = lastOffsetX + o.offsetWidth
            offsetXList.push(nextOffsetX)
          })
      
          move2CurTab(tabList)
        })
      }
    }

    onMounted(()=>{
      calculateOffset(props.tabList)
    })

    watch(() => props.tabList, (nextV) => {
      calculateOffset(nextV)
    })

    function tabClick(tab) {
      if (tab.disabled) {
        return
      }
      curTabId.value = tab[props.tabKey]
      emit('change', tab)
    }

    return {
      navRef,
      curTab,
      curTabId,
      translateX,
      tabClick,
    }
  }
})
</script>

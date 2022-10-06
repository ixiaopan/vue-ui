<template>
  <div class="dynamic-input-demo">
    <h2>DynamicInput Test</h2>
  
    <h3>Top</h3>
    <m-dynamic-input
      max-count="3"
      disabledHint="最多添加3个卖点"
      placeholder="请输入补充卖点"
      addText="补充卖点"
      ref="topRef"
    />
  
    <h3>Bottom</h3>
    <m-dynamic-input
      max-count="3"
      disabledHint="最多添加3个卖点"
      placeholder="请输入补充卖点"
      addText="添加卖点"
      clearText="清空所有"
      placement="bottom"
      ref="bottomRef"
      class="my-custom-input"
    >
    <template #del="slotProps">
      <m-button type="text" size="small" @click="onDelItem(slotProps.id)">删除一行</m-button>
    </template>
    </m-dynamic-input>
  </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  const topRef = ref()
  const bottomRef = ref()
  
  onMounted(() => {
    topRef.value?.onAdd()
    bottomRef.value?.onAdd()
  })
  
  function onDelItem(id) {
    bottomRef.value?.onDel(id)
  }
  </script>
  
  <style lang="less">
  .my-custom-input {
    .wxp-dynamic-item-input {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
  }
  </style>  
  
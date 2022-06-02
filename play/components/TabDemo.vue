<template>
<div class="tab-demo">
  <h2>Tab Test</h2>

  <m-tab
    class="simple-tab"
    :tabList="tabList"
    tabKey="id"
    v-model:value="sourceBizType"
    defaultTabId="segment"
    @change="change"
  ></m-tab>

  <m-tab
    :tabList="tabList"
    tabKey="id"
    size="small"
    autoResize
    v-model:value="sourceBizType"
    defaultTabId="segment"
  ></m-tab>
</div>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'

const tabList = ref([
  {
    name: '原始型',
    id: 'origin',
    hint: true,
  },
  {
    name: '水是少',
    id: 'd',
  },
  {
    name: '素材',
    id: 'segment',
    hint: true,
  },
  {
    name: '项目禁用的',
    id: 'project',
    disabled: true,
    hint: true,
  }
])

const sourceBizType = ref('segment')
const change = (e: any) => {
  console.log(sourceBizType.value)
}
</script>

<style lang="less">
.simple-tab {
  width: 280px;
  margin-bottom: 20px;
}
</style>  

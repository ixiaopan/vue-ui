<template>
<div class="text-demo">
  <h2>Text Test</h2>

  <h3>Case 1: Display title in different level</h3>
  <div >
    <m-text v-for="n in 5" :key="n" :level="n">h{{n}}. Hello</m-text>
  </div>

  <h3>Case 2: Different Text Style</h3>
  <div>
    <p><m-text>default text</m-text></p>
    <p><m-text underline type="warning">warning text</m-text></p>
    <p><m-text del type="error">error text</m-text></p>
    <p><m-text italic type="success">success text</m-text></p>
  </div>

  <h3>Case 3: Ellipsis Text</h3>
  <div>
    <p class="text-item">
      <m-text ellipsis :max-height="24" staticText="宽度140,测试测测试测试文字截断" />
    </p>

    <p class="text-item">
      <m-text 
        ellipsis 
        :rows="3" 
        staticText="测试测测试测试文字截断，测试测测试测试文字截断，测试测测试测试文字截断，测试测测试测试文字截断，测试测测试测试文字截断，测试测测试测试文字截断"
        tooltip="自定义内容" 
      />
    </p>

    <p class="text-item">
      <m-text 
        ellipsis 
        dynamic
        :max-height="44"
        :showTooltip="false" 
        :dynamicText="dynamicText"
      />
    </p>
    <m-button @click="replaceMe">点击替换，不显示 tooltip</m-button>
  </div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const dynamicText = ref('动态替换')
function replaceMe() {
  dynamicText.value = '不显示tooltip;最大高度44；欢迎登录内容协作平台'
}
</script>

<style lang="less">
.text-item {
  width: 170px;
  background-color: #ccc;
  display: flex;
  line-height: 22px;
}
</style>  

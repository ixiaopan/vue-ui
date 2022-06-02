<template>
<div class="spin-demo">
  <h2>Spin Test</h2>    

  <h3>基本使用</h3>
  <div class="flex">
    <m-spin tips="加载中" />
    <m-spin :spinning="false" tips="没有动画" />
  </div>

  <h3>自定义插槽/文案</h3>
  <div class="flex">
    <m-spin>
      <div class="box"></div>
    </m-spin>
  </div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

</script>

<style lang="less">
.box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #aaa;
}
</style>  

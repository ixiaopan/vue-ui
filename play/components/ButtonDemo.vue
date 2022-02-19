<template>
  <div class="btn-demo">
    <h2>Button Test</h2>
    
    <h3>普通 btn</h3>
    <div class="btn-item">
      <m-button size="large">Large</m-button>
      <m-button size="large" disabled>Large</m-button>
      <m-button size="large" @click="myClick">Click me</m-button>
    </div>

    <div class="btn-item">
      <m-button size="normal">Normal</m-button>
      <m-button size="normal" disabled>Normal</m-button>
    </div>
    
    <div class="btn-item">
      <m-button size="small">small</m-button>
      <m-button size="small" disabled>small</m-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
function myClick() {
  alert('You\'ve clicked button')
}
</script>

<style lang="less">
.btn-item {
  display: flex;
  margin: 10px 0;
}
.btn-item > * {
  margin: 0 10px;
}
</style>

<template>
  <div class="demo-list">
    <!-- <SLOT>, do not remove this comment! -->
    <ButtonDemo />
  </div>
</template>

<script lang="ts" setup>
import ButtonDemo from './components/ButtonDemo.vue'
// <SLOT>, do not remove this comment!
</script>

<style lang="less">
.demo-list {
  padding: 32px;

  > div {
    margin: 32px 0;
  }

  [class$="-demo"] {
    > h2 {
      color: red;
    }
  }

  h3 {
    margin: 20px 0;
  }
}
.flex {
  display: flex;
  > * {
    margin: 0 10px 0 0;
  }
}
</style>

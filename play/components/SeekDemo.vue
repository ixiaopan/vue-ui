<template>
<div class="seek-demo">
  <h2>Seek Test</h2>

  <m-seek @seek="onSeek">
    <div class="box">{{ ratio }}</div>
  </m-seek>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const ratio = ref(0)

function onSeek(r) {
  ratio.value = r.toFixed(2)
}
</script>
  
<style lang="less">
.seek-demo .mogic-seek {
  background: rgb(215, 210, 210);
}
</style>  

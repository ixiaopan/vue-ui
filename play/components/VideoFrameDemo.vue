<template>
<div class="video-frame-thumbnail-demo">
  <h2>VideoFrameThumbnail Test</h2>
  
  <m-video-frame
    :width="200"
    :height="280"
    
    :coverUrl="source.coverImgPath"

    :frameFirst="true"
    :frameUrl="source.frameUrl"
    :frameWidth="source.frameWidth"
    :frameHeight="source.frameHeight"
    :frameCount="source.frameNum"

    :src="source.videoUrl"
    :startTime="source.startTime"
    :endTime="source.endTime"
  />
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const source = ref({
  coverImgPath:'',
  
  frameUrl: '',
  frameWidth: 320,
  frameHeight: 568,
  frameNum: 15,
  
  videoUrl: '',
  startTime: 0, // ms
  endTime: 58766,
})
</script>

<style lang="less">
</style>  

<template>
  <div class="wxp-video-frame">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// 引入 wxp 组件, replace 'wxp'
// import M<wxp> from '@wxp-ui/components/<wxp>'

// 引入 antd 组件, replace 'Ant'
// import { <Ant> } from 'ant-design-vue'
import { videoFrameProps } from './video-frame'

export default defineComponent({
  name: 'MVideoFrame',
  props: videoFrameProps,
  components: {
    // [<Ant>.name]: <Ant>,
    // [M<wxp>.name]: M<wxp>
  },
  setup(props, { emit }) {

  }
})
</script>

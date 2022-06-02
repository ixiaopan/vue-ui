<template>
  <div class="wxp-icon">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// 引入 wxp 组件, replace 'wxp'
// import M<wxp> from '@wxp-ui/components/<wxp>'

// 引入 antd 组件, replace 'Ant'
// import { <Ant> } from 'ant-design-vue'
import { iconProps } from './icon'

export default defineComponent({
  name: 'MIcon',
  props: iconProps,
  components: {
    // [<Ant>.name]: <Ant>,
    // [M<wxp>.name]: M<wxp>
  },
  setup(props, { emit }) {

  }
})
</script>

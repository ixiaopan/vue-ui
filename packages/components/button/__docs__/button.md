---
title: Button
---

# Button

## Normal Button

large normal small 三种尺寸

```vue demo
<template>
  <div class="flex">
    <m-button size="large">Large</m-button>
    <m-button disabled>Disabled Normal</m-button>
    <m-button size="small" @click="myClick">Click small</m-button>
  </div>  
</template>
<script lang="ts" setup>
function myClick() {
  alert('You\'ve clicked button')
}
</script>
```


# API

| Props       | Type        |  Desc       | Default |
| ----------- | ----------- | ----------- | ------ |
| type        | String      | primary, border | primary  |
| size        | String      | large, normal, small  | normal |
| disabled    | Boolean     | - | false  |
| click       | Function    |  - | noop |

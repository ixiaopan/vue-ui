<template>
  <div class="demo-list">
    <MessageDemo />
    <ScrollableDemo />
    <TabDemo />
    <SeekDemo />
    
    <TextDemo />
    <TextSelectionDemo />
    <DynamicInputDemo />
    
    <CascaderDemo />
    <CascaderMultipleDemo />
    <PhoneTagDemo />
    <PhoneTagDemo1 />
    <!-- <SLOT>, do not remove this comment! -->
      
    <!-- <DraggableDemo />
    <TagDemo />
    <SpinDemo />
    <IconDemo />
    <ButtonDemo /> -->
  </div>
</template>

<script lang="ts" setup>
import ButtonDemo from './components/ButtonDemo.vue'
import CascaderDemo from './components/CascaderDemo.vue'
import TagDemo from './components/TagDemo.vue'
import SpinDemo from './components/SpinDemo.vue'
import IconDemo from './components/IconDemo.vue'
import ScrollableDemo from './components/ScrollableDemo.vue'
import MessageDemo from './components/MessageDemo.vue'
import CascaderMultipleDemo from './components/CascaderMultipleDemo.vue'
import PhoneTagDemo from './components/PhoneTagDemo.vue'
import PhoneTagDemo1 from './components/PhoneTagDemo1.vue'
import TabDemo from './components/TabDemo.vue'
import TextDemo from './components/TextDemo.vue'
import TextSelectionDemo from './components/TextSelectionDemo.vue'
import SeekDemo from './components/SeekDemo.vue'
import DraggableDemo from './components/DraggableDemo.vue'
import DynamicInputDemo from './components/DynamicInputDemo.vue'
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

<template>
  <div class="wxp-ui">
    <header class="wxp-header">
      <router-link to="/">
        <img class="wxp-logo" alt="" src="/logo.png" />
      </router-link>
    </header>

    <section class="wxp-body">
      <div class="wxp-sidebar">
        <a-menu v-model:selectedKeys="current">
          <a-menu-item-group v-for="menu in menus" :key="menu.title" :title="menu.title">
            <a-menu-item v-for="item in menu.items" :key="item.name" :item="item">
              <router-link :to="item.name">{{ item.name }}</router-link>
            </a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </div>

      <div class="wxp-content">
        <router-view></router-view>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from 'vue'
import { useRoute } from 'vue-router';

import menus from '../menus'

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Layout',

  components: {
  },

  setup() {
    let current = ref(['Icon'])

    const route = useRoute()
    current.value = [route.name]

    return {
      current,
      menus
    }
  }

})
</script>

<style lang="less">
.wxp-header {
  padding: 20px 40px;
  border-bottom: 1px solid #e6e6e6;
  .wxp-logo {
    height: 32px;
  }
}

.wxp-body {
  display: flex;
  .wxp-sidebar {
    width: 200px;
    padding: 20px 0 0 28px;
    box-sizing: border-box;
  }
  .wxp-content {
    flex: 1;
    padding: 20px;
    box-sizing: border-box;
  }
}

//
.ant-menu-item-selected {
  border-right: 2px solid rgb(64, 158, 255);
}
</style>

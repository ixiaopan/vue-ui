<template>
<div class="scrollable-demo">
  <h2>Scrollable Test</h2>

  <h3>普通内容块嵌入</h3>
  <div class="scroll-demo">
    <p class="scroll-demo-title">标题内容</p>
    <div class="scroll-demo-content">
    <m-scrollable :withAsync="false">
      <ul>
        <li v-for="n in 10">{{ n }}</li>
      </ul>
    </m-scrollable>
    </div>
  </div>

  <h3>翻页内容块嵌入</h3>
  <div class="scroll-demo">
    <p class="scroll-demo-title">标题内容</p>
    <div class="scroll-demo-content">
      <m-scrollable 
        itemKey="uid"
        :data-source="state2.list"
        :page-index="state2.pageIndex"
        :total-page="state2.totalPage"
        :loading="state2.loading"
        @loadmore="loadMember"
        ref="scrollableRef"
        @scroll="myScroll"
      >
        <template v-slot:row="slotProps">
          <div @click="myClick(slotProps.record, $event)">
            {{ slotProps.record.name }}
          </div>
        </template>

        <template #empty>
          <p>我是空内容</p>
        </template>

        <!-- <template #loading>
          <p>自定义加载中...</p>
        </template> -->

        <template #hasEnded>
          <span>没有更多了</span>
        </template>
      </m-scrollable>
    </div>
  </div>

  <button @click="goTop">GoTop</button>

  <h3>翻页内容块嵌入，无内容</h3>
  <div class="scroll-demo">
    <p class="scroll-demo-title">标题内容</p>
    <m-scrollable 
      :data-source="state3.list"
      :page-index="state3.pageIndex"
      :total-page="state3.totalPage"
      :loading="state3.loading"
      @loadmore="loadMember"
    >
      <template #empty>
        <p>我是空内容</p>
      </template>
    </m-scrollable>
  </div>
</div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'

const scrollableRef = ref(null)

const state2 = reactive({
  list: [],
  pageIndex: 1,
  totalPage: 1,
  loading: false,
})

const state3 = reactive({
  list: [],
  pageIndex: 1,
  totalPage: 1,
  loading: true,
})


let counter = 1
async function loadMember() {
  state2.loading = true

  try {
    setTimeout(() => {
      const memberList = [];
      for (let i = 0; i < 10; i++) {
        memberList.push({
          uid: i,
          name: `Edward King ${i} ${i % 2 == 0 ? 'disabled' : ''}`,
          disabled: i % 2 == 0
        });
      }

      state2.loading = false
      state2.list = state2.list.concat(memberList)

      // 更新页脚
      state2.pageIndex =  Math.min(3, ++counter)
      state2.totalPage = 2

      state2.loading = false
    }, 1 * 1000)
  } catch (e) {
    state2.loading = false
    console.log(e)
  }
}

function myClick(record, evt) {
  if (record.disabled) {
    return
  }
  console.log('ds', record.name, evt);
}

function goTop() {
  scrollableRef.value.goTop()
}

function myScroll(e) {
  console.log(e.target.scrollTop);
}
onMounted(() => {
  loadMember()
})
</script>

<style lang="less">
.scroll-demo {
  position: relative; // required
  height: 26vh; // required
  border: 1px solid;
  li {
    margin: 0 0 10px 0;
    background: rgb(235, 235, 235);
  }
  .scroll-demo-title {
    margin: 0;
    border-bottom: 1px solid;
    height: 32px;
  }
  .scroll-demo-content {
    padding: 10px;
    height: calc(26vh - 32px);
  }
}
</style>  

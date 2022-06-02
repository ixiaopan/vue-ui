<template>
<div class="cascader-multiple-demo">
  <h2>CascaderMultiple Test</h2>

  <h3>多选、展示一级类目</h3>
  <m-cascader-multiple
    placeholder="搜索或选择行业"
    :options="goods"
    majestyId="00000000000"
    :default-tag-list="defaultSingleTagList"
    @change="selected"
  />



  <h3>多选、中间层可选</h3>
  <m-cascader-multiple
    placeholder="搜索或选择行业"
    :options="goodsMore"
    intermediate
    majestyId="00000000000"
    @change="selected"
  />
  <!-- :default-tag-list="defaultMultipleTagList" -->
  
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { getGoodsList, queryCategory } from '@/api/phone'
import { omit } from '@wxp-ui/utils/is'

const goods = ref([])
const goodsMore = ref([])
const queryOptions = ref([])
const loading = ref(false)

const defaultSingleTagList = ['G_11', 'G_12']
// [
//   {
//     label: "生活服务",
//     value: "G_11",
//   },
//   {
//     label: "其他商品",
//     value: "G_12"
//   }
// ]

const defaultMultipleTagList = ['G_1', 'G_11/50014927', 'G_10/23']

// 获取所有类目
getGoodsList().then(res => {
  goodsMore.value = res.data.data

  goods.value = res.data.data.map(t => omit(t, [ 'children' ]))
  
  console.log('goods.value', goods.value);
})

// 选到叶子节点后，文本显示
function formatInput(cateList) {
  return cateList.map(t => t.label).join(' > ')
}

//
function selected(val) {
  console.log('selected', val);
}
</script>

<style lang="less">
.cascader-multiple-demo {
  h3 {
    margin-top: 50px;
  }
  .wxp-cascader-multiple:nth-of-type(1) {
    z-index: 3;
  }
  .wxp-cascader-multiple:nth-of-type(2) {
    z-index: 2;
  }
  .wxp-cascader-multiple:nth-of-type(3) {
    z-index: 1;
  }
}
</style>  

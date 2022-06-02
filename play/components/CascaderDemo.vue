<template>
<div class="cascader-demo">
  <h2>Cascader Test</h2>

  <h3>单选，选到叶子节点</h3>
  <m-cascader 
    placeholder="搜索或选择类目"
    :options="goods"
    :width="390"
    :formatInput="formatInput"
    
    @selected="selected"
  />
<!-- :default-option="['G_12', '123536002']" -->


  <h3>单选，可以选择到中间层</h3>
  <m-cascader 
    placeholder="搜索或选择类目"
    :options="goods"
    :width="390"
    :default-option="['G_1', '40', '50005491']"
    intermediate
    :formatInput="formatInput"
    @selected="selected"
  />
  
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { getGoodsList, queryCategory } from '@/api/phone'

const goods = ref([])
const queryOptions = ref([])
const loading = ref(false)

// 获取所有类目
getGoodsList().then(res => {
  goods.value = res.data.data
})
// 选到叶子节点后，文本显示
function formatInput(cateList) {
  return cateList.map(t => t.label).join(' > ')
}

//
function selected(val) {
  console.log('selected', val);
}


// case 3
const customCascaderRef = ref('')
const indicator = ref('')
const indicatorSelected = ref(false)
function showOptionList() {
  customCascaderRef.value.mockFocus()
  indicatorSelected.value = true
}
function customSelected(val) {
  console.log('customSelected', val);
  indicator.value = val[val.length - 1]['label']
}
function customFormatInput(cateList) {
  return cateList.map(t => t.label).join(' > ')
}
function customBlur() {
  indicatorSelected.value = false
}
</script>

<style lang="less">
.cascader-demo {
  h3 {
    margin-top: 50px;
  }
  .wxp-cascader:nth-of-type(1) {
    z-index: 3;
  }
  .wxp-cascader:nth-of-type(2) {
    z-index: 2;
  }
  .wxp-cascader:nth-of-type(3) {
    z-index: 1;
  }
}
</style>  

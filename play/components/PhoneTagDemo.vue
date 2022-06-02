<template>
<div class="phone-tag-demo">
  <h2>PhoneTag Test</h2>
  <h3>输入为1个且为组织内成员</h3>
  
  <!-- uid 替换为你自己的 rowId，每个列表项的唯一ID -->
  <m-phone-tag 
    mode="sole"
    placeholder="输入名称或者手机号"
    :options="options"
    rowId="uid"
    disabledKey="isAdd"
    :loading="loading"
    :formatInput="formatInput"
    :validator="validator"
    @change="doSearch"
    @selected="selected"
  >
    <template v-slot:default="slotProps">
      <p>
        {{ slotProps.row.name }}
      </p>
    </template>

    <template #empty>
      <div>
        你输入的账号不是本组织成员，
      </div>
    </template>
  </m-phone-tag>

  <div style="margin-top:40px;">
    <m-button :disabled="disabled">确定</m-button>
    <p>这里是标签：{{ selectPerson?.name }}</p>
  </div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { getMemberInfo, getMemberNotFound } from '@/api/phone'

// start
const options = ref([])
const loading = ref(false)
const selectPerson = ref(null)

const disabled = computed(() => !selectPerson.value )

// 选中了某个人 删除的话返回 null
function selected(row) {
  console.log('selected ', row);
  
  selectPerson.value = row
}
// 模糊查询API
function doSearch(val) {
  console.log('do search, ', val);

  if (!val) { // 为空不查询
    return
  }

  loading.value = true
  const mockAPI = val == '00' ? getMemberNotFound : getMemberInfo
  mockAPI().then(res => {
    options.value = res.data.data
    loading.value = false
  })
  .catch(() => {
    loading.value = false
  })
}
// blur 的时候校验当前输入，业务方指定
const validator = (val) => {
  if (/[^\d]/.test(val)) {
    return '输入正确的接收人'
  }

  // 全是数字
  if (!/^\d{11}$/.test(val)) {
    return '无效的手机号'
  }
}
// 标签的显示格式，业务方指定，比如 name(phone)
function formatInput(row) {
  if (!row) {
    return ''
  }
  return `${row.name}(${row.mobilePhone})`
}
</script>

<style lang="less">
</style>
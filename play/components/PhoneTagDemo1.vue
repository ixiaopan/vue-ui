<template>
<div class="phone-tag-demo">
  <h2>PhoneTag Test2</h2>

  <h3>输入为多个外部人员手机号2位数，最多2个，空格/逗号</h3>
  <m-phone-tag 
    ref="tagRef"
    mode="multiple"
    :maxTagCount="maxCount"
    repeatable
    tagWarningTips="重复手机号"
    :withAsync="false"
    :formatInput="formatInput"
    :validator="validator"
    @selected="doSelected"
    @overflow="doOverflow"
  >
  </m-phone-tag>

  <div style="margin-top:40px;">
    <p>这里是标签：{{ tagList?.map(t => t._text).join(', ') }}</p>
    <m-button :disabled="disabled">确定</m-button>
    <m-button @click="clear">清空</m-button>
  </div>
</div>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'
const $message = inject('$msg')

// start
const tagList = ref([])
const disabled = ref(true)
const tagRef = ref(null)
const maxCount = ref(2)

function clear() {
  tagRef.value.reset()
}

// 选中了某个人 删除全部的话返回 null
function doSelected(tags) {
  console.log('doSelected', tags);
  
  // 合法且不重复的
  tagList.value = tags?.filter(t => t._isValid && !t._repeat)
  
  disabled.value = (!tags || !tags.length) || tags?.some(t => !t._isValid)
}

// 最多生成N个标签
function doOverflow() {
  $message.error(`最多${maxCount.value}个`)
}

// 标签的显示格式，业务方指定，比如 name(phone)
function formatInput(row) {
  if (!row) {
    return ''
  }
  return `${row.name}(${row.mobilePhone})`
}

// 对 enter 生成的标签验证，只要不是手机号，就是错误的
const validator = (tags, newTag) => {
  // 手机号的校验，我这里随便写的
  console.log('newTag validating...', newTag);

  // 合法的返回 false
  if (/^\d{2}$/.test(typeof newTag == 'string' ? newTag : newTag._text)) {
    return false
  }
  // 非法返回 true
  return true
}
</script>

<style lang="less">
</style>  

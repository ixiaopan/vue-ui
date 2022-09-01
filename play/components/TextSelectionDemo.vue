<template>
  <div class="text-selection-demo">
    <h2>TextSelection Test</h2>

    <h3>基本使用</h3>
    <m-text-selection
      ref="textRef1"
      :text="text"
      :defaultList="defaultList"
      :optionList="optionList"
      @selected="onSelected"
      @onBlurContent="onBlurContent"
      @onFocusContent="onFocusContent"
      theme="light"
    ></m-text-selection>
    <br />
    <p>选择的文本标签:</p>
    <ul>
      <li v-for="item in selectedList" :class="item.focus ? 'text-selection-demo-focus' : ''">
        {{ item.start }} - {{ item.end }} , {{ item.text }}: {{ extractTagName(item.tagList) }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onBeforeUnmount } from 'vue'
  import { registerSelection } from '@wxp-ui/utils'

  function extractTagName(list) {
    return list.map(o => o.attrName).join('')
  }
  // 业务数据
  const defaultList = [] || [
    {
      start: 0,
      end: 11,
      text: 'Hello World',
      tagList: [1],
    },
    {
      start: 0,
      end: 5,
      text: 'Hello',
      tagList: [2],
    },
    {
      start: 27,
      end: 32,
      text: '明月，对影',
      tagList: [2],
    },
    {
      start: 22,
      end: 35,
      text: '亲；举杯邀明月，对影成三人',
      tagList: [1],
    },
  ]
  const tag = ['使用场景', '产品名称', '颜色', '口味', '净含量', '优惠信息']
  const optionList = new Array(tag.length).fill('').map((o, idx) => {
    return {
      attrId: idx,
      attrName: tag[idx],
    }
  })

  // case 1
  const selectedList = ref('')
  const text = ref(
    'Hello World 花间一壶酒，独酌无相亲；举杯邀明月，对影成三人，月既不解饮，影徒随我身; 暂伴月将影，行乐须及春;我歌月徘徊，我舞影零乱; 醒时相交欢，醉后各分散,永结无情游，相期邈云汉'
  )
  function onSelected(val, str) {
    selectedList.value = val
    console.log('onSelected', str)
  }

  function onBlurContent(v) {
    console.log(v)
  }

  function onFocusContent() {
    console.log('测试focus事件')
  }

  // 使用
  const textRef1 = ref()
  const textRefList = [textRef1]

  // 注册全局
  registerSelection(textRefList)
</script>

<style lang="less">
section {
  border: 1px solid;
}
.text-selection-demo-focus {
  background: pink;
}
</style>

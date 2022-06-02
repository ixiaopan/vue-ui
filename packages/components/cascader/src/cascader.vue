<template>
  <div 
    :class="[
      'wxp-cascader',
      'wxp-cascader-sole'
    ]"
    ref="wrapRef"
  >
    <div v-if="!$slots.default" class="wxp-cascader-sole-inner" :style="{ width: width + 'px' }" >
      <div 
      :class="[
        'wxp-cascader-sole-input',
        focused ? 'wxp-cascader-sole-input-focused' : '',
        reason ? 'wxp-cascader-sole-input-error' : '',
      ]"
      @click="mockFocus"
      >
        <!-- 搜索的ICON -->
        <m-icon type="search" class="wxp-cascader-search-icon" />

        <!-- 标签 -->
        <span v-show="soleCateVisible" class="wxp-cascader-sole-text">{{ formatInput(soleCate) }}</span>

        <!-- 输入框 -->
        <a-input 
          ref="inputRef"
          :placeholder="inputPlaceholder"
          :readonly="soleCateVisible"
          v-model:value="phone"
          :style="{width: soleCateVisible ? '0px !important' : 'auto !important'}"
          @keydown.delete="mockDelete"
          @change="debounceInputChange"
          @paste="pastePhone"
        />

        <!-- 清除 icon -->
        <m-icon 
          v-show="phone || (soleCateVisible && focused)"
          type="backspace" 
          class="wxp-cascader-sole-clear" 
          :size="14" 
          @click="clear"
        />
      </div>

      <!-- 原因 -->
      <p class="wxp-cascader-sole-explain" v-if="reason && !focused">{{ reason }}</p>
    </div>

    <slot />

    <!-- 下拉列表 -->
    <div 
      :class="[
        'wxp-cascader-list',
        maxDepth == 1 ? 'wxp-cascader-list-sole' : ''
      ]" 
      v-show="optionListVisible"
    >
      <m-spin :spinning="loading" async>
        <div 
          class="wxp-cascader-list-option-wrap" 
          v-show="!phone"
          v-for="(level, index) in currentList" 
          :key="index"
        >
          <ul class="wxp-cascader-list-option">
            <li 
              v-for="t in level" 
              :class="[
                'wxp-cascader-list-option-item',
                t.disabled ? 'wxp-cascader-list-option-item-disabled' : '',
                t.selecting ? 'wxp-cascader-list-option-item-selecting' : '',
                t.selectingEnded ? 'wxp-cascader-list-option-item-selecting-ended' : '',
                t.selectingEndedLeaf ? 'wxp-cascader-list-option-item-selected' : '',
              ]"
              :key="t.id"
              @click="rowClick(t, $event)"
            >
              <span 
                v-if="intermediate" 
                :class="[
                  'wxp-cascader-list-option-radio',
                  t.selectingEndedLeaf ? 'wxp-cascader-list-option-radio-selected' : '',
                ]" 
              >
              </span>
              <span class="wxp-cascader-list-option-text">{{ t.label }}</span>
              <span class="wxp-cascader-list-option-arrow" v-if="t.childrenCount">
                <!-- <m-icon type="arrow-right" /> -->
                <span class="wxp-icon">></span>
              </span>
            </li>
          </ul>
        </div>

        <!-- 模糊列表 -->
        <ul 
          v-show="phone" 
          class="wxp-cascader-search-option"
          :style="{ width: width + 'px' }"
        >
          <li 
             v-for="(row, idx) in queryList" 
            :class="[
              'wxp-cascader-search-option-item',
            ]" 
            :key="idx"
            @click="selectItem(row)"
          >
            <span
              v-for="(node, idx) in row"
              :key="node.id"
              :class="[
                'wxp-cascader-search-option-item-node',
              ]"
            >
            <span v-if="phoneRegExp && idx == row.length - 1" v-html="node.label.replace(phoneRegExp, '<em>' + phone +  '</em>')"></span>
            <span v-else>{{ node.label }}</span>
            <m-icon type="arrow-right" class="wxp-cascader-search-option-item-node-arrow" /></span>
          </li>
        </ul>

        <!-- 查询不到为空 -->
        <div 
          v-show="phone && !(queryList && queryList.length)"
          :style="{
            'height': emptyHeight + 'px'
          }"
          class="wxp-cascader-empty"
        >
          <span v-if="!$slots.name">
            未搜索到你输入的品类<br />请检查关键词后删除后点选
          </span>
          <slot name="empty" />
        </div>
      </m-spin>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { Input } from 'ant-design-vue'
import debounce from 'lodash.debounce'
import { isArray, omit } from '@wxp-ui/utils/is'

import MTag from '@wxp-ui/components/tag'
import MIcon from '@wxp-ui/components/icon'
import MSpin from '@wxp-ui/components/spin'

import 'ant-design-vue/es/input/style'

import { cascaderProps } from './cascader'

interface NodeProps {
  id: string,
  label: string,
  childrenCount?: number,
  cwd?: string,
  depth?: number,
  parent?: string,
  // 以下是后端给的
  value?: string, // 其实就是 id，不喜欢用这个属性而已，会有歧义
  idPath?: string,
  children?: NodeProps[],
}

function concatFootPath(a: string | string[], b: string | string[], sep='/') {
  if (isArray(a)) {
    const copyA = a.concat(b)
    return copyA.join(sep)
  }
  
  return (a + sep + (isArray(b) ? b.join(sep) : b)).replace(/^\//, '')
}

function splitFootPath(s: string, sep='/') {
  return s.split(sep)
}

const ROOT_NAME = 'root'

export type TagProp = {
  _text: string,
  _isValid: boolean,
  _id: string,
  _leftIconType?: boolean,
  _color?: string, // purple || red || ''
}

export default defineComponent({
  name: 'MCascader',
  props: cascaderProps,
  components: {
    [Input.name]: Input,
    [MTag.name]: MTag,
    [MIcon.name]: MIcon,
    [MSpin.name]: MSpin,
  },
  emits: ['click', 'selected', 'change', 'inputChange', 'blur'],
  setup(props, { emit }) {
    // 输入框DOM
    const inputRef = ref(null)
    // 最外层的DOM
    const wrapRef = ref(null)
    
    // 搜索的话
    const phone = ref('')
    // 模糊搜索的列表
    const queryList = ref([])

    // 输入不合法的原因
    const reason = ref('')
    // 是否聚焦中
    const focused = ref(false)
    // 是否正在转换数据
    const loading = ref(false)

    // 选择到叶子节点的时候，显示的标签值
    const soleCate = ref([])
    // 当前的路径 [cwd, cwd, ...]
    const currentPath = ref([])
    // 当前的下拉列表
    const currentList = ref([])
    // 是否选择到了叶子节点
    const soleEnded = ref(false)

    let radioCheckedNode = null

    // ------- ******** -------
    // 下拉框是否可见
    const optionListVisible = computed(() => focused.value)
    // 标签是否显示，只有选择到叶子节点才显示
    const soleCateVisible = computed(() => !!(soleEnded.value && soleCate.value.length))
    // 显示标签，就不显示占位符
    const inputPlaceholder = computed(() => soleCateVisible.value ? '' : props.placeholder)

    const phoneRegExp = computed(() => phone.value.trim().length ? new RegExp(phone.value, 'g') : '')

    // 重新渲染下拉列表
    watch(() => currentPath.value, (nextV, oldV) => {
      if (!treeData) {
        return
      }

      let mutationStartIndex = 0 // 路径数组中发生第一个变化的索引
      let nextSoleCate = []
      let nextList = []

      // move forward，因为只能一层一层选择
      if (nextV.length > oldV.length) {
        mutationStartIndex = oldV.length - 1
      } else { // backward
        mutationStartIndex = nextV.length - 1 - 1
      }

      // 从 0 到 root, 就是 -1，需要规避；
      // 这个 0 指示的是需要重新渲染的下拉列表的索引，从0开始
      mutationStartIndex = Math.min(0, mutationStartIndex)

      nextList = nextV?.map((fp, idx) => {
        if (idx < mutationStartIndex) {
          // 缓存之前没有变的
          nextSoleCate = soleCate.value.slice(0, idx)

          return currentList.value[ idx ]
        }

        // 这里有可能没有孩子节点，返回 null
        return treeData[fp]?.map(ot => {
          const t = { ...ot } // copy

          const selecting = t.cwd == currentPath.value[idx+1]
          const selectingEnded = soleEnded.value && selecting
          const selectingEndedLeaf = props.intermediate ? t.cwd == radioCheckedNode?.cwd : !t.childrenCount && selectingEnded

          // 记住在选择的节点
          if (selecting) {
            nextSoleCate.push(t)
          }

          return {
            ...t,
            selecting,
            selectingEnded,
            selectingEndedLeaf,
          }
        })
      }).filter(o => o)
      
      if (props.intermediate && radioCheckedNode) {
        currentList.value = nextList.slice(0, Math.max(radioCheckedNode.depth, nextList.length - 1))
      } else {
        currentList.value = nextList
      }

      soleCate.value = nextSoleCate

      // 选到叶子节点
      if (soleEnded.value) {
        emit('selected', nextSoleCate)
        emit('change', nextSoleCate)
      }
    })

    // 所有的类目数据
    let treeData = {}
    // 所有的叶子节点
    let leafNodeList = []
    // 中间层搜索的
    let oneLevelList = []
    let allLayers = []
    watch(() => props.options, (nextV) => {
      resetAll()

      loading.value = true

      treeData = flattenChildren(nextV, ROOT_NAME, {}, null)
      
      loading.value = false
 
      // 默认显示第一级
      currentPath.value = [ROOT_NAME]

      if (props.defaultOption) {
        initCurrentPath(props.defaultOption)
      }

      if (props.intermediate) {
        oneLevelList = leafNodeList.reduce((memo, node) => {
          let resultList = []
          
          let o = node
          while (o) {
            if (!memo.length || !memo.find(nl => nl[nl.length - 1]['id'] == o.id)) { 
              resultList.unshift(reachMe(o))
            }
            o = o.parent
          }

          memo = memo.concat(resultList)

          return memo
        }, [])
      }
    })
    // 把数据拍平
    function flattenChildren(level, footpath, treeData, parent) {
      // 中间层可选模式，需要逐层匹配精确匹配，BFS
      // ensure leaf nodes will be included
      if (props.intermediate) {
        allLayers.push(footpath)
      }

      if (!level || !level.length) {
        return
      }

      if (!treeData[footpath]) {
        treeData[footpath] = []
      }

      level.forEach(t => {
        // 可能有一些业务自己的处理
        if (typeof props.transformer == 'function') {
          props.transformer(t)
        }

        t.id = t.id || t.value
        t.childrenCount = t.children?.length
        t.depth = splitFootPath(footpath).length
        t.parent = parent
        t.cwd = concatFootPath(footpath, t.id)
 
        treeData[footpath].push(omit(t, ['children']))

        // 缓存所有叶子节点
        if (!t.childrenCount) {
          leafNodeList.push({ ...(omit(t, ['children'])) })
        }

        // recursive
        flattenChildren(t.children, concatFootPath(footpath, t.id), treeData, t)
      })

      return treeData
    }

    // ------- ******** -------
    function resetInputStatus(needPlaceholder) {
      phone.value = ''
      reason.value = ''
    }

    function resetAll() {
      resetInputStatus()
      radioCheckedNode = null
      soleCate.value = []
      currentList.value = []
      soleEnded.value = false
      // currentPath.value = [ROOT_NAME]
    }

    function switchLevel(record, forceEnd) {
      console.log('we\'re at ', currentPath.value)
      console.log('you click ', record)

      soleEnded.value = forceEnd || !record.childrenCount

      // 点击了最右侧的
      if (currentPath.value.length == record.depth) {
        currentPath.value = currentPath.value.concat(record.cwd)
      } else { // 切换到上一级
        console.log('ooooo');
        const temp = currentPath.value.slice(0, record.depth)
        currentPath.value = temp.concat(record.cwd)
      }

      // 根据是否选择到叶子节点，重置输入框状态
      resetInputStatus()
      if (soleEnded.value) { // 说明已经到叶子节点了
        mockBlur()
      }

      console.log('now we are at ', currentPath.value);
    }

    // 正常的点击
    function rowClick(record, e) {
      if (record.disabled) {
        return
      }

      if (props.intermediate) {
        // 选择了单选框
        // 如果是叶子节点，点自己也是可以的
        if (
          !record.childrenCount ||
          (e.target && e.target.classList.contains('wxp-cascader-list-option-radio'))
        ) {
          e.stopPropagation()
          radioCheckedNode = record
          switchLevel(record, true)
        } 
        else if (record.childrenCount) {
          radioCheckedNode = null
          switchLevel(record)
        }
      } else {
        switchLevel(record)
      }

      emit('click', record)
    }

    // 模糊列表的点击
    function selectItem(row) {
      soleEnded.value = true
      currentPath.value = [ROOT_NAME].concat(row.map(r => r.cwd))

      resetInputStatus()
      mockBlur()
    }

    // 前端做模糊查询
    function reachMe(node) {
      let tempList = [ node ]
      let o = node.parent
      while (o) {
        tempList.unshift(o)
        o = o.parent
      }
      return tempList
    }
    function queryFromInner(q) {
      if (!q) {
        queryList.value = []
        return
      }
      
      let nextList = []

      if (props.intermediate) {
        // [[p1], [p1, p2], [p1, p2, leaf]]
        nextList = oneLevelList.filter((res) => {
          const lastNode = res[res.length - 1]
          return lastNode.label.indexOf(q) > -1
        })
      } else {
        nextList = leafNodeList.filter(t => t.label.indexOf(q) > -1).map(t => reachMe(t))
      }

      queryList.value = nextList
    }
    
    // ------- ******** -------
    function mockFocus(focus = true, ignoreInput = true) {
      if (inputRef.value) {
        inputRef.value[focus ? 'focus' : 'blur']()
        focused.value = focus
      }     
      if (ignoreInput) {
        focused.value = !!focus
      } 
    }
    function mockBlur() {
      validate()
      mockFocus(false)
      emit('blur')
    }
    function validate() {
      if (props.required) { // 必填项
        if (!soleEnded.value) {
          reason.value = phone.value.trim() ? props.queryErrorMsg : props.errorMessage
          return true
        }
      }
    }
    // 按 backspace 健
    function mockDelete() {
      // 直接删除整个标签
      if (soleCateVisible.value) {
        if (props.intermediate && radioCheckedNode) {
          radioCheckedNode = null
        }
        const lastMutatedPath = currentPath.value[currentPath.value.length - 2]
        const node = {
          cwd: lastMutatedPath,
          childrenCount: treeData[lastMutatedPath]?.length,
          depth: splitFootPath(lastMutatedPath).length - 1,
        }
        switchLevel(node)
      }
    }
    function clear() {
      if (soleCateVisible.value) {
        mockDelete()
      } else {
        resetInputStatus()
      }
      emit('selected', [])
      emit('change', [])
    }

    const debounceInputChange = debounce(() => {
      if (!loading) {
        return
      }
      
      // 鼠标点击了外面，会进行校验；在回来进行输入取消error态
      reason.value = ''

      const val = phone.value.trim()

      if (props.isSelfQuery) {
        loading.value = true
        
        queryFromInner(val)
        
        loading.value = false
      }

      emit('inputChange', val)
    })

    function pastePhone() {
      console.log('pastePhone')
    }

    // 用来回显数据
    function initCurrentPath(pathIdList) {
      if (pathIdList.some(t => !t)) {
        return
      }

      const ret = [ ROOT_NAME ]

      let temp = ROOT_NAME
      const nextPathList = pathIdList.map(t => {
        temp = concatFootPath(temp, t)
        return temp
      })

      if (props.intermediate) {
        // hack 一下，按理需要知道真实所选择的 node 对象
        radioCheckedNode = {
          depth: pathIdList.length,
          cwd: nextPathList[ nextPathList.length - 1]
        }
      }
      // 强制告诉组件，选择结束
      soleEnded.value = true
      currentPath.value = ret.concat(nextPathList)
    }

    // ------- ******** -------
    onMounted(() => {
      document.body.addEventListener('click', (e) => {
        if (focused.value && !wrapRef.value?.contains(e.target)) {
          mockBlur()
        }
      }, false)
    })

    return {
      initCurrentPath,

      phone,
      phoneRegExp,
      queryList,
      loading,
      focused,
      reason,
      
      wrapRef,
      inputRef,
      inputPlaceholder,

      soleCate,
      soleEnded,
      soleCateVisible,
      currentList,
      optionListVisible,

      clear,
      rowClick,
      selectItem,
      mockDelete,
      mockFocus,
      validate,
      debounceInputChange,
      pastePhone,
    }
  },
})
</script>

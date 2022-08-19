<template>
  <div 
    :class="[
      'wxp-cascader-multiple',
    ]"
    ref="wrapRef"
  >
    <div 
      v-if="!$slots.default"
      class="wxp-cascader-multiple-form" 
      :style="{ width: width + 'px', height: height + 'px' }" 
    >
      <div 
      :class="[
        'wxp-cascader-multiple-inner',
        focused ? 'wxp-cascader-multiple-inner-focused' : '',
        disabled ? 'wxp-cascader-multiple-inner-disabled' : '',
        !multipleTag.length && reason ? 'wxp-cascader-multiple-inner-error' : '',
      ]"
      @click="mockFocus"
      >
        <!-- 标签 -->
        <div class="wxp-cascader-multiple-tag-max-count" v-if="maxTagCount > -1">
          <m-tag 
            class="wxp-cascader-multiple-tag"
            v-for="v in multipleTag.slice(0, maxTagCount)"
            type="rounded"
            :iconType="!disabled && !v.disabled && showCloseDisable ? 'close' : ''"
            :key="v._id"
            :color="v._color"
            :disabled="disabled"
            @iconClick="removeTag(v._id, $event)"
          >
            <template v-if="tagEllipsis">
              <m-text ellipsis dynamic :max-height="24" autoResize :dynamicText="v._text" />
            </template>
            
            <template v-else>
              {{ v._text }}
            </template>
          </m-tag>
          
          <a-tooltip v-if="multipleTag.length > maxTagCount">
            <template #title>{{ multipleTag.slice(maxTagCount).map(o => o._text).join(', ')}}</template>
            <m-tag>+{{ multipleTag.length - maxTagCount }}</m-tag>
          </a-tooltip>
        </div>

        <m-tag
          class="wxp-cascader-multiple-tag"
          v-else
          v-for="v in multipleTag"
          type="rounded"
          :iconType="!disabled && !v.disabled && showCloseDisable ? 'close' : ''"
          :key="v._id"
          :color="v._color"
          :disabled="disabled"
          @iconClick="removeTag(v._id, $event)"
        >{{ formatTag ? formatTag(v) : v._text }}</m-tag>

        <!-- 输入框 -->
        <a-input 
          ref="inputRef"
          :placeholder="inputPlaceholder"
          :disabled="disabled"
          v-model:value="phone"
          @pressEnter="mockEnter"
          @keydown.delete="mockDelete"
          @change="debounceInputChange"
          @paste="pastePhone"
          @compositionstart="onCompositionStart"
          @compositionupdate="onCompositionUpdate"
          @compositionend="onCompositionEnd"
        />
      </div>

      <!-- 原因 -->
      <p class="wxp-cascader-multiple-explain" v-if="!multipleTag.length && reason">{{ reason }}</p>
    </div>

    <slot />

    <!-- 下拉列表 -->
    <teleport :to="teleportTo || 'body'">
    <div 
      :class="[
        'wxp-cascader-multiple-list',
        intermediate ? '' : 'wxp-cascader-multiple-list-sole',
        listClass,
      ]" 
      ref="listRef"
      v-show="optionListVisible" 
      :style="intermediate ? styleObj : { width: width + 'px', ...styleObj, }"
    >
      <m-spin :spinning="loading" async>
        <div 
          :class="['wxp-cascader-multiple-list-wrap', index == 0 ? 'wxp-cascader-multiple-list-wrap-first' : '', index == currentList.length - 1 ? 'wxp-cascader-multiple-list-wrap-last' : '']" 
          v-show="!phone"
          v-for="(level, index) in currentList" 
          :key="index"
        >
          <ul class="wxp-cascader-multiple-level">        
            <li 
              v-for="t in level" 
              :class="[
                'wxp-cascader-multiple-level-item',
                t.disabled ? 'wxp-cascader-multiple-level-item-disabled' : '',
                t.selecting ? 'wxp-cascader-multiple-level-item-selecting' : '',
                t.selectedEnded ? 'wxp-cascader-multiple-level-item-selecting-ended' : '',
                t.selected ? 'wxp-cascader-multiple-level-item-selected' : '',
              ]"
              :key="t.id"
              @click="rowClick(t, $event)"
            >
              <a-tooltip v-if="(!(hideFirstCheckbox && index == 0)) && (!leafSelectOnly || !t.childrenCount)">
                <template #title>{{ t.disabled ? tipText : '' }}</template>
                <span
                  :class="[
                    'wxp-cascader-multiple-level-checkbox',
                    t.selected ? 'wxp-cascader-multiple-level-checkbox-selected' : '',
                  ]" 
                />
              </a-tooltip>

              <span class="wxp-cascader-multiple-level-text">{{ t.label }}</span>
              
              <m-icon v-if="t.childrenCount" class="wxp-cascader-multiple-level-arrow" type="arrow-right" />
            </li>
          </ul>
        </div>

        <!-- 模糊列表 -->
        <ul 
          v-show="phone" 
          class="wxp-cascader-multiple-search-option"
          :style="{ width: width + 'px' }"
        >
          <li 
             v-for="(row, idx) in queryList" 
            :class="[
              'wxp-cascader-multiple-search-option-item',
            ]" 
            :key="idx"
            @click="selectItem(row)"
          >
            <span
              v-for="(node, idx) in row"
              :key="node.id"
              :class="[
                'wxp-cascader-multiple-search-option-item-node',
              ]"
            >
              <span v-if="phoneRegExp && idx == row.length - 1" v-html="node.label.replace(phoneRegExp, '<em>' + phone +  '</em>')"></span>
              <span v-else>{{ node.label }}</span>
              <m-icon type="arrow-right" class="wxp-cascader-multiple-search-option-item-node-arrow" />
            </span>
          </li>
        </ul>

        <!-- 查询不到为空 -->
        <div 
          v-show="phone && !(queryList && queryList.length)"
          :style="{
            'height': emptyHeight + 'px'
          }"
          class="wxp-cascader-multiple-empty"
        >
          <span v-if="!$slots.name">
            未搜索到你输入的品类<br />请检查关键词或删除后点选
          </span>
          <slot name="empty" />
        </div>
      </m-spin>
    </div>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { Input, Tooltip } from 'ant-design-vue'
import debounce from 'lodash.debounce'
import { isArray, omit, getElementViewOffset } from '@wxp-ui/utils'

import MTag from '@wxp-ui/components/tag'
import MIcon from '@wxp-ui/components/icon'
import MSpin from '@wxp-ui/components/spin'
import MText from '@wxp-ui/components/text'

import 'ant-design-vue/es/input/style'
import 'ant-design-vue/es/tooltip/style'

import { cascaderMultipleProps } from './cascader-multiple'
import { TagProps } from '../../tag/src/tag'

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
  _color?: string, // purple || red || ''
}

export default defineComponent({
  name: 'MCascaderMultiple',
  props: cascaderMultipleProps,
  components: {
    [Input.name]: Input,
    [Tooltip.name]: Tooltip,
    [MTag.name]: MTag,
    [MIcon.name]: MIcon,
    [MSpin.name]: MSpin,
    [MText.name]: MText,
  },
  emits: ['click', 'selected', 'change', 'inputChange', 'focus', 'blur', 'removeFromTag'],
  setup(props, { emit }) {
    const guid = () => guid._id++
    guid._id = 0

    // 输入框DOM
    const inputRef = ref(null)
    // 最外层的DOM
    const wrapRef = ref(null)
    // 下拉列表DOM
    const listRef = ref(null)
    // teleport 
    const styleObj = ref({})

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

    // 选中的类目
    const multipleCate = ref([])
    // 标签
    const multipleTag = ref([])
    // 当前的路径 [cwd, cwd, ...]
    const currentPath = ref([])
    // 当前的下拉列表
    const currentList = ref([])
    // 通用类目被选择了
    const majestySelected = ref(false)

    let radioCheckedNode = null
    let fromPasted = false
    let isOnComposition = false

    // ------- ******** -------
    const phoneRegExp = computed(() => phone.value.trim().length ? new RegExp(phone.value, 'g') : '')
    // 下拉框是否可见
    const optionListVisible = computed(() => focused.value)
    // 标签是否显示
    const multipleTagVisible = computed(() => !!multipleTag.value.length)
    // 显示标签，就不显示占位符,优先显示 disabledHint
    const inputPlaceholder = computed(() => multipleTagVisible.value ? '' : (props.disabled ? props.disabledHint : props.placeholder))

    // 自适应，每次显示的时候，都重新算一下位置
    watch(() => optionListVisible.value, (nv) => {
      if (nv) {
        calContainerPosition()
      }
    })

    // ------- ******** -------
    function updateEachLevelStatus(curLevel = [], tagList, curPath) {
      const nextTagList = tagList.filter(tag => tag?._isValid)
      
      return curLevel?.map(item => { // 对每一个树节点，遍历当前的 tag
        // 选择了孩子，所选择的标签的父亲是item，高亮显示父亲
        const selectedEnded = !!(nextTagList?.find((t) => t.depth > item.depth && hasParentDependency(t, item)))
        
        // 咩有标签的时候，还是选择中的过程，根据目录来
        const selecting = item.cwd == curPath
        
        // 所选择的标签就在当前下拉列表里，那就直接高亮
        const selected = !!(nextTagList?.find((t) => t.cwd === item.cwd))

        // 选择的标签是父亲，就要禁用孩子
        // 新增业务自定义禁用状态
        const customDisabled = typeof props.disableChecker == 'function' && props.disableChecker(item, nextTagList)
        const disabled = customDisabled || (majestySelected.value && (item.id !== props.majestyId)) || !!(nextTagList?.find((t) => t.depth < item.depth && hasParentDependency(item, t)))

        return {
          ...item,
          disabled,
          selecting,
          selectedEnded,
          selected,
        }
      })
    }

    // 观测标签变化
    watch(() => multipleTag.value, (nextTagList) => {
      currentList.value = currentList.value.map((level, idx) => updateEachLevelStatus(level, nextTagList, currentPath.value[idx+1]))
      emit('selected', nextTagList)
      emit('change', nextTagList)
    })

    // 层级变化，重新渲染下拉列表
    watch(() => currentPath.value, (nextV, oldV) => {
      if (!treeData) {
        return
      }
      
      let mutationStartIndex = 0 // 路径数组中发生第一个变化的索引
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
          return currentList.value[ idx ]
        }

        return updateEachLevelStatus(treeData[fp], multipleTag.value, currentPath.value[idx+1])
      }).filter(o => o && o.length)
      
      if (props.intermediate && radioCheckedNode) {
        currentList.value = nextList.slice(0, Math.max(radioCheckedNode.depth, nextList.length - 1))
      } else {
        currentList.value = nextList
      }
    })

    // ------- ******** -------
    let treeData = {}
    // 所有的叶子节点
    let leafNodeList = []
    // 中间层搜索的
    let oneLevelList = []
    let allLayers = []
    // 2022-07-06 新增
    let defaultSelectPathList = []

    watch(() => props.options, (nextV) => {
      // start
      loading.value = true
      defaultSelectPathList = []

      treeData = flattenChildren(nextV, ROOT_NAME, {}, null)
 
      // 默认显示第一级
      currentPath.value = [ROOT_NAME]
      
      if (props.defaultList) {
        initDefaultTag(defaultSelectPathList)
      } 
      // @deprecated
      else {
        initDefaultTag(props.defaultTagList)
      }

      loading.value = false

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

        // 2022-07-06新增 回显(只给叶子)，自动寻找路径
        props.defaultList?.forEach((dk) => {
          if (t[props.defaultListId] == dk) {
            defaultSelectPathList.push(reachMe(t).map((o) => o.id).join('/'))
          }
        })

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
      currentList.value = []
      queryList.value = []
    }

    // ------- ******** -------
    function switchLevel(record, forceEnd) {
      console.log('we\'re at ', currentPath.value)
      console.log('you click ', record)

      // 点击了最右侧的
      if (currentPath.value.length == record.depth) {
        currentPath.value = currentPath.value.concat(record.cwd)
      } else { // 切换到上一级
        console.log('ooooo');
        const temp = currentPath.value.slice(0, record.depth)
        currentPath.value = temp.concat(record.cwd)
      }

      // 根据是否选择到叶子节点，重置输入框状态
      // resetInputStatus()
      // mockBlur()

      console.log('now we are at ', currentPath.value);
    }

    // 正常的点击
    function rowClick(record, e) {
      if (!props.clickableWhenDisabled && record.disabled) {
        return
      }

      // case 2 允许选择中间层
      if (props.intermediate) {
        // - 在没有 disabled 的情况下
        //  - 到了叶子节点
        //   - 中间层，必须是点击复选框
        // 否则只是展开目录
        if (
          !record.disabled && (!record.childrenCount || (e.target && e.target.classList.contains('wxp-cascader-multiple-level-checkbox')))
        ) {
          e.stopPropagation()
          toggleTag(createTag(record))
        } else if (record.childrenCount) { // 展开下一级
          switchLevel(record)
        }
      } else { // case 1 否则就只有一级目录，生成标签即可 
        toggleTag(createTag(record))
      }

      emit('click', record)
    }

    // ------- ******** -------
    // 模糊列表的点击
    function selectItem(row) {
      // 从搜索列表选择的，必然是合法的
      toggleTag(createTag(row[row.length - 1]))
      // 清空当前输入，因为用标签显示了
      resetInputStatus()
      // 关闭模糊，显示正常列表；模糊立碑隐藏，点透触发 blur 导致所有下拉列表都不可见
      // queryList.value = [] 
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
    function isParentInTag(node) {
      let o = node
      while (o) {
        if (hasExistedTag(o.id)) {
          return true
        }
        o = o.parent
      }
      return false
    }
    function queryFromInner(q) {
      if (!q) {
        queryList.value = []
        return
      }

      let nextList = []

      if (props.intermediate && !props.leafSearchOnly) {
        // [[p1], [p1, p2], [p1, p2, leaf]]
        nextList = oneLevelList.filter((res) => {
          const lastNode = res[res.length - 1]
          return lastNode.label.indexOf(q) > -1 && !isParentInTag(lastNode) && !lastNode.disabled
        })
      } else {
        // 匹配关键词，且不再标签内
        nextList = leafNodeList.filter(t => !t.disabled && t.label.indexOf(q) > -1 && !hasExistedTag(t.id)).map(t => reachMe(t))
      }

      queryList.value = nextList
    }

    // 业务初始化 回显
    function initDefaultTag(nextTag) {
      if (!nextTag || !nextTag.length) return
      
      if (props.intermediate) {
        let defaultTags = nextTag?.filter(t => t).map(nodeId => {
          const childPath = splitFootPath(nodeId)
          const parentPath = childPath.length == 1 ? ROOT_NAME : concatFootPath(ROOT_NAME, childPath.slice(0, -1))
          const o = treeData ? treeData[parentPath]?.find(t => t.cwd == concatFootPath(ROOT_NAME, nodeId)) : null
          if (o) {
            return createTag(o)
          }
        }).filter(o => o)
        
        const majestyTag = defaultTags?.find(t => t.id == props.majestyId)
        if (majestyTag) {
          defaultTags = [ majestyTag ]
          majestySelected.value = true
        }

        if (defaultTags && defaultTags.length) {
          // hack 一下批处理添加
          addTag(defaultTags, { reset: true, })
        } else {
          // 如果没有默认标签，只要tree变化就要重置一下
          multipleTag.value = []
        }
      }
      
      else { // case 1 只有一级
        let defaultTags = nextTag?.filter(t => t).map(tag => {
          if (typeof tag == 'string' || typeof tag == 'number') { // 只需要给 ID 就好了
            const o = treeData ? treeData[ROOT_NAME]?.find(t => t.id == tag) : null
            if (o) {
              return createTag(o)
            }
          } else {
            return createTag({
              ...tag,
              id: tag.value,
              depth: 1,
              cwd: concatFootPath(ROOT_NAME, tag.value),
            })
          }
        }).filter(o => o)

        const majestyTag = defaultTags?.find(t => t.id == props.majestyId)
        if (majestyTag) {
          defaultTags = [ majestyTag ]
          majestySelected.value = true
        }

        if (defaultTags && defaultTags.length) {
          // hack 一下批处理添加
          addTag(defaultTags, { reset: true })
        } else {
          // 如果没有默认标签，只要tree变化就要重置一下
          multipleTag.value = []
        }
      }
    }

    // ------- ******** -------
    // 创建标签
    function createTag(o: NodeProps) {
      return { 
        ...o,
        _text: o.label,
        _isValid: true, 
        _id: o.id || 'tag_' + guid(), 
      }
    }
    // 添加
    function addTag(o: TagProps, opt) {
      
      if (!o) return

      if (opt?.reset) {
        multipleTag.value = o
      } else {
        if (opt?.allowDuplicated) {
          multipleTag.value = multipleTag.value.concat(o)
        } else if (!hasExistedTag(o)) {
          // TODO: why push not work?
          multipleTag.value = multipleTag.value.concat(o)
        }
      } 
    }
    // 删除
    function removeTag(tagId: string, e) {
      multipleTag.value = multipleTag.value.filter(o => o._id !== tagId)
      if (tagId == props.majestyId) {
        majestySelected.value = false
      }
      if (e) {
        emit('removeFromTag', focused.value)
      }
      
      validate()
    }
    // 检查是否已经存在了
    function hasExistedTag(o: TagProps | string) {
      return !!multipleTag.value.find(t => t._id == (typeof o == 'string' ? o : o._id))
    }
    // 复选框，可选择也可以取消
    function toggleTag(o: TagProps) {
      // 选择了通用类目，其他所有都不能选
      if (o._id == props.majestyId) {
        if (hasExistedTag(o)) {
          removeTag(o._id)
        } else {
          multipleTag.value = [o]
          majestySelected.value = true
        }
      } else {
        hasExistedTag(o) ? removeTag(o._id) : (props.intermediate ? addTagIndependently(o) : addTag(o))
      }
    }
    
    // 可以选择中间层的模式，需要判断父子依赖，选择了父亲，不能选择孩子
    function addTagIndependently(newTag) {
      multipleTag.value = multipleTag.value.filter(t => {
        return !hasParentDependency(t, newTag)
      }).concat(newTag)
    }
    function hasParentDependency(child, parent) {
      if (child.cwd && parent.cwd) {
        return child.cwd?.indexOf(parent.cwd + '/') > -1
      }
    }

    // ------- ******** -------
    function addErrorTagFromInput(opt) {
      const val = phone.value?.trim()

      if (val) {
        const errorTag = { 
          _text: val,
          _id: 'tag_' + guid(), 
          _isValid: false, 
          _color: 'red',
        }
        addTag(errorTag, { allowDuplicated: true })
      }

      if (opt.resetInput) {
        resetInputStatus()
      }

      if (opt.blur) {
        mockFocus(false)
      } 
    }
    function mockFocus(focus = true, ignoreInput = true) {
      if (props.disabled) {
        return
      }
      
      if (inputRef.value) {
        inputRef.value[focus ? 'focus' : 'blur']()
        focused.value = !!focus
        
        if (focus) {
          emit('focus')
        }
      }
      
      if (ignoreInput) {
        focused.value = !!focus
      }
    }
    function validate() {
      // 必填项，没有任何标签的情况才校验
      if (props.required && !(multipleTag.value && multipleTag.value.length)) {
        reason.value = phone.value.trim() ? props.queryErrorMsg : props.errorMessage
      } else {
        reason.value = ''
      }
    }
    function mockBlur() {
      addErrorTagFromInput({ resetInput: true, blur: true, })
      // must be after the above line
      validate()
      
      emit('blur')
    }
    function mockEnter() {
      addErrorTagFromInput({ resetInput: true, blur: false, })
    }

    function pastePhone() {
      console.log('pastePhone')
    }
    // 按 backspace 健
    function mockDelete() {
      if (isOnComposition || phone.value || !multipleTag.value.length) {
        return
      }
      const node2Remove = multipleTag.value[multipleTag.value.length - 1]
      if (!node2Remove.disabled) {
        removeTag(node2Remove._id)
      }
    }

    function onCompositionStart() {
      console.log('onCompositionStart')
      isOnComposition = true
    }
    function onCompositionUpdate() {
      console.log('onCompositionUpdate')
      isOnComposition = true
    }
    function onCompositionEnd() {
      console.log('onCompositionEnd')
      isOnComposition = false
    }

    const debounceInputChange = debounce(() => {
      if (loading.value) {
        return
      }

      console.log('debounceInputChange')
      
      // 鼠标点击了外面，会进行校验；在回来进行输入取消error态
      reason.value = ''

      const val = phone.value.trim()

      // 按下了空格
      if (val && (/\s+$/.test(phone.value))) {
        addErrorTagFromInput({ resetInput: true, blur: false, })
      } 
      else if (val && props.isSelfQuery) {
        loading.value = true
        
        queryFromInner(val)
        
        loading.value = false
      }

      emit('inputChange', val)
    })


    // ------- ******** -------
    function calContainerPosition() {
      const { left, top, height } = getElementViewOffset(wrapRef.value)
      styleObj.value = {
        left: left + 'px',
        top: (top + height + props.marginTop) + 'px',
      }
    }

    onMounted(() => {
      document.body.addEventListener('click', (e) => {
        if (focused.value && (!wrapRef.value?.contains(e.target) && !listRef.value?.contains(e.target))) {
          mockBlur()
        }
      }, false)

      calContainerPosition()
    })

    return {
      phone,
      phoneRegExp,
      queryList,
      loading,
      focused,
      reason,
      
      wrapRef,
      inputRef,
      listRef,
      styleObj,
      inputPlaceholder,

      multipleTag,
      multipleTagVisible,
      currentList,
      optionListVisible,

      initDefaultTag,
      removeTag,
      rowClick,
      selectItem,
      mockDelete,
      mockFocus,
      validate,
      mockEnter,
      debounceInputChange,
      onCompositionStart,
      onCompositionUpdate,
      onCompositionEnd,
      pastePhone,
    }
  },
})
</script>

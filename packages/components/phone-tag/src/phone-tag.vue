<template>
  <div 
    :class="[
      'wxp-phone-tag',
      mode ? 'wxp-phone-tag-' + mode : '',
      isSoleMode && reason ? 'wxp-phone-tag-error' : '',
    ]" 
    ref="wrapRef"
  >
    <div class="wxp-phone-tag-input-form">
      <div 
        :class="[
          'wxp-phone-tag-inner',
          focused ? 'wxp-phone-tag-inner-focused' : '',
          isSoleMode && reason ? 'wxp-phone-tag-inner-error' : '',
        ]" 
        :style="{
          'width': width + 'px', 
          'height': height + 'px'
        }"
        @click="mockFocus"
        
      >
        <!-- 多个 模式 -->
        <template v-if="mode == 'multiple'">
          <m-tag 
            class="wxp-phone-tag-item"
            v-for="v in tags"
            type="rounded"
            :key="v._id"
            iconType="close"
            :leftIconType="v._leftIconType ? tagWarningIcon : ''" 
            :leftIconColor="v._leftIconType ? tagWarningColor : ''"
            :leftIconSize="v._leftIconType ? tagWarningSize : 0"
            :leftIconTips="v._leftIconType ? tagWarningTips : ''"
            :color="v._color"
            @iconClick="removeTag(v._id)"
          >{{ v._text }}</m-tag>
        </template>

        <!-- 单个 模式 -->
        <m-tag 
          v-if="mode == 'sole' && soleTag && soleTag[0] && formatInput"
          class="wxp-phone-tag-item"
        >{{ formatInput(soleTag[0]) }}</m-tag>

        <!-- 输入框 -->
        <a-input 
          ref="inputRef"
          :readonly="isSoleMode && soleTag.length == 1"
          :placeholder="inputPlaceholder"
          @pressEnter="mockEnter"
          @keydown.delete="mockDelete"
          v-model:value="phone"
          @change="debounceInputChange"
          @paste="pastePhone"
          @compositionstart="onCompositionStart"
          @compositionupdate="onCompositionUpdate"
          @compositionend="onCompositionEnd"
        />
      </div>

      <!-- 错误原因 TODO: 做一个 transition -->
      <p class="wxp-phone-tag-error-explain" v-if="isSoleMode && reason">{{ reason }}</p>
    </div>

    <div 
      class="wxp-phone-tag-options" 
      v-show="optionListVisible"
    >
      <div v-show="loading" class="wxp-phone-tag-loading">
        <m-spin tips="加载中" />
      </div>

      <!-- 模糊列表 -->
      <div
        :style="{
          'max-height': optionHeight + 'px'
        }"
        class="wxp-phone-tag-option-list" 
      >
        <div 
          :class="[
            'wxp-phone-tag-option-item',
            row._active ? 'wxp-phone-tag-option-item-active' : '',
            row[disabledKey] ? 'wxp-phone-tag-option-item-disabled' : ''
          ]" 
          v-for="row in (soleTag.length ? soleTag : optionList)" 
          :key="row.uid"
          @click="selectItem(row)"
        >
          <slot :row="row" />
        </div>
      </div>

      <!-- 查询不到为空 -->
      <div 
        v-show="!(soleTag.length || (optionList && optionList.length))"
        :style="{
          'height': emptyHeight + 'px'
        }"
        class="wxp-phone-tag-option-empty"
      >
        <slot name="empty" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { Input } from 'ant-design-vue'
import debounce from 'lodash.debounce'

import { isSafari } from '@wxp-ui/utils'

import MSpin from '@wxp-ui/components/spin'
import MTag from '@wxp-ui/components/tag'

import 'ant-design-vue/es/input/style'

import { phoneTagProps } from './phone-tag'

export type TagsProps = {
  _text: string,
  _isValid: boolean,
  _id: string,
  _leftIconType?: boolean,
  _color?: string, // purple || red || ''
}

export default defineComponent({
  name: 'MPhoneTag',
  props: phoneTagProps,
  components: {
    [Input.name]: Input,
    [MSpin.name]: MSpin,
    [MTag.name]: MTag,
  },
  emits: ['change', 'selected', 'overflow', 'unselectable'],
  setup(props, { emit }) {
    const guid = () => guid._id++
    guid._id = 0

    // multi 模式，所有的手机号
    const tags = ref<TagsProps[]>([])
    // sole 模式的的选中的成员
    const soleTag = ref([])

    // 当前输入的手机号
    const phone = ref('')
    // 输入不合法的原因
    const reason = ref('')
    // 是否在搜索中
    const inputting = ref(false)
    // 是否聚焦中
    const focused = ref(false)
    // 转为内部占位符
    const inputPlaceholder = ref(props.placeholder)
    // 下拉框列表
    const optionList = ref([])

    const inputRef = ref(null)
    const wrapRef = ref(null)

    const isSoleMode = props.mode == 'sole'
    const isMultipleMode = props.mode == 'multiple'
    let fromPasted = false
    let isOnComposition = false
    // 多选下，已经加入不能再选
    let unselectable = false
    // 单选下，模糊搜索后只有一个可选，必须选择因为是精准匹配了
    let onlyOneInSole = false

    // 下拉框是否可见
    const optionListVisible = computed(() => 
      props.withAsync && (
        inputting.value || (isSoleMode && soleTag.value.length && focused.value)
      )
    )
    
    function resetInputStatus() {
      onlyOneInSole = false
      phone.value = ''
      reason.value = ''
      inputPlaceholder.value = ''
      inputting.value = false
    }
    function reset() {
      resetInputStatus()
      inputPlaceholder.value = props.placeholder
      optionList.value = []
      tags.value = []
      soleTag.value = []
      emit('selected', null)
    }

    // 下拉列表转为内部状态 case 2 && 3 only
    watch(() => props.options, (newVal) => {
      // 不在输入中的话，不更新
      // 规避输入框已经为空了，异步数据才回来导致列表渲染(虽然不显示，但是数据是 dirty 的，这种情况应该丢弃这个脏数据)
      if (!inputting.value) {
        return
      }

      // case 3 only:  已经在标签里的，不用在下拉列表出现
      if (isMultipleMode && props.withAsync) {
        newVal = newVal?.filter((item) => {
          if (typeof props.filterList == 'function') {
            return props.filterList(item, tags.value)
          }
          return true
        })
      }

      // 如果当前高亮的正好是 disabled，调换一下
      let availableEnterIndex = props.highlightIndex
      if (newVal[props.highlightIndex] && newVal[props.highlightIndex][props.disabledKey]) {
        availableEnterIndex = newVal.findIndex(t => !t[props.disabledKey])
        if (availableEnterIndex > -1) {
          [newVal[props.highlightIndex], newVal[availableEnterIndex]] = [newVal[availableEnterIndex], newVal[props.highlightIndex]]
        }
      }
      
      // 特殊情况找不到
      unselectable = newVal.length && availableEnterIndex == -1

      onlyOneInSole = newVal.length == 1 && availableEnterIndex == 0

      // 默认是高亮第一个，不管什么模式
      optionList.value = newVal?.map((item, index) => {
        // 找到了下一个能用的
        if (availableEnterIndex > -1 && index == props.highlightIndex) {
          item._active = true
        }
        return item
      })
    })

    // 监听输入，实时搜索
    function replaceComma(str) {
      return str.replace(/,/g, ' ')
    }
    const debounceInputChange = debounce(() => {
      console.log('debounceInputChange')

      // 为空 case 1 only:
      if (isSoleMode && !phone.value) { 
        return reset()
      }
      // 以下对 sole 模式不影响

      // 鼠标点击了外面，会进行校验；在回来进行输入取消error态
      reason.value = ''
      // 为空说明删除干净了，也就是不在 输入 状态
      inputting.value = !!phone.value

      let val = replaceComma(phone.value).trim()

      // case 2 with or w/o copy: 多个标签且不支持异步的情况, 输入的时候打了最后一个空格、复制的时候带有空格
      // case 3 w/o copy: 多个标签且支持异步的情况, 仅输入的时候打了最后一个空格
      if (isMultipleMode && (!props.withAsync || !fromPasted) && val && (/\s+$/.test(replaceComma(phone.value)) || /\s+/.test(replaceComma(phone.value)))) {
        
        // 特殊情况, 再次输入有效字符，清空之前的
        if (unselectable && /\s+/.test(replaceComma(phone.value).trim())) {
          phone.value = replaceComma(phone.value).trim().split(/\s+/).slice(1).join(' ')
        } else {
          mockEnter()
        }
      }

      // 重新获取新的输入
      val = replaceComma(phone.value).trim()

      // 不为空
      if (val) {
        // case 3 with copy, containing space 走精准匹配
        if (isMultipleMode && props.withAsync && fromPasted && /\s+/.test(val)) {
          addTag(val, { needExactMatch: true })
        } else { // case 1 && case 2 && case 3 input manually 发起模糊搜索
          console.log('模糊搜索')
          emit('change', val)
        }
      }

      fromPasted = false
    }, props.debounceTime)

    // 复制
    function pastePhone() {
      // case 3 复制情况，走批处理接口
      if (isMultipleMode && props.withAsync) {
        console.log('pastePhone')
        fromPasted = true
      }
    }

    // 聚焦
    function mockFocus(focus = true) {
      if (inputRef.value) {
        inputRef.value[focus ? 'focus' : 'blur']()
        focused.value = focus
        
        if (!focus) {
          inputting.value = false
        }
      }
    }

    // 失焦 对输入框进行校验
    function mockBlur(skipValidation = false) {
      console.log('mock blur');
      
      // case 1 && 3 only
      if (props.loading) {
        return
      }

      // 特殊情况，失焦，清除无效字符
      if (unselectable) {
        resetInputStatus()
        optionList.value = []
        return
      }

      // must be the first
      mockFocus(false)

      // 对输入进行校验
      if (!skipValidation && props.validateTrigger == 'blur') {
        const val = phone.value?.trim()
        // 单个模式 case 1 only
        if (isSoleMode && typeof props.validator == 'function') {
          new Promise((resolve) => {
            if (!val) {
              return resolve()
            }

            // 特殊情况
            if (onlyOneInSole) {
              selectItem(optionList.value?.filter(item => item?._active)[0])
              return resolve()
            }

            // 违法的返回 true，合法的返回 false
            const p = props.validator(val)
            resolve(p)
          })
          .then(error => {
            reason.value = error
          })
        }

        // 多个模式
        else if (isMultipleMode) {
          // case 2 无需跟后端交互，那么前端自动生成标签
          // case 3 搜索不到，下拉列表为空
          // 特殊情况
            if (onlyOneInSole) {
              selectItem(optionList.value?.filter(item => item?._active)[0])
            } else {
              // if (!props.withAsync || (optionListVisible.value && !optionList.value.length)) {
                mockEnter()
            // }
            }
        }
      }
    }

    // 按下回车，选择默认高亮的那个
    function mockEnter() {
      unselectable = false
      
      // 加载远程数据中, 按 enter 无效, case 1 && 3
      if (props.withAsync && props.loading) {
        return
      }

      // 下拉框出现 case 1 && 3
      if (props.withAsync && optionListVisible.value && optionList.value.length) {
        const activeItem = optionList.value?.filter(item => item?._active)[0]
        
        // 下拉选项都是无法选中的情况
        if (!activeItem) {
          unselectable = true
          emit('unselectable')
          return
        }

        selectItem(activeItem)
      }

      // 按下 enter 直接生成标签 case 2 && 3 empty
      if (isMultipleMode) {
        const val = phone.value?.trim()
        if (!val) return
        addTag(val)
      }
    }

    function mockDelete() {
      console.log('mockDelete')

      // 删除完整的用户信息 case 1 only
      if (isSoleMode && soleTag.value && soleTag.value.length) {
        reset()
      }

      // case 2 && 3
      // 没有输入字符的情况，才去删除 tag
      // safari bug: compositionEnd => delete
      if (isSafari) {
        if (mockDelete.safariBug) {
          return mockDelete.safariBug = false
        }
      }

      if (!isOnComposition && isMultipleMode && tags.value?.length && !phone.value) {
        const lastTag = tags.value[tags.value?.length - 1]
        removeTag(lastTag?._id)
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
      mockDelete.safariBug = true
    }

    // 从下拉框选择的，必然正确
    function selectItem(row) {
      // disabled 不可点击
      if (!row || row[props.disabledKey]) {
        return
      }
      
      resetInputStatus()

      // 单个 case 1 only
      if (isSoleMode && typeof props.formatInput == 'function') {
        row._active = true
        
        soleTag.value = [row]

        // 通知父元素
        emit('selected', row)

        // 选中了，那就隐藏下拉框
        mockFocus(false)
      }
      // 多个 case 2 && 3
      else if (isMultipleMode) {
        addTag({ 
          ...row,
          _text: props.formatInput(row), 
          _isValid: true, 
          _id: 'tag_' + guid(), 
        })
      }

      // mockBlur(true)
    }

    // ---- 以下仅对 case 2 case 3 有效 ----
    // 暴露给业务方，主动触发标签生成，无需校验因为数据很明确
    function createTag(o = {}) {
      return { 
        ...o,
        _text: o.text,
        _isValid: true, 
        _id: 'tag_' + guid(), 
        _leftIconType: o.warning,
      }
    }

    function hasDuplicated(newTag) {
      // 脱敏的手机号无法匹配文本，只能通过 uniqueId即后台的ID 去重；
      // 如果是手动输入的还没录入到后台，没有 uniqueId 即后台的ID，校验文本即可
      return tags.value?.some(t => props.rowId in newTag 
          ? t[props.rowId] == newTag[props.rowId] 
          : t._text == newTag._text)
    }
    // 校验标签，不是从 下拉框 选择的，都需要校验
    function validateTag(newTag: TagsProps) {
      // 标签校验
      // 不允许重复标签出现
      if (!props.repeatable && hasDuplicated(newTag)) {
        return
      }

      // 所有违法的标签都显示为 红色
      if (typeof props.validator == 'function' && props.validator(tags.value, newTag)) {
        newTag._color = 'red'
        newTag._isValid = false
        newTag._leftIconType = false
      }

      // 允许重复标签显示在输入框
      if (newTag._isValid && props.repeatable && hasDuplicated(newTag)) {
        newTag._repeat = true
      }

      // case 3 only
      // add warning 合法手机号，但是不在列表内
      if (props.withAsync && !optionList.value.length && newTag._isValid) {
        newTag._leftIconType = true
      }

      return newTag
    }

    function checkOverflow() {
      // 通知父组件，最多容纳的数量
      const leftMaxCount = props.maxTagCount - tags.value.filter(t => t._isValid && !t._repeat).length

      if (leftMaxCount <= 0) {
        console.log('overflow');

        emit('overflow')

        // 自动删除多余的
        resetInputStatus()
      }

      return leftMaxCount
    }

    // 添加标签
    async function addTag(nextTag?: TagsProps | string, opts) {
      if (!nextTag) return

      const leftMaxCount = checkOverflow()
      if (leftMaxCount <= 0) {
        return console.log('已达到最大标签数量');
      }

      if (typeof nextTag == 'string') {
        // ['12', '1234', '000', '']
        let tagList = replaceComma(nextTag).split(props.splitSep)

        // 去除空字符串
        tagList = tagList.filter(o => o)

        // 本身去重
        tagList = Array.from(new Set(tagList))

        console.log('去重后', tagList);

        // case 3 only // 批处理的(超过N个)，需要精确匹配API 
        if (opts?.needExactMatch) {
          // 不合法的 返回 true，过滤掉 可以直接去掉，不在前端显示
          // if (typeof props.validator == 'function') {
          //   tagList = tagList?.filter(t => !props.validator(tags.value, t))
          // }

          // 最大数量截断
          tagList = tagList.slice(0, leftMaxCount)

          let newTagList = await props.batchSearch(tagList)
          
          console.log('精确匹配: ', newTagList);

          // 去重，批处理也要去重
          if (!props.repeatable) {
            newTagList = newTagList?.filter(t => !hasDuplicated(t))
          }

          // 所有违法的标签都显示为 红色，因为要在前端显示
          if (typeof props.validator == 'function') {
            newTagList.forEach(t => {
              if (props.validator(tags.value, t)) {
                t._color = 'red'
                t._isValid = false
                // 违法的就不应该有warning
                t.warning = false
                t._leftIconType = false
              }
            })
          }
          if (newTagList && newTagList.length) {
            tags.value = tags.value.concat(newTagList)
          }
        } else { // case 2 only 不需要批处理的
          const validTagList = []

          for (const t of tagList) {
            const newT = validateTag({
              _text: t,
              _isValid: true,
              _id: 'tag_' + guid(), 
            })
            // 不允许重复标签，返回 null
            // 违法 ，标记 _isValid: false
            // 允许重复，标记 _repeat: false
            if (newT) {
              validTagList.push(newT)
            }

            if (validTagList.filter(t => t._isValid && !t._repeat).length >= leftMaxCount) {
              break
            }
          }
          tags.value = tags.value.concat(validTagList)
        }
      } else {
        tags.value.push(nextTag)
      }

      // reset
      resetInputStatus()

      // 通知父元素
      emit('selected', tags.value)

      if (checkOverflow() <= 0) {
        return console.log('已达到最大标签数量');
      }
    }

    // 删除标签
    function removeTag(tagId) {
      tags.value = tags.value?.filter(t => t._id != tagId)

      // 通知父元素
      emit('selected', tags.value)
    }

    onMounted(() => {
      document.body.addEventListener('click', (e) => {
        if (focused.value && !wrapRef.value?.contains(e.target)) {
          mockBlur()
        }
      }, false)
    })

    return {
      tags,
      soleTag,
      optionList,
      isSoleMode,
      optionListVisible,
      
      phone,
      reason,
      inputPlaceholder,
      focused,
      inputting,

      inputRef,
      wrapRef,

      debounceInputChange,
      onCompositionStart,
      onCompositionUpdate,
      onCompositionEnd,
      pastePhone,
      mockEnter,
      mockFocus,
      mockDelete,
      selectItem,
      removeTag,
      createTag,

      reset,
      resetInputStatus,
    }
  }
})
</script>

<template>
  <div class="wxp-text-selection" ref="wrapRef">
    <section
      ref="textRef"
      @blur.stop="onBlurContent"
      @focus.stop="onFocusContent"
      :contenteditable="editable"
      @paste="onPasted"
      @selectstart="onSelectionStart"
    >
      <span
        v-for="item in flattenList"
        :key="item.id"
        :data-id="item.id"
        :class="[...item.classList, item.focus ? 'wxp-text-selection-focus' : '']"
      >
        {{ item.text }}
      </span>
    </section>

    <teleport to="body">
      <div
        ref="toolkitRef"
        :class="['wxp-text-selection-toolkit', 'wxp-text-selection-toolkit-' + theme]"
        :style="toolkitStyle"
      >
        <div class="wxp-text-selection-toolkit-content">
          <m-icon :size="16" type="wxp-tag-user-add"></m-icon>
        </div>
      </div>

      <div
        ref="tagRef"
        :class="['wxp-text-selection-tag', 'wxp-text-selection-tag-' + theme]"
        :style="tagPopStyle"
      >
        <ul class="wxp-text-selection-tag-list">
          <li class="wxp-text-selection-tag-info">选择文本标签</li>
          <li
            v-for="attr in optionList"
            :key="attr?.attrId"
            @click="onTagClick(attr)"
            class="wxp-text-selection-tag-item"
          >
            {{ attr?.attrName }}
          </li>
        </ul>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts">
  import { gid, omit } from '@wxp-ui/utils'
  import {
    defineComponent,
    ref,
    computed,
    toRaw,
    onMounted,
    watch,
    onUnmounted,
    nextTick,
  } from 'vue'

  import { textSelectionProps } from './text-selection'

  import MIcon from '@wxp-ui/components/icon'

  const PREFIX = 'segment'

  const extractObject = o => ({ text: o.text, start: o.start, end: o.end, focus: o.focus })

  export default defineComponent({
    name: 'MTextSelection',
    props: textSelectionProps,
    components: {
      [MIcon.name]: MIcon,
    },
    emits: ['selected', 'onBlurContent', 'onFocusContent'],
    setup(props, { emit }) {
      // 最后一次选择的位置
      let left
      let top
      let lastRange
      let lastSelection
      let lastStartParentSegment
      let lastEndParentSegment
      let lastParentSegment
      let currentSegment
      let overlapped = false
      let repeated = false

      // 所有被选择的列表
      const tagCollection = ref({})
      const segmentList = ref([])

      // 是否正在划线选择
      const selecting = ref(false)

      const toolkitStyle = ref({})
      const tagPopStyle = ref({})

      const wrapRef = ref()
      const textRef = ref()
      const tagRef = ref()
      const toolkitRef = ref()

      const flattenList = computed(() => {
        const step = (o, arr) => {
          const siblings = o.siblings

          arr.push(omit(o, ['siblings']))

          siblings?.forEach(k => step(k, arr))

          return arr
        }

        return segmentList.value.reduce((m, o) => step(o, m), [])
      })

      watch(
        () => props.defaultList?.length,
        (newV, oldV) => {
          if (newV < oldV) {
            console.log('refresh')
            initDefault(props.defaultList)
          }
        }
      )

      // 初始化默认标注
      initDefault(props.defaultList)
      function initDefault(list) {
        const innerList = [
          props.text?.trim()
            ? createSegment({ id: 'root', start: 0, end: props.text?.length, text: props.text })
            : createSegment({ id: 'root', start: 0, end: 1, text: '\0', empty: true }),
        ]
        const tokenCollection = {}

        list?.forEach(item => {
          const nextSeg = createSegment({
            ...item,
            classList: ['wxp-text-selection-annotated'],
            annotated: true,
          })
          tokenCollection[nextSeg.id] = nextSeg.tagList

          let prevIdx
          let finalList = []

          for (let i = 0; i < innerList.length; i++) {
            const parentSegment = innerList[i]

            if (nextSeg.start > parentSegment.end) {
              continue
            }

            //
            if (nextSeg.start >= parentSegment.start && nextSeg.end <= parentSegment.end) {
              const prev = createSegment({
                start: parentSegment.start,
                end: nextSeg.start,
                text: parentSegment.text.substring(0, nextSeg.start - parentSegment.start),
                classList: parentSegment.annotated ? parentSegment.classList : [],
                splitFrom: [parentSegment.id],
                annotated: parentSegment.annotated,
              })
              const next = createSegment({
                start: nextSeg.end,
                end: parentSegment.end,
                text: parentSegment.text.substring(nextSeg.end - parentSegment.start),
                classList: parentSegment.annotated ? parentSegment.classList : [],
                splitFrom: [parentSegment.id],
                annotated: parentSegment.annotated,
              })

              nextSeg.classList = nextSeg.classList.concat(
                parentSegment.annotated ? parentSegment.classList : []
              )
              nextSeg.splitFrom = [parentSegment.id]

              const finalList = [prev, nextSeg, next].filter(o => o.text)
              innerList.splice(i, 1, ...finalList)

              break
            }

            // 两端
            else if (nextSeg.start >= parentSegment.start && nextSeg.start <= parentSegment.end) {
              prevIdx = i

              const nextParentSegment = innerList[i + 1]

              const prevHead = createSegment({
                start: parentSegment.start,
                end: nextSeg.start,
                text: parentSegment.text.substring(0, nextSeg.start - parentSegment.start),
                classList: parentSegment.annotated ? parentSegment.classList : [],
                splitFrom: [parentSegment.id],
                annotated: parentSegment.annotated,
              })

              const prevTail = createSegment({
                start: nextSeg.start,
                end: nextParentSegment.start,
                text: parentSegment.text.substring(nextSeg.start - parentSegment.start),
                classList: [nextSeg.id, 'wxp-text-selection-annotated'].concat(
                  parentSegment.annotated ? parentSegment.classList : []
                ),
                splitFrom: [parentSegment.id, nextSeg.id],
                annotated: true,
              })

              finalList = [prevHead, prevTail].filter(o => o.text)
            } else if (nextSeg.end >= parentSegment.start && nextSeg.end <= parentSegment.end) {
              const nextHead = createSegment({
                start: parentSegment.start,
                end: nextSeg.end,
                text: parentSegment.text.substring(0, nextSeg.end - parentSegment.start),
                classList: [nextSeg.id, 'wxp-text-selection-annotated'].concat(
                  parentSegment.annotated ? parentSegment.classList : []
                ),
                splitFrom: [parentSegment.id, nextSeg.id],
                annotated: true,
              })
              const nextTail = createSegment({
                start: nextSeg.end,
                end: parentSegment.end,
                text: parentSegment.text.substring(nextSeg.end - parentSegment.start),
                classList: parentSegment.annotated ? parentSegment.classList : [],
                splitFrom: [parentSegment.id],
                annotated: parentSegment.annotated,
              })

              innerList.splice(prevIdx, 1, ...finalList)

              const rightList = [nextHead, nextTail].filter(o => o.text)
              innerList.splice(i + finalList.length - 1, 1, ...rightList)

              break
            }

            // 中间
            else if (nextSeg.start <= parentSegment.start && nextSeg.end >= parentSegment.end) {
              parentSegment.annotated = true
              parentSegment.classList = (parentSegment.classList || []).concat(
                nextSeg.id,
                'wxp-text-selection-annotated'
              )
            }
          }
        })

        segmentList.value = innerList
        tagCollection.value = tokenCollection

        // notifyAnnotationChange()
      }

      // --- 标签列表
      function toggleTagPopover(v: boolean) {
        tagPopStyle.value = {
          display: v ? 'block' : 'none',
          left: left + 'px',
          top: top + 32 + 'px',
        }
      }
      // 选择了标签
      function onTagClick(v) {
        // 现在只能单选，所以这样写没问题，到时候直接取最后一个元素就行
        // 最后一个元素才是该片段的标签
        tagCollection.value[currentSegment.id] = [v]

        segmentList.value.forEach(seg => {
          if (seg.annotated && seg.classList.find(c => tagCollection.value[c])) {
            const idx = seg.classList.findIndex(c => c == 'wxp-text-selection-highlight')
            seg.classList.splice(idx, 1)
            seg.classList.push('wxp-text-selection-annotated')
          }
        })

        notifyAnnotationChange(true)

        // 隐藏标签列表
        toggleTagPopover(false)
      }

      // --- 显示工具箱
      function toggleToolkit(v: boolean) {
        toolkitStyle.value = {
          opacity: v ? 1 : 0,
          left: left + 'px',
          top: top + 'px',
        }
      }

      // --- Range API
      function onSelectionStart() {
        console.log('onSelectionStart')

        if (segmentList.value?.length == 1) {
          const a = segmentList.value[0]
          if (a.empty) {
            const c = a?.text?.replace(/\u0000/g, '')

            if (c?.length) {
              segmentList.value = [createSegment({ id: 'root', start: 0, end: c?.length, text: c })]
            }
          }
        }
      }

      function onBlurContent() {
        emit('onBlurContent', textRef.value?.textContent)
      }

      function onFocusContent() {
        emit('onFocusContent')
      }
      function onSelectionChange(val) {
        lastSelection = val
        selecting.value = !lastSelection.isCollapsed
      }

      // --- 文本高亮
      function highlightSegment(node) {
        if (!node) return

        const taggedClassList = Array.from(node.classList || []).filter(c => tagCollection.value[c])
        if (!taggedClassList.length) return

        segmentList.value.forEach(o => {
          o.focus = o.classList.some(c => taggedClassList.includes(c))
        })

        notifyAnnotationChange()

        return true
      }
      function cancelHighlightSegment() {
        segmentList.value.forEach(o => (o.focus = false))
        notifyAnnotationChange()
      }
      // 创建一个 span 片段
      function createSegment(segment) {
        const id = segment.id || gid(PREFIX)

        return {
          ...segment,
          id,
          siblings: [],
          classList: Array.from(new Set([id, ...(segment.classList || [])])),
        }
      }
      // 添加一条标注
      function addAnnotation(s) {
        console.log('addAnnotation', s)

        if (!s) return

        const { startOffset, endOffset, startContainer, endContainer } = s
        const text = s.toString()

        // 重复打标
        const annotatedList = segmentList.value.filter(o => o.annotated)
        const repeatStartParentClassList = Array.from(startContainer.parentNode.classList)
        const repeatEndParentClassList = Array.from(endContainer.parentNode.classList)
        const repeatEndSeg = annotatedList.find(o => repeatEndParentClassList.includes(o.id))
        if (
          repeatEndSeg &&
          startOffset == 0 &&
          repeatEndSeg.end - repeatEndSeg.start == endOffset
        ) {
          for (let i = 0; i < repeatEndParentClassList.length; i++) {
            const cls = repeatEndParentClassList[i]
            if (
              cls?.startsWith(PREFIX) &&
              tagCollection.value[cls] &&
              repeatStartParentClassList.includes(cls)
            ) {
              currentSegment = { id: cls }

              segmentList.value.forEach(seg => {
                if (seg.annotated && seg.classList.find(c => c.includes(cls))) {
                  seg.classList.push('wxp-text-selection-highlight')
                }
              })

              repeated = true

              return
            }
          }
        }

        // 在同一个节点上进行选择，打散重新组装
        if (startContainer == endContainer) {
          overlapped = false

          const parentClassList = Array.from(startContainer.parentNode.classList)

          // 分为两种情况：是否在高亮的区域内选择

          // 在选中的区域再选择
          const fromAnnotated = parentClassList.includes('wxp-text-selection-annotated')

          // 找到父节点的索引
          const idx = segmentList.value.findIndex(o => parentClassList.includes(o.id))
          const parentSegment = segmentList.value[idx]
          lastParentSegment = parentSegment

          const prev = createSegment({
            start: parentSegment.start,
            end: parentSegment.start + startOffset,
            text: parentSegment.text.substring(0, startOffset),
            classList: fromAnnotated ? parentSegment.classList : [],
            splitFrom: [parentSegment.id],
            annotated: parentSegment.annotated,
          })
          const middle = createSegment({
            start: parentSegment.start + startOffset,
            end: parentSegment.start + endOffset,
            text,
            classList: (fromAnnotated ? parentSegment.classList : []).concat(
              'wxp-text-selection-highlight'
            ),
            splitFrom: [parentSegment.id],
            annotated: true,
          })
          const next = createSegment({
            start: parentSegment.start + endOffset,
            end: parentSegment.start + parentSegment.text.length,
            text: parentSegment.text.substring(endOffset),
            classList: fromAnnotated ? parentSegment.classList : [],
            splitFrom: [parentSegment.id],
            annotated: parentSegment.annotated,
          })

          currentSegment = middle

          // 替换原有的节点
          segmentList.value.splice(idx, 1, prev, middle, next)
        } else {
          overlapped = true

          const startParentClassList = Array.from(startContainer.parentNode.classList)
          const startIdx = segmentList.value.findIndex(o => startParentClassList.includes(o.id))
          const startParentSegment = segmentList.value[startIdx]
          const startHasHighlighted = startParentClassList.includes(
            'wxp-text-selection-annotated'
          )
          lastStartParentSegment = startParentSegment

          const endParentClassList = Array.from(endContainer.parentNode.classList)
          let endIdx = segmentList.value.findIndex(o => endParentClassList.includes(o.id))
          const endParentSegment = segmentList.value[endIdx]
          const endHasHighlighted = endParentClassList.includes('wxp-text-selection-annotated')
          lastEndParentSegment = endParentSegment

          const middle = createSegment({
            start: startParentSegment.start + startOffset,
            end: endParentSegment.start + endOffset,
            text,
            classList: ['wxp-text-selection-highlight'],
            splitFrom: ['root'],
            annotated: true,
          })
          currentSegment = middle

          // fully overlapped elements, simply add a parent id to the segment's classList
          const spanningList = segmentList.value.slice(startIdx + 1, endIdx)
          spanningList.forEach(
            o => (o.classList = o.classList.concat(middle.id, 'wxp-text-selection-annotated'))
          )

          const prevHead = createSegment({
            start: startParentSegment.start,
            end: startParentSegment.start + startOffset,
            text: startParentSegment.text.substring(0, startOffset),
            classList: startHasHighlighted ? startParentSegment.classList : [],
            splitFrom: [startParentSegment.id],
            annotated: startParentSegment.annotated,
          })
          const prevTail = createSegment({
            start: startParentSegment.start + startOffset,
            end: startParentSegment.end,
            text: startParentSegment.text.substring(startOffset),
            classList: [middle.id, 'wxp-text-selection-highlight'].concat(
              startHasHighlighted ? startParentSegment.classList : []
            ),
            splitFrom: [startParentSegment.id, middle.id],
            annotated: true,
          })

          const nextHead = createSegment({
            start: endParentSegment.start,
            end: endParentSegment.start + endOffset,
            text: endParentSegment.text.substring(0, endOffset),
            classList: [middle.id, 'wxp-text-selection-highlight'].concat(
              endHasHighlighted ? endParentSegment.classList : []
            ),
            splitFrom: [endParentSegment.id, middle.id],
            annotated: true,
          })
          const nextTail = createSegment({
            start: endParentSegment.start + endOffset,
            end: endParentSegment.end,
            text: endParentSegment.text.substring(endOffset),
            classList: endHasHighlighted ? endParentSegment.classList : [],
            splitFrom: [endParentSegment.id],
            annotated: endParentSegment.annotated,
          })

          segmentList.value.splice(startIdx, 1, prevHead, prevTail)

          // the index has been reordered, so we need to update the endIdx
          endIdx = segmentList.value.findIndex(o => endParentClassList.includes(o.id))
          segmentList.value.splice(endIdx, 1, nextHead, nextTail)
        }
        // console.log('segmentList', segmentList.value);
      }
      // 取消选择标签，恢复之前的标注
      function resumeLastAnnotation() {
        if (repeated) {
          segmentList.value.forEach(seg => {
            if (seg.annotated && seg.classList.find(c => c.includes(currentSegment.id))) {
              seg.classList = seg.classList.filter(c => c != 'wxp-text-selection-highlight')
            }
          })
          repeated = false
          return
        }

        if (overlapped) {
          const removeStartHeadIndex = segmentList.value.findIndex(o =>
            o.splitFrom.includes(lastStartParentSegment.id)
          )
          const removeStartTailIndex = segmentList.value.findLastIndex(o =>
            o.splitFrom.includes(lastStartParentSegment.id)
          )
          segmentList.value.splice(
            removeStartHeadIndex,
            removeStartTailIndex - removeStartHeadIndex + 1,
            lastStartParentSegment
          )

          const removeEndHeadIndex = segmentList.value.findIndex(o =>
            o.splitFrom.includes(lastEndParentSegment.id)
          )
          const removeEndTailIndex = segmentList.value.findLastIndex(o =>
            o.splitFrom.includes(lastEndParentSegment.id)
          )
          segmentList.value.splice(
            removeEndHeadIndex,
            removeEndTailIndex - removeEndHeadIndex + 1,
            lastEndParentSegment
          )

          segmentList.value.forEach(o => {
            o.classList = o.classList.filter(c => c != currentSegment.id)
          })
        } else {
          const removeStartIndex = segmentList.value.findIndex(o =>
            o.splitFrom.includes(lastParentSegment.id)
          )
          const toRemoveList = segmentList.value.filter(o =>
            o.splitFrom.includes(lastParentSegment.id)
          )

          segmentList.value.splice(removeStartIndex, toRemoveList.length, lastParentSegment)
        }
      }
      // 通知父级组件，更新标注
      function notifyAnnotationChange(isChecked?: boolean) {
        const annotatedList = segmentList.value.filter(o => o.annotated).map(o => toRaw(o))

        const finalCollection = annotatedList.reduce((m, o) => {
          Object.keys(tagCollection.value).forEach(k => {
            if (!m[k]) {
              m[k] = []
            }

            if (o.classList.includes(k)) {
              m[k].push(extractObject(o))
            }
          })

          return m
        }, {})

        const finalList = Object.keys(finalCollection).reduce((m, k) => {
          const o = {
            text: finalCollection[k].reduce((s, t) => s + t.text || '', ''),
            start: Math.min(...finalCollection[k].map(o => o.start)),
            end: Math.max(...finalCollection[k].map(o => o.end)),
            tagList: tagCollection.value[k],
            focus: finalCollection[k].every(o => o.focus),
          }
          m.push(o)
          return m
        }, [])

        // 通知父级组件
        emit('selected', finalList, textRef.value.textContent, isChecked)
      }

      // 文本内容发生变化：编辑、删除
      function updateAnnotation2Edit(target) {
        const editingElement = target.parentNode
        const editingIdx = segmentList.value.findIndex(
          s => s.id == editingElement?.getAttribute('data-id')
        )
        if (editingIdx == -1) return

        const editingSegment = segmentList.value[editingIdx]

        const text = target.data
        editingSegment.text = text

        let offsetEnd = editingSegment.start + text.length
        editingSegment.end = offsetEnd
        for (let i = editingIdx + 1; i < segmentList.value.length; i++) {
          const segment = segmentList.value[i]
          segment.start = offsetEnd

          offsetEnd = offsetEnd + segment.text.length
          segment.end = offsetEnd
        }

        notifyAnnotationChange()
      }
      // 删除节点
      function updateAnnotation2Delete(mutation) {
        if (!mutation.removedNodes?.length) {
          const addBr = mutation.addedNodes[0]

          if (addBr?.nodeName != 'BR') return

          try {
            textRef.value.removeChild(addBr)

            nextTick(() => {
              if (mutation.target.nodeName == 'SECTION') {
                segmentList.value = [
                  createSegment({ id: 'root', start: 0, end: 1, text: '\0', empty: true }),
                ]
              }
            })
          } catch (e) {}
          return
        }

        const editingElement = mutation.removedNodes[0]

        if (!editingElement || editingElement.nodeName != 'SPAN') return

        const editingIdx = segmentList.value.findIndex(
          s => s.id == editingElement?.getAttribute('data-id')
        )
        const editingSegment = segmentList.value[editingIdx]

        if (!editingSegment) return

        for (let i = editingIdx + 1; i < segmentList.value.length; i++) {
          const segment = segmentList.value[i]
          segment.start -= 1
          segment.end -= 1
        }

        // step further, 删除的是标注
        if (editingSegment.annotated) {
          // 从标注库删除该标注
          delete tagCollection.value[editingSegment.id]

          // if it's a fully overlapped annotation, we need to combine the prev and the next segments
          const { previousSibling, nextSibling } = mutation

          // 存在。。比如直接编辑初始文案，[1]会越界
          if (
            previousSibling?.classList &&
            previousSibling?.classList[1] &&
            previousSibling?.classList[1] == nextSibling?.classList[1] &&
            previousSibling?.classList[1] == editingElement?.classList[1]
          ) {
            const prevSiblingId = previousSibling.getAttribute('data-id')
            const nexSiblingId = nextSibling.getAttribute('data-id')

            const prevSiblingIdx = segmentList.value.findIndex(o => o.id == prevSiblingId)
            const nextSiblingIdx = segmentList.value.findIndex(o => o.id == nexSiblingId)

            segmentList.value.splice(prevSiblingIdx, nextSiblingIdx - prevSiblingIdx + 1, {
              ...segmentList.value[prevSiblingIdx],
              text: segmentList.value[prevSiblingIdx].text + segmentList.value[nextSiblingIdx].text,
              end: segmentList.value[nextSiblingIdx].end,
            })
          } else {
            segmentList.value.splice(editingIdx, 1)
          }
        } else {
          segmentList.value.splice(editingIdx, 1)
        }

        notifyAnnotationChange()
      }
      function onPasted(e) {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }

      // ---
      function showToolKit(lastSelection) {
        if (!props.editable) {
          return
        }
        const range = lastSelection.getRangeAt(lastSelection.rangeCount - 1)
        lastRange = range

        const rect = range?.getBoundingClientRect()

        left = rect?.left + rect?.width / 2
        top = rect?.top - props.marginTop

        // 显示工具箱
        toggleToolkit(true)
      }
      function clickOutside(e) {
        // 点击 文本 之外的地方
        if (!textRef.value?.contains(e.target)) {
          // 点击工具箱
          if (toolkitRef.value?.contains(e.target)) {
            console.log('click outside toolkit')

            // 隐藏工具箱
            toggleToolkit(false)

            // 添加一条标注
            addAnnotation(lastRange)

            // 显示标签列表
            toggleTagPopover(true)
          }
          // 点击 tag
          else if (tagRef.value?.contains(e.target)) {
          }
          // 没有任何有效行为：
          else {
            if (toolkitStyle.value.opacity == 1) {
              toggleToolkit(false)
            }

            if (tagPopStyle.value.display == 'block') {
              toggleTagPopover(false)
              resumeLastAnnotation()
            }
          }
        }
      }

      let observer
      function preventMaxChar(e) {
        if (!textRef.value) return

        if (e.keyCode == 8 && !textRef.value.textContent?.trim()) {
          return e.preventDefault()
        }

        if (
          typeof props.maxCount == 'number' &&
          textRef.value.textContent.trim().length >= props.maxCount &&
          ![37, 38, 39, 40, 8].includes(e.keyCode)
        ) {
          e.preventDefault()
        }
      }
      function onCompositionEnd() {
        if (
          typeof props.maxCount == 'number' &&
          textRef.value.textContent.trim().length >= props.maxCount
        ) {
        }
      }
      onMounted(() => {
        function mutationCallback(mutations) {
          console.log('observer', mutations)

          mutations.forEach(mutation => {
            if (mutation.type == 'characterData') {
              updateAnnotation2Edit(mutation.target)
            } else if (mutation.type == 'childList') {
              updateAnnotation2Delete(mutation)
            }
          })
        }
        observer = new MutationObserver(mutationCallback)
        observer.observe(textRef.value, {
          childList: true,
          subtree: true,
          characterData: true,
        })

        wrapRef.value.addEventListener('keydown', preventMaxChar)
        wrapRef.value.addEventListener('compositionend', onCompositionEnd)
      })
      onUnmounted(() => {
        observer?.disconnect()
        wrapRef.value?.removeEventListener('keydown', preventMaxChar)
        wrapRef.value?.removeEventListener('compositionend', onCompositionEnd)
      })

      return {
        selecting,
        segmentList,
        flattenList,
        tagCollection,

        textRef,
        tagRef,
        wrapRef,
        toolkitRef,

        tagPopStyle,
        toolkitStyle,

        onPasted,
        showToolKit,
        onTagClick,
        clickOutside,
        highlightSegment,
        cancelHighlightSegment,
        onSelectionStart,
        onSelectionChange,

        onBlurContent,
        onFocusContent,
      }
    },
  })
</script>

<template>
  <div 
    class="wxp-video-frame-thumbnail"
    @mousemove="onMouseMove"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    ref="thumbnailRef"
    :style="wrapStyle"
  >
    <div v-show="frameDone && (frameFirst ? coverLoaded : hasEntered)" class="wxp-video-item-thumbnail-frames">
      <div v-if="frameFirst" class="wxp-video-frame-slide" :style="{
        ...frameContainerStyle,
        ...canvasContainerStyle,
        ...framePositionStyle,
      }"></div>

      <div v-else class="wxp-video-item-thumbnail-canvas-container" :style="canvasContainerStyle">
        <canvas ref="canvasRef" :style="canvasStyle"></canvas>
      </div>

      <div class="wxp-video-frame-thumbnail-scrubber" :style="lineStyle">
        <span class="wxp-video-item-time-scrubber-time">
          {{ currentTime }} / {{ duration }}
        </span>
      </div>
    </div>

    <div
      class="wxp-video-item-thumbnail-image"
      ref="coverRef"
      v-show="!frameDone || !hasEntered"
      :data-src="coverUrl"
    />

    <div v-show="loading && hasEntered" class="wxp-video-item-thumbnail-loading">
      <span class="wxp-video-item-thumbnail-loading-icon" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { getElementViewOffset, frameResizeIns, frameIntersectionIns } from '@wxp-ui/utils'

import { videoFrameProps } from './video-frame'

export default defineComponent({
  name: 'MVideoFrame',
  props: videoFrameProps,
  components: {},
  setup(props, { emit }) {
    let videoLeft = 0

    const canvasRef = ref()
    const coverRef = ref()
    const thumbnailRef = ref()
    
    const canvasStyle = ref()
    const lineStyle = ref()

    const loading = ref(false)
    const frameDone = ref(false)
    const hasEntered = ref(false)
    const currentTime = ref(0)
    const coverLoaded = ref(false)
    
    // 容器的宽高
    const wrapWidth = ref(props.width)
    const wrapHeight = ref(props.height)

    // 可能不知道开始、结束时长，默认使用视频
    const segmentStartTime = ref(props.startTime || 0)
    const segmentEndTime = ref(props.endTime || 0)
    // 视频总时长
    const duration = computed(() => segmentEndTime.value - segmentStartTime.value)
    
    // 这个视频总共绘制多少帧
    // const frameCount = computed(() => {
    //   let n = duration.value / props.interval

    //   if (duration.value % props.interval) {
    //     n = Math.ceil(n)
    //   }

    //   return n
    // })
    const frameCount = computed(() => props.frameCount)

    // 每一帧的宽高
    const heightPerFrame = ref(0)
    const widthPerFrame = ref(0)
    const canvasContainerStyle = computed(() => ({
      width: widthPerFrame.value + 'px',
      height: heightPerFrame.value + 'px',
    }))

    // 算法生成的长图
    const frameContainerStyle = ref({})
    const framePositionStyle = ref({})

    const wrapStyle = computed(() => ({
      width: wrapWidth.value + 'px',
      height: wrapHeight.value + 'px',
    }))

    function onMouseEnter() {
      hasEntered.value = true
      
      // 有可能会被删除。。。位置变了
      const { left } = getElementViewOffset(thumbnailRef.value)
      videoLeft = left
    }
    function onMouseLeave() {
      hasEntered.value = false
    }

    function onMouseMove(e) {
      if (loading.value || !frameDone.value) {
        return
      }

      // threshold = 1      
      const ratio = (e.pageX - videoLeft + 1) / wrapWidth.value
      const offsetNum = Math.min(frameCount.value - 1, Math.max(0, Math.ceil(ratio * frameCount.value)))

      currentTime.value = Math.min(segmentEndTime.value, Math.max(0, segmentStartTime.value + duration.value * ratio))
      
      if (props.frameFirst) {
        framePositionStyle.value = {
          'background-position': `0 ${-1 * offsetNum * heightPerFrame.value}px`
        }
      } else {
        canvasStyle.value = {
          transform: `translateY(${-1 * offsetNum * heightPerFrame.value}px)`,
        }
      }

      lineStyle.value = {
        left: ratio * wrapWidth.value + 'px',
      }
    }

    let video, img
    function preloadThumbnail(opts?) {
      return new Promise((resolve, reject) => {
        if (loading.value || (!opts?.force && frameDone.value)) {
          return resolve(false)
        }

        if ((!props.width || !props.height) && !props.parentNode) {
          resolve(false)
          return console.warn('width/height or parentNode is required')
        }

        loading.value = true

        if (props.frameFirst) {
          const frameRatio = props.frameWidth! / props.frameHeight!
          
          if (frameRatio > wrapWidth.value! / wrapHeight.value!) {
            widthPerFrame.value = wrapWidth.value!
            heightPerFrame.value = wrapWidth.value! / frameRatio
          } else {
            heightPerFrame.value = wrapHeight.value!
            widthPerFrame.value = wrapHeight.value! * frameRatio
          }

          // 规避 force 带来的重复加载
          if (img) return

          img = new Image()
          img.onload = () => {
            frameContainerStyle.value['background-image'] = 'url(' + props.frameUrl + ')'

            frameDone.value = true
            loading.value = false

            resolve(true)
          }
          img.onerror = () => {
            loading.value = false
            reject()
          }
          img.src = props.frameUrl!
          return
        }

        const drawFrames = async () => {
          const canvas = canvasRef.value
          
          if (!canvas) return console.error('canvas is null')
          
          const context = canvas.getContext('2d')

          let retinaHeightPerFrame
          let retinaWidthPerFrame
          
          const videoRatio = video.videoWidth / video.videoHeight

          if (videoRatio > wrapWidth.value! / wrapHeight.value!) {
            widthPerFrame.value = wrapWidth.value!
            heightPerFrame.value = wrapWidth.value! / videoRatio

            retinaWidthPerFrame = wrapWidth.value! * window.devicePixelRatio
            retinaHeightPerFrame = wrapWidth.value! / videoRatio * window.devicePixelRatio
          } else {
            retinaWidthPerFrame = wrapHeight.value! * videoRatio * window.devicePixelRatio
            retinaHeightPerFrame = wrapHeight.value! * window.devicePixelRatio

            widthPerFrame.value = wrapHeight.value! * videoRatio
            heightPerFrame.value = wrapHeight.value!
          }

          canvas.style.width = `${widthPerFrame.value}px`
          canvas.style.height = `${heightPerFrame.value * frameCount.value}px`

          canvas.width = retinaWidthPerFrame
          canvas.height = retinaHeightPerFrame * frameCount.value
          context.clearRect(0, 0, canvas.width, canvas.height)

          // 结束时间不存在，取视频总时长
          if (!segmentEndTime.value) {
            // 返回的是 s
            segmentEndTime.value = video.duration * 1000
          }

          for (let i = 0; i <= frameCount.value; i++) {
            // unit is second
            // 第一种算法
            // video.currentTime = Math.min(segmentEndTime.value, segmentStartTime.value + i * props.interval) / 1000
            // 第2种算法
            video.currentTime = Math.min(segmentEndTime.value, segmentStartTime.value + i * (duration.value / props.frameCount)) / 1000

            await new Promise(function (resolve) {
              const onCanplay = function () {
                // 不要 startTime 这一帧
                if (i > 0) {
                  context?.drawImage(video, 0, (i - 1) * retinaHeightPerFrame, retinaWidthPerFrame, retinaHeightPerFrame)
                }

                video.removeEventListener('canplay', onCanplay)
      
                resolve(null)
              }

              video.addEventListener('canplay', onCanplay)
            })
          }
          
          frameDone.value = true
          loading.value = false

          resolve(true)
          
          console.log('thumbnails loaded', frameCount.value)
        }

        // 规避 force 带来的重复加载
        if (!video) {
          video = document.createElement('video')
          video.setAttribute('crossorigin', 'anonymous')
          video.muted = true
  
          video.addEventListener('loadeddata', drawFrames)
          video.addEventListener('error', () => {
            loading.value = false
            reject()
          })
  
          video.src = props.src!
          video.load()
        } else {
          drawFrames()
        }
      })
    }

    function updateWrapRect() {
      if (props.parentNode) {
        const { width, height } = getElementViewOffset(props.parentNode)
        
        if (!width || !height) {
          return console.error('parent width/height is null')
        }

        wrapHeight.value = height
        wrapWidth.value = width
      }
    }

    let observer
    onMounted(() => {
      if (props.autoResize && !props.parentNode) {
        return console.warn('autoResize must be equipped with parentNode')
      }

      // 初始化父容器宽度，如果指定了父节点
      updateWrapRect()      
      
      // 可见的时候才加载
      thumbnailRef.value._load = preloadThumbnail
      frameIntersectionIns.observe(thumbnailRef.value)

      // 开启自适应
      if (props.autoResize) {
        console.log('autoResize mode is on')
        
        if (!props.parentNode) {
          console.warn('autoResize must be equipped with parentNode')
          return
        }

        props.parentNode._load = () => {
          updateWrapRect()
          // 重新绘制 canvas
          return preloadThumbnail({ force: true })
        }

        props.parentNode._observed = false
        
        frameResizeIns.observe(props.parentNode)
      }

      // 封面加载完成 & 帧也加载完成，自动显示帧序列；规避v-show重绘出现一闪的问题
      if (props.frameFirst) {
        observer = new MutationObserver((mutationList) => {
          for (const mutation of mutationList) {
            if (mutation.type === 'attributes') {
              if (mutation.attributeName == 'data-src') {
                coverLoaded.value = true
              }
            }
          }
        })
        observer.observe(coverRef.value, { attributes: true, })
      }
    })

    onBeforeUnmount(() => {
      if (props.parentNode) {
        frameResizeIns?.unobserve(props.parentNode)
      }
      
      frameIntersectionIns?.unobserve(thumbnailRef.value)

      observer?.disconnect()
    })

    return {
      frameContainerStyle,
      framePositionStyle,
      coverLoaded,

      heightPerFrame,
      widthPerFrame,
      currentTime,
      duration,
      frameDone,
      loading,
      hasEntered,
      
      wrapStyle,
      lineStyle,
      canvasStyle,
      canvasContainerStyle,
      
      coverRef,
      canvasRef,
      thumbnailRef,

      onMouseEnter,
      onMouseMove,
      onMouseLeave,
    }
  }
})
</script>

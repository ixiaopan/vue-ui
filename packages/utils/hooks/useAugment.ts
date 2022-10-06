import { ref, computed } from 'vue'

import { Editor, EDITOR_TYPE, EDITOR_PRESET_BG } from '../editor'

export const MAX_CANVAS_WIDTH = 5000
export const MIN_CANVAS_WIDTH = 0

export const MIN_OBJ_SCALE = 1
export const MAX_OBJ_SCALE = 500
export const DEFAULT_OBJ_SCALE = 100

type IEditObject = {
  width?: number
  height?: number,
  left?: number
  top?: number
}

type IEditOption = {
  url: string
  type: EDITOR_TYPE,
  canvasId: HTMLCanvasElement,
  width: number,
  height: number
  background: string,
  defaultPosition?: IEditObject | null
}

let editor
const currentTime = ref(0)
const duration = ref(0)
const playing = ref(false)
const muted = ref(false)

export function useMediaEditor() {
  const getCurrentTime = computed(() => currentTime.value)
  const getDuration = computed(() => duration.value)
  const getPlaying = computed(() => playing.value)
  const getMuted = computed(() => muted.value)

  // -- 
  function initEditor(options: IEditOption) {
    if (options.type == EDITOR_TYPE.IMAGE) {
      return initImageEditor(options)
    }

    if (options.type == EDITOR_TYPE.VIDEO) {
      return initVideoEditor(options)
    }
  }
  function initVideoEditor(options: IEditOption) {
    editor = new Editor(options)

    editor.on('onLoadedMetadata', (d: number) => {
      duration.value = d
    }) 
    editor.on('onProgress', (t: number) => {
      currentTime.value = t
    }) 
    editor.on('play', () => {
      playing.value = true
    }) 
    editor.on('pause', () => {
      playing.value = false
    }) 
    editor.on('muteOn', () => {
      muted.value = true
    }) 
    editor.on('muteOff', () => {
      muted.value = false
    }) 
    
    return editor.loadVideoFromUrl(options.url, options).then((o: any) => {
      editor.addVideo(o)
      editor.renderAll()

      return editor
    }).catch((e) => {
      console.log('load video error', e)
    })
  }
  function initImageEditor(options: IEditOption) {
    editor = new Editor(options)

    return editor.loadImageFromUrl(options.url, options)
      .then((img: any) => {
        editor.addImage(img)
        editor.renderAll()
        
        return editor
      })
      .catch((e) => {
        console.log('load image error', e)
      })
  }

  function toJSON() {
    return editor?.toJSON()
  }
  function restore() {
    editor?.restore()
  }
  
  // -- 
  function setBackground(color) {
    if (!editor) return
    editor.background = color == EDITOR_PRESET_BG.GAUSSIAN ? editor.options.url : color
  }
  function resizeAndRender(width, height) {
    if (!editor) return
    
    editor.resize(width, height)
    editor.renderAll()
  }
  function fitByHeight() {
    if (!editor) return
    
    const activeObj = editor.getActiveObj()
    activeObj?.fitHeight()
  }
  function fitByWidth() {
    if (!editor) return
    
    const activeObj = editor.getActiveObj()
    activeObj?.fitWidth()
  }
  function scaleAndRender(scaleX, scaleY) {
    if (!editor) return
    
    const activeObj = editor.getActiveObj()
    activeObj?.scale(scaleX, scaleY)
  }
  function moveAndRender(left, top?) {
    if (!editor) return
    
    const activeObj = editor.getActiveObj()
    activeObj?.move(left, top)
  }

  // -- 视频相关
  function play() {
    editor.play()
  }
  function pause() {
    editor.pause()
  }
  function muteOn() {
    editor.openMute()
  }
  function muteOff() {
    editor.closeMute()
  }

  // -- 浮层关闭，销毁即可
  function destroy() {
    duration.value = 0
    currentTime.value = 0
    playing.value = false
    muted.value = false
    
    editor?.destroy()
    editor = null
  }
  
  return {
    getCurrentTime,
    getDuration,
    getPlaying,
    getMuted,

    initEditor,
    resizeAndRender,
    setBackground,
    restore,
    toJSON,
    
    fitByHeight,
    fitByWidth,
    scaleAndRender,
    moveAndRender,
    
    play,
    pause,
    muteOn,
    muteOff,
    
    destroy,
  }
}

<template>
  <div class="message-demo">
    <h2>Message Test</h2>

    <m-button @click="showSuccessMsg">Success</m-button>
    <m-button @click="showLoadingMsgManual">手动控制显示 loading</m-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, ref  } from 'vue'

export default defineComponent({
  setup() {
    const $message = inject('$msg')

    function showSuccessMsg() {
      $message.success('设置成功, 2s后自动关闭')
    }

    let timer, progress = 0
    function showLoadingMsgManual() {
      let manualMsg = $message.loading({
        message: `${progress}% 加载中...`,
        duration: -1,
      })

      timer = setInterval(() => {
        progress += 1

        if (progress >= 10) {
          clearInterval(timer)
          // 防止内存泄露
          manualMsg.close()
          manualMsg = null
          return
        }

        manualMsg.update({
          message: `${progress}% 视频合成中...`,
        })
      }, 500)
    }

    return {
      showSuccessMsg,
      showLoadingMsgManual,
    }
  }
})
</script>

<style lang="less">
.message-demo {
  .wxp-btn {
    margin-bottom: 20px;
  }
}
</style>

import { createApp } from 'vue'

import { MMessage } from '@wxp-ui/components/message'
import '@wxp-ui/theme/src/message.less'

import App from './app.vue'

const app = createApp(App)

app.provide('$msg', MMessage)

app.mount('#app')

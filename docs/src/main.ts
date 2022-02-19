import 'vite-plugin-vuedoc/style.css'
import './index.less'

import { createApp } from 'vue'

import wxp from '@wxp/wxp-ui'
import '@wxp/wxp-ui/dist/index.css'

import { router } from './router'
import App from './App.vue'

const app = createApp(App)

app.use(router)
app.use(wxp)

app.mount('#app')

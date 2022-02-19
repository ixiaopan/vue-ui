import * as components from '@wxp-ui/components'
import type { App } from 'vue'

export default {
  install: (app: App) => {
    Object.entries(components).forEach(([ name, comp ]) => {
      app.component(name, comp)
    })
  }
}

export * from '@wxp-ui/components'

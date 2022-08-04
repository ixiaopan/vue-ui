import type { App } from 'vue'

import { setupCopyDirective } from './copy'
import { setupRepeatDirective } from './repeatClick'

export function setupGlobDirectives(app: App) {
  setupCopyDirective(app)
  setupRepeatDirective(app)
}

import type { App, Plugin } from 'vue'

export type SFCWithInstall<T> = T & Plugin

export const withInstall = <T>(comp: T) => {
  (comp as SFCWithInstall<T>).install = (app: App) => {
    app.component((comp as any).name, comp)
  }

  return comp as SFCWithInstall<T>
}

export const withInstallFunction = <T>(fn: T, name: string) => {
  ;(fn as SFCWithInstall<T>).install = (app) => {
    app.config.globalProperties[name] = fn
  }

  return fn as SFCWithInstall<T>
}

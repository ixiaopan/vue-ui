import { resolve } from 'path'

export const projectRoot = resolve(__dirname, '..', '..')
export const pkgRoot = resolve(projectRoot, 'packages')

export const compRoot = resolve(pkgRoot, 'components')
export const themeRoot = resolve(pkgRoot, 'theme')
export const utilRoot = resolve(pkgRoot, 'utils')
export const uiRoot = resolve(pkgRoot, 'wxp-ui')
export const docRoot = resolve(projectRoot, 'docs')

export const buildDir = resolve(projectRoot, 'dist')
export const uiDir = resolve(buildDir, 'wxp-ui')

export const projPackage = resolve(projectRoot, 'package.json')
export const compPackage = resolve(compRoot, 'package.json')
export const themePackage = resolve(themeRoot, 'package.json')
export const uiPackage = resolve(uiRoot, 'package.json')
export const utilPackage = resolve(utilRoot, 'package.json')
export const docPackage = resolve(docRoot, 'package.json')

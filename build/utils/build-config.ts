import path from 'path'
import { uiDir } from './paths'
import { WXP_PKG } from './constants'

export const buildConfig = {
  esm: {
    module: 'ESNext',
    format: 'esm',
    ext: 'mjs',
    output: {
      name: 'es',
      path: path.resolve(uiDir, 'es'),
    },
    bundle: {
      path: `${WXP_PKG}/es`,
    },
  },
  cjs: {
    module: 'CommonJS',
    format: 'cjs',
    ext: 'js',
    output: {
      name: 'lib',
      path: path.resolve(uiDir, 'lib'),
    },
    bundle: {
      path: `${WXP_PKG}/lib`,
    },
  },
}

export type BuildConfig = typeof buildConfig

import path from 'path'
import { uiDir } from './paths'

export const buildConfig = {
  esm: {
    module: 'ESNext',
    format: 'esm',
    ext: 'mjs',
    output: {
      name: 'es',
      path: path.resolve(uiDir, 'es'),
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
  },
}

export type BuildConfig = typeof buildConfig

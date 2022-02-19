import path from 'path'
import { mkdir, copyFile } from 'fs/promises'
import { copy } from 'fs-extra'
import { series, parallel } from 'gulp';
// import { genTypes } from './gen-types';
import { withTaskName, run } from './utils';
import { uiDir, projectRoot, uiPackage } from './utils/paths';


export const copyMiscFiles = () =>
  Promise.all([
    copyFile(uiPackage, path.join(uiDir, 'package.json')),
    copyFile(
      path.resolve(projectRoot, 'README.md'),
      path.resolve(uiDir, 'README.md')
    ),
    // copyFile(
    //   path.resolve(projectRoot, 'typings/global.d.ts'),
    //   path.resolve(uiDir, 'global.d.ts')
    // ),
  ])


const copyFinalStyle = async () => {
  await mkdir(path.resolve(uiDir, 'dist'), { recursive: true })
  await copyFile(
    path.resolve(uiDir, 'theme/index.css'),
    path.resolve(uiDir, 'dist/index.css')
  )
}

export default series(
  withTaskName('clean', async () => run('pnpm run clean')),
  withTaskName('createOutput', () => mkdir(uiDir, { recursive: true })),

  parallel(
    withTaskName('buildModules', () => run('pnpm run build buildModules')),
    // withTaskName('buildFullBundle', () => run('pnpm run build buildFullBundle')),
    series(
      withTaskName('buildTheme', () => run('pnpm run -C packages/theme build')),
      copyFinalStyle
    )
  ),

  copyMiscFiles
)

export * from './modules'

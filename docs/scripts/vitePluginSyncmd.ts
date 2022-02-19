import { Plugin } from 'vite'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs-extra'

function extractFileName(path: string, sep = '') {
  const ret = path.split(sep)
  if (ret.length === 2) {
    return ret
  }
  return [null, null]
}

const FILE_CHANGE_TYPE = {
  ADD: 'copy',
  CHANGE: 'copy',
  UNLINK: 'remove',
}

function syncdocServer({ root }) {
  const componentsDir = path.join(root, '../packages/components')
  const playUtilDir = path.join(root, '../play/utils')

  const docsPath = file => path.join(root, 'src/__docs__', file)
  const iconFontPath = file => path.join(root, 'src/utils', file)

  async function handleFile(srcPath, mode) {
    const isJSONFile = /\.json$/.test(srcPath)

    const [, file] = extractFileName(srcPath, isJSONFile ? '/utils/' : '/__docs__/')

    if (file) {
      try {
        await fs[mode](srcPath, isJSONFile ? iconFontPath(file) : docsPath(file))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const watcher = chokidar.watch([
    `${componentsDir}/**/__docs__/*.md`,
    `${playUtilDir}/iconfont.json`,
  ])

  watcher
    .on('add', async path => handleFile(path, FILE_CHANGE_TYPE.ADD))
    .on('change', async path => handleFile(path, FILE_CHANGE_TYPE.CHANGE))
    .on('unlink', async path => handleFile(path, FILE_CHANGE_TYPE.UNLINK))
}

function vitePluginSyncmd(): Plugin {
  return {
    name: 'Syncmd',
    configureServer(server) {
      syncdocServer({ root: server.config.root })
    }
  }
}

export default vitePluginSyncmd

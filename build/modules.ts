import { rollup } from 'rollup'
import vue from 'rollup-plugin-vue'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import css from 'rollup-plugin-css-only'
import glob from 'fast-glob'
import jscc from 'rollup-plugin-jscc'

import { uiRoot, pkgRoot } from './utils/paths'
import { buildConfig } from './utils/build-config'
import { generateExternal, wxpPathAlias, excludeFiles } from './utils'
import type { OutputOptions } from 'rollup'

import repo from '@wxp/wxp-ui/package.json'

console.log('build version: ', repo.version)

function preprocessPlugin() {
  return jscc({
    values: {
      _VERSION: repo.version,
    },
  })
}

export const buildModules = async () => {
  const input = excludeFiles(
    await glob('**/*.{js,ts,vue}', {
      cwd: pkgRoot,
      absolute: true,
      onlyFiles: true,
    })
  )

  const bundle = await rollup({
    input,
    plugins: [
      await wxpPathAlias(),
      css(),
      vue({ target: 'browser' }),
      nodeResolve({
        extensions: ['.mjs', '.js', '.json', '.ts'],
      }),
      preprocessPlugin(),
      commonjs(),
      esbuild({
        sourceMap: true,
        target: 'es2018',
      }),
    ],
    external: await generateExternal({ full: false }),
    treeshake: false,
  })

  const options = Object.entries(buildConfig).map(([module, config]) => ({
    format: config.format,
    dir: config.output.path,
    exports: module === 'cjs' ? 'named' : undefined,
    preserveModules: true,
    preserveModulesRoot: uiRoot,
    entryFileNames: `[name].${config.ext}`,
  }));

  await Promise.all(
    options.map((option) => bundle.write(option as OutputOptions))
  );
}

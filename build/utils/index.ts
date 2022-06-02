// source from https://github.com/element-plus/element-plus/blob/dev/build/utils/process.ts
import { spawn } from 'child_process'
import findWorkspacePackages from '@pnpm/find-workspace-packages'
import { pkgRoot, projectRoot, uiPackage } from './paths'
import { WXP_PREFIX, WXP_PKG } from './constants'

export const run = async (command: string, cwd: string = projectRoot) =>
  new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')

    const app = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    const onProcessExit = () => app.kill('SIGHUP')

    app.on('close', (code) => {
      process.removeListener('exit', onProcessExit)

      if (code === 0) resolve()
      else
        reject(
          new Error(`Command failed. \n Command: ${command} \n Code: ${code}`)
        )
    })

    process.on('exit', onProcessExit)
})


export const withTaskName = <T>(name: string, fn: T) =>
  Object.assign(fn, { displayName: name });


export const excludeFiles = (files: string[]) => {
  const excludes = ['node_modules', 'test', '__tests__', 'mock', 'gulpfile', 'dist']
  return files.filter(
    (path) => !excludes.some((exclude) => path.includes(exclude))
  )
}


export const getDistPackages = async () =>
  (await findWorkspacePackages(projectRoot))
   .map(pkg => ({ name: pkg.manifest.name, dir: pkg.dir }))
   .filter(pkg=> !!pkg.name && !!pkg.dir &&
       pkg.name.startsWith(WXP_PREFIX) 
       && pkg.dir.startsWith(pkgRoot) 
       && !pkg.name.includes('theme')
   )


export async function wxpPathAlias() {
  return {
    name: 'wxp-path-alias-plugin',

    resolveId(id, importer, options) {
      if (!id.startsWith(WXP_PREFIX)) return

      const THEME_CHALK = `${WXP_PREFIX}/theme`
      if (id.startsWith(THEME_CHALK)) {
        return {
          id: id.replaceAll(THEME_CHALK, `${WXP_PKG}/theme`),
          external: 'absolute',
        }
      }

      return this.resolve(id, importer, { skipSelf: true, ...options })
    },
  }
}


export const generateExternal = async (options: { full: boolean }) => {
  return (id: string) => {
    const packages: string[] = ['vue']

    if (!options.full) {
      packages.push('wxp-ui/theme')
      packages.push('@vue', ...getPackageDependencies(uiPackage))
    }

    return [...new Set(packages)].some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`)
    )
  }
}

export const getPackageDependencies = (pkgPath: string): string[] => {
  const manifest = getPackageManifest(pkgPath)
  const { dependencies, peerDependencies } = manifest
  // return Object.keys(dependencies ?? {})
  return Object.keys(peerDependencies ?? {})
}

export const getPackageManifest = (pkgPath: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(pkgPath)
}

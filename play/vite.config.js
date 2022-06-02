import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver, } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'

const compFolder = '@wxp-ui/components'

function kebabCase(key) {
  const result = key.replace(/([A-Z])/g, ' $1').trim()
  return result.split(' ').join('-').toLowerCase()
}

function pathResolve(dir) {
  return path.resolve(process.cwd(), '.', dir)
}

export default defineConfig({
  resolve: {
    alias: {
      '@': pathResolve('./'),
    },
  },
  server: {
    port: 8081,
  },

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },

  plugins: [ 
    vue(),

    Components({
      dts: false,
      resolvers: [
        AntDesignVueResolver({
          importStyle: 'less',
        }),

        (name) => {
          if (name.startsWith('M')) {
            // MButton => button
            const dirName = kebabCase(name.slice(1))

            return { 
              importName: name, 
              path: compFolder,
              sideEffects: `${compFolder}/${dirName}/style/index`,
            }
          } 
        }
      ],
    }),

    viteMockServe({
      ignore: /^\_/,
      mockPath: 'mock',
      injectCode: `
        import { setupProdMockServer } from '../mock/_createServer';

        setupProdMockServer();
        `,
    })
  ],
})

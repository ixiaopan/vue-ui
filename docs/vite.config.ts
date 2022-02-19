import { createPlugin, vueDocFiles } from 'vite-plugin-vuedoc'
import vue from '@vitejs/plugin-vue'
import markdownItContainer from 'markdown-it-container'
import vitePluginSyncmd from './scripts/vitePluginSyncmd'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver, } from 'unplugin-vue-components/resolvers'

export default {
  server: {
    port: 8080,
  },

  optimizeDeps: {
    exclude: ['wxp-ui'],
  },

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    },
  },

  plugins: [
    vitePluginSyncmd(),
    
    createPlugin({
      markdownIt: {
        plugins: [],
      },

      highlight: {
        theme: 'one-dark',
      },
    }),
    
    vue({
      include: [...vueDocFiles],
    }),    

    Components({
      dts: false,
      resolvers: [
        AntDesignVueResolver(),
      ]
    }),
  ],
}

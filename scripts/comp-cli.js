const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs-extra')


function kebabCase(key) {
  const result = key.replace(/([A-Z])/g, ' $1').trim()
  return result.split(' ').join('-').toLowerCase()
}
function cameCase(res) {
  return res.split('-').map(k => k[0].toUpperCase() + k.slice(1)).join('')
}
function firstCameCase(k) {
  return k[0].toLowerCase() + k.slice(1)
}


const questions = [
  {
    type: 'input',
    name: 'compName',
    message: 'Pls input your comp name',
    default: 'demo',
  }
]

inquirer
  .prompt(questions)
  .then((ans) => {
    const compName = kebabCase(ans.compName)
    createComp(compName, cameCase(compName), firstCameCase(cameCase(compName)))
  })
  .catch(e => console.log(e))


function createComp(compName, camelCompName, firstCamelCompName) {
  const prefix = 'M'

  const template = {
    __docs__: {
      type: 'create',
      folder: '__docs__',
      name: `${compName}.md`,
      content: `---
title: ${camelCompName}
---

# ${camelCompName}

## Basic

\`\`\`vue demo

<template>
  <m-${compName}></m-${compName}>
</template>

\`\`\`


# API

| Props       | Type        |  Desc       | Default |
| ----------- | ----------- | ----------- | ------  |
`,
    },
    __tests_: {
      type: 'create',
      folder: '__tests__',
      name: `${compName}.ts`,
      content: '',
    },
    vue: {
      type: 'create',
      folder: 'src',
      name: `${compName}.vue`,
      content: `<template>
  <div class="wxp-${compName}">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
// 引入 wxp 组件, replace 'wxp'
// import ${prefix}<wxp> from '@wxp-ui/components/<wxp>'

// 引入 antd 组件, replace 'Ant'
// import { <Ant> } from 'ant-design-vue'
import { ${firstCamelCompName}Props } from './${compName}'

export default defineComponent({
  name: '${prefix}${camelCompName}',
  props: ${firstCamelCompName}Props,
  components: {
    // [<Ant>.name]: <Ant>,
    // [${prefix}<wxp>.name]: ${prefix}<wxp>
  },
  setup(props, { emit }) {

  }
})
</script>
`,
    },
    ts: {
      type: 'create',
      folder: 'src',
      name: `${compName}.ts`,
      content: `import type { ExtractPropTypes } from "vue" 

export const ${firstCamelCompName}Props = {
}

export type ${camelCompName}Props = ExtractPropTypes<typeof ${firstCamelCompName}Props>
`,
    },
    css: {
      type: 'create',
      folder: 'style',
      name: 'css.ts',
      content: `import '@wxp-ui/theme/base.css'
import '@wxp-ui/theme/m-${compName}.css'
`,
    },
    less: {
      type: 'create',
      folder: 'style',
      name: 'index.ts',
      content: `import '@wxp-ui/theme/src/base.less'
import '@wxp-ui/theme/src/${compName}.less'
`,
    },
    theme: {
      type: 'create',
      folder: '../../theme/src',
      name: `${compName}.less`,
      content: `@import './mixins/var.less';

.wxp-${compName} {}`,
    },
    index: {
      type: 'create',
      folder: '',
      name: 'index.ts',
      content: `import { withInstall } from "@wxp-ui/utils/with-install"
import ${camelCompName} from './src/${compName}.vue'

const ${prefix}${camelCompName} = withInstall(${camelCompName})

export {
  ${prefix}${camelCompName}
}

export default ${prefix}${camelCompName}
`,
    },
    demo: {
      type: 'create',
      folder: '../../../play/components',
      name: `${camelCompName}Demo.vue`,
      content: `<template>
<div class="${compName}-demo">
  <h2>${camelCompName} Test</h2>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

</script>

<style lang="less">
</style>  
`,
    },

    themeEntry: {
      type: 'add',
      folder: '../../theme/src',
      name: 'index.less',
      content: [`@import './${compName}.less';`]
    },
    entry: {
      type: 'add',
      folder: '../',
      name: 'index.ts',
      content: [`export * from './${compName}'`],
    },
    docs: {
      type: 'add',
      folder: '../../../docs/src',
      name: 'menus.ts',
      content: [
        `import ${camelCompName} from './__docs__/${compName}.md'`,
        `{ name: '${camelCompName}', component: ${camelCompName} },`
      ],
    },
    play: {
      type: 'add',
      folder: '../../../play',
      name: 'app.vue',
      content: [
        `<${camelCompName}Demo />`,
        `import ${camelCompName}Demo from './components/${camelCompName}Demo.vue'`,
      ],
    }
  }

  const compDir = path.resolve(__dirname, '..', 'packages', 'components', compName)

  return Promise.all(Object.values(template).map((t) => {
    if (!t.type || (!t.folder && !t.name)) {
      return Promise.resolve()
    }

    const file = path.resolve(compDir, t.folder, t.name)

    if (t.type == 'create') {
      // create folder only
      if (!t.name) {
        return fs.ensureDir(path.resolve(compDir, t.folder))
      }

      // create file
      return fs.ensureFile(file).then(() => fs.outputFile(file, t.content))
    }

    else if (t.type == 'add') {
      return fs.readFile(file, 'utf8').then(data => {
        let idx = 0
        const newContent = data.replace(/((?:\/\/|<!--)\s*<SLOT>)/g, (m, p1) => t.content[idx++] + '\n' + p1)
        return fs.outputFile(file, newContent)
      })
    }
  }))
  .then(() => { console.log('Done') })
  .catch(e => console.error(e))
}

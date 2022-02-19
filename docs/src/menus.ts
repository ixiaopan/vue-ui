import { Component } from 'vue'
import Button from './__docs__/button.md'
// <SLOT>, do not remove this comment!

type MenuItem = {
  name: string,
  component: Component
}

type MenuType = {
  title: string,
  items: MenuItem[]
}

export default [
  {
    title: 'Basic',
    items: [
      { name: 'Button', component: Button },
    ],
  },
  {
    title: 'General',
    items: [
      // <SLOT>, do not remove this comment!
    ],
  },
  {
    title: '业务组件',
    items: [
    ],
  },
] as MenuType[]

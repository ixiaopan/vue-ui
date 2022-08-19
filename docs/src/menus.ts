import { Component } from 'vue'
import Button from './__docs__/button.md'
import Cascader from './__docs__/cascader.md'
import Tag from './__docs__/tag.md'
import Spin from './__docs__/spin.md'
import Icon from './__docs__/icon.md'
import Scrollable from './__docs__/scrollable.md'
import Message from './__docs__/message.md'
import CascaderMultiple from './__docs__/cascader-multiple.md'
import PhoneTag from './__docs__/phone-tag.md'
import Tab from './__docs__/tab.md'
import VideoFrame from './__docs__/video-frame.md'
import Text from './__docs__/text.md'
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
      { name: 'Cascader', component: Cascader },
{ name: 'Tag', component: Tag },
{ name: 'Spin', component: Spin },
{ name: 'Icon', component: Icon },
{ name: 'Scrollable', component: Scrollable },
{ name: 'Message', component: Message },
{ name: 'CascaderMultiple', component: CascaderMultiple },
{ name: 'PhoneTag', component: PhoneTag },
{ name: 'Tab', component: Tab },
{ name: 'VideoFrame', component: VideoFrame },
{ name: 'Text', component: Text },
// <SLOT>, do not remove this comment!
    ],
  },
  {
    title: '业务组件',
    items: [
    ],
  },
] as MenuType[]

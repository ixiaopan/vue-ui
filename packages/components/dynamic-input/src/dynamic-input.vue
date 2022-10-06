<template>
  <div class="wxp-dynamic-input">
    <div v-if="placement == 'top'" class="wxp-dynamic-item-action">
      <a-tooltip>
        <template v-if="addDisabled" #title>{{ disabledHint }}</template>

        <span>
          <m-button
            type="link-text"
            size="small"
            iconType="wxp-add"
            :disabled="addDisabled"
            rawType="button"
            @click="onAdd"
          >
            {{ addText }}
          </m-button>
        </span>
      </a-tooltip>

      <m-button v-if="hasClear && list?.length" type="text" size="small" iconType="wxp-del" @click="onClear">
        {{ clearText }}
      </m-button>
    </div>

    <div
      v-for="(item, idx) in list"
      :key="item.id"
      :class="['wxp-dynamic-item-input', idx == 0 ? 'wxp-dynamic-item-input-first' : '']"
    >
      <a-input
        v-model:value="item.text"
        :placeholder="placeholder + (idx + 1)"
        @blur="onChange"
        class="wxp-dynamic-short-input"
      />
      <span
        v-if="!$slots.del"
        size="small"
        type="wxp-del"
        @click="onDel(item.id)"
      />
      <slot name="del" v-else :id="item.id" />
    </div>

    <div v-if="placement == 'bottom'" class="wxp-dynamic-item-action">
      <a-tooltip>
        <template v-if="addDisabled" #title>{{ disabledHint }}</template>

        <span>
          <m-button
            type="link-text"
            size="small"
            iconType="wxp-add"
            rawType="button"
            :disabled="addDisabled"
            @click="onAdd"
          >
            {{ addText }}
          </m-button>
        </span>
      </a-tooltip>

      <m-button
        v-if="hasClear"
        type="text"
        size="small"
        iconType="wxp-del"
        @click="onClear"
      >
        {{ clearText }}
      </m-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, reactive, watch, computed } from "vue";
import { gid } from "@wxp-ui/utils";

import MButton from "@wxp-ui/components/button";

import { Input, Tooltip } from "ant-design-vue";
import "ant-design-vue/es/input/style";
import "ant-design-vue/es/tooltip/style";

import { dynamicInputProps } from "./dynamic-input";

function createList(textList) {
  return textList.map((t) => ({
    text: t,
    id: gid(),
  }));
}

export default defineComponent({
  name: "MDynamicInput",
  props: dynamicInputProps,
  components: {
    [Input.name]: Input,
    [Tooltip.name]: Tooltip,
    [MButton.name]: MButton,
  },
  emits: ["change"],
  setup(props, { emit }) {
    const state = reactive({
      list: createList(props.defaultList || []),
    })

    if (props.listenDefault) {
      watch(() => props.defaultList, (nv, ov) => {
        if (nv != ov) {
            state.list = createList(nv || [])
        }
      })
    }

    const addDisabled = computed(() => state.list.length >= props.maxCount);

    function onAdd() {
      if (addDisabled.value) return;

      state.list = state.list.concat({
        text: "",
        id: gid(),
      });
    }

    function onClear() {
      state.list = []
      onChange()
    }

    function onDel(itemId) {
      const idx = state.list.findIndex((o) => o.id == itemId);

      if (idx > -1) {
        state.list.splice(idx, 1);
      }
      onChange()
    }

    function onChange() {
      emit("change", state.list.map((o) => o.text));
    }

    return {
      addDisabled,
      onChange,
      onAdd,
      onClear,
      onDel,
      ...toRefs(state),
    };
  },
});
</script>

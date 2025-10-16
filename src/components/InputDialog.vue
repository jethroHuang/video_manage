<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="cancel">
    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90%]">
      <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
      <input
        v-model="inputValue"
        ref="inputRef"
        @keyup.enter="confirm"
        @keyup.esc="cancel"
        :placeholder="placeholder"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div class="flex justify-end gap-2 mt-6">
        <button
          @click="cancel"
          class="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          取消
        </button>
        <button
          @click="confirm"
          class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const visible = ref(false)
const title = ref('')
const placeholder = ref('')
const inputValue = ref('')
const inputRef = ref<HTMLInputElement>()
let resolvePromise: ((value: string | null) => void) | null = null

async function show(options: { title: string; placeholder?: string; defaultValue?: string }): Promise<string | null> {
  title.value = options.title
  placeholder.value = options.placeholder || ''
  inputValue.value = options.defaultValue || ''
  visible.value = true
  
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
  
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function confirm() {
  const value = inputValue.value.trim()
  visible.value = false
  resolvePromise?.(value || null)
  resolvePromise = null
}

function cancel() {
  visible.value = false
  resolvePromise?.(null)
  resolvePromise = null
}

defineExpose({ show })
</script>


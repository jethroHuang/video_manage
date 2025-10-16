<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-hidden">
      <!-- 标题栏 -->
      <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">设置</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 内容区 -->
      <div class="p-6 space-y-6">
        <!-- 缓存管理 -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">缓存管理</h3>
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <p class="text-sm text-gray-600">清除视频缩略图缓存</p>
              <p class="text-xs text-gray-400 mt-1">缓存位置：系统临时目录</p>
            </div>
            <button 
              @click="clearCache" 
              :disabled="clearing"
              class="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ clearing ? '清除中...' : '清除缓存' }}
            </button>
          </div>
          <div v-if="message" :class="['text-sm p-3 rounded-md', messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700']">
            {{ message }}
          </div>
        </div>

        <!-- 应用信息 -->
        <div class="space-y-3 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700">应用信息</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <p>版本：0.1.0</p>
            <p>基于：Tauri + Vue3 + TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const isOpen = ref(false)
const clearing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

function open() {
  isOpen.value = true
  message.value = ''
}

function close() {
  isOpen.value = false
  message.value = ''
}

async function clearCache() {
  clearing.value = true
  message.value = ''
  
  try {
    const result = await invoke<string>('clear_thumbnail_cache')
    message.value = result
    messageType.value = 'success'
  } catch (error) {
    message.value = `清除失败：${error}`
    messageType.value = 'error'
  } finally {
    clearing.value = false
  }
}

defineExpose({
  open,
  close
})
</script>


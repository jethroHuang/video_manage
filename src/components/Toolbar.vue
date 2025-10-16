<template>
  <div class="border-b border-gray-200 bg-white px-3 py-2 flex items-center gap-2">
    <button :disabled="!canGoBack" @click="goBack"
            :class="['px-3 py-1.5 text-sm rounded-md border transition-colors flex items-center gap-1', canGoBack ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed']">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
      返回
    </button>
    <button @click="newFolder" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors">
      新建文件夹
    </button>
    <button :disabled="!selectedItem" @click="deleteSelected"
            :class="['px-3 py-1.5 text-sm rounded-md border transition-colors', selectedItem ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed']">
      删除
    </button>
    <button :disabled="!canPasteHere" @click="paste"
            :class="['px-3 py-1.5 text-sm rounded-md border transition-colors', canPasteHere ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed']">
      粘贴
    </button>
    <button :disabled="!browser.currentDirPath" @click="revealInSystem"
            :class="['px-3 py-1.5 text-sm rounded-md border transition-colors flex items-center gap-1.5', browser.currentDirPath ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed']">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
      </svg>
      在系统中打开
    </button>
    <!-- 右侧设置按钮 -->
    <div class="flex-1"></div>
    <button @click="openSettings" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors flex items-center gap-1.5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      设置
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBrowserStore } from '@/stores/browser'
import { message } from '@tauri-apps/plugin-dialog'
import { openPath } from '@tauri-apps/plugin-opener'
import type InputDialog from './InputDialog.vue'

const props = defineProps<{
  inputDialog?: InstanceType<typeof InputDialog>
}>()

const browser = useBrowserStore()
const emit = defineEmits<{
  openSettings: []
}>()

const selectedItem = computed(() => browser.selectedItem)
const clipboard = computed(() => browser.clipboard)
const canGoBack = computed(() => browser.canGoBack)

// 追踪是否可以粘贴
const canPasteHere = ref(false)

// 监听剪贴板和当前目录变化，更新粘贴状态
watch([clipboard, () => browser.currentDirPath], async () => {
  canPasteHere.value = await browser.canPaste()
}, { immediate: true })

async function goBack() {
  await browser.goBack()
}

async function newFolder() {
  // 检查是否有当前目录
  if (!browser.currentDirPath) {
    await message('请先打开一个项目', { title: '提示', kind: 'warning' })
    return
  }
  
  // 使用自定义对话框输入文件夹名称
  if (!props.inputDialog) {
    console.error('InputDialog 未传入')
    return
  }
  
  const folderName = await props.inputDialog.show({
    title: '新建文件夹',
    placeholder: '请输入文件夹名称'
  })
  
  if (!folderName) {
    return
  }
  
  try {
    await browser.newFolder(folderName)
    browser.refresh()
  } catch (error) {
    console.error('创建文件夹失败:', error)
    await message(`创建文件夹失败: ${error}`, { title: '错误', kind: 'error' })
  }
}

async function deleteSelected() {
  await browser.deleteSelected()
}

async function paste() {
  await browser.pasteClipboard()
}

function openSettings() {
  emit('openSettings')
}

// 在系统中打开当前目录
async function revealInSystem() {
  if (!browser.currentDirPath) {
    await message('请先打开一个项目', { title: '提示', kind: 'warning' })
    return
  }
  
  try {
    await openPath(browser.currentDirPath)
  } catch (error) {
    console.error('无法在系统中打开:', error)
    await message(`无法在系统中打开: ${error}`, { title: '错误', kind: 'error' })
  }
}
</script>



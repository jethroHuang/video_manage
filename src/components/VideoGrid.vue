<template>
  <div class="flex-1 h-full flex flex-col bg-gray-50 overflow-hidden">
    <!-- 未打开项目时显示提示 -->
    <div v-if="!browser.currentProjectPath" class="flex-1 flex items-center justify-center">
      <div class="text-center px-6">
        <div class="mb-4">
          <svg class="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-medium text-gray-900 mb-3">请打开项目</h3>
        <div
          class="max-w-md mx-auto space-y-2 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p class="font-medium text-amber-800">⚠️ 重要提示</p>
          <p class="text-left">您对项目中文件的修改及删除都将同步到磁盘中，请谨慎操作。</p>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 overflow-auto p-3">
      <!-- 缩略图生成进度条 -->
      <div v-if="thumbnailProgress.isGenerating" class="mb-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">正在生成缩略图...</span>
          <span class="text-sm font-medium text-blue-600">
            {{ thumbnailProgress.completed }} / {{ thumbnailProgress.total }}
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div class="bg-blue-500 h-full transition-all duration-300 ease-out"
            :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- 有文件时显示网格 -->
      <div v-if="entries.length > 0"
        class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 auto-rows-min flex-1"
        @click.self="onBlankClick" @contextmenu.self.prevent="openBlankMenu($event)">
        <div v-for="item in entries" :key="item.path" :draggable="item.isFile" @dragstart="onDragStart($event, item)"
          @dragover.prevent="onDragOver($event, item)" @drop.prevent="onDrop($event, item)"
          @contextmenu.prevent="openItemMenu($event, item)" @dblclick="onOpen(item)" :class="cardClass(item)"
          @click.stop="onClick($event, item)">
          <div class="w-full aspect-video bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
            <img v-if="item.isDir"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%239ca3af'%3E%3Cpath d='M8 12h48v40H8z'/%3E%3Cpath d='M8 12l8-8h16l8 8'/%3E%3C/svg%3E"
              alt="folder" :class="['w-12 h-12 opacity-50', isCutItem(item) ? 'grayscale' : '']" />
            <img v-else :src="thumbOf(item.path)" :alt="item.name"
              :class="['w-full h-full object-cover', isCutItem(item) ? 'grayscale' : '']" />
          </div>
          <div class="w-full text-center text-sm px-1">
            <input v-if="editingItem === item.path" v-model="editingName" @blur="finishEdit(item)"
              @keyup.enter="finishEdit(item)" @keyup.esc="cancelEdit" @click.stop ref="editInput"
              class="w-full text-center border border-blue-500 rounded px-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
              :class="nameClass(item)" />
            <div v-else @click.stop="startEdit(item)" class="w-full truncate cursor-text" :class="nameClass(item)"
              :title="item.name">
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- 无文件时显示占位提示 -->
      <div v-else class="flex-1 flex items-center justify-center" @contextmenu.prevent="openBlankMenu($event)">
        <div class="text-center">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无视频文件</h3>
          <p class="text-gray-500 mb-4">当前文件夹中没有视频文件</p>
          <div class="space-y-2 text-sm text-gray-600">
            <p>• 支持 MP4、MOV、WebM、MKV、AVI 格式</p>
            <p>• 双击文件夹可以进入子目录</p>
            <p>• 右键可以创建新文件夹</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部路径栏 -->
    <div v-if="browser.currentDirPath" class="border-t border-gray-200 bg-white px-3 py-2 shrink-0">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="truncate" :title="browser.currentDirPath">{{ browser.currentDirPath }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'
import { useBrowserStore } from '@/stores/browser'
import { listEntries, joinPath } from '@/utils/fs'
import { useContextMenu } from '@/components/context'
import { getThumbnail, thumbnailProgress, resetProgress, incrementTotal } from '@/utils/thumbnail'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { openPath } from '@tauri-apps/plugin-opener'
import type InputDialog from './InputDialog.vue'

const props = defineProps<{
  inputDialog?: InstanceType<typeof InputDialog>
}>()

const browser = useBrowserStore()
const { showMenu } = useContextMenu()

// 在系统中打开文件或文件夹
async function revealInSystem(path: string) {
  try {
    await openPath(path)
  } catch (error) {
    console.error('无法在系统中打开:', error)
    await message(`无法在系统中打开: ${error}`, { title: '错误', kind: 'error' })
  }
}

type Entry = { path: string; name: string; isDir: boolean; isFile: boolean }
const entries = ref<Entry[]>([])
const editingItem = ref<string | null>(null)
const editingName = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// 键盘快捷键处理
async function handleKeyDown(e: KeyboardEvent) {
  // macOS 使用 Cmd 键，Windows/Linux 使用 Ctrl 键
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modifier = isMac ? e.metaKey : e.ctrlKey

  if (!modifier) return

  // 如果正在编辑文件名，不处理快捷键
  if (editingItem.value) return

  // Ctrl/Cmd + C: 复制
  if (e.key.toLowerCase() === 'c' && browser.selectedItem) {
    e.preventDefault()
    browser.copy(browser.selectedItem)
  }

  // Ctrl/Cmd + X: 剪切
  if (e.key.toLowerCase() === 'x' && browser.selectedItem) {
    e.preventDefault()
    browser.cut(browser.selectedItem)
  }

  // Ctrl/Cmd + V: 粘贴
  if (e.key.toLowerCase() === 'v' && browser.clipboard) {
    e.preventDefault()
    const canPasteHere = await browser.canPaste()
    if (canPasteHere) {
      await browser.pasteClipboard()
      await load()
    }
  }
}

async function load() {
  const dir = browser.currentDirPath
  if (!dir) return
  const raw = await listEntries(dir)
  const allEntries = await Promise.all(raw.map(async (e: any) => {
    const fullPath = await joinPath(dir, e.name)
    // Tauri readDir 返回的是 isDirectory 字段
    const isDirectory = e.isDirectory === true
    return {
      path: fullPath,
      name: e.name,
      isDir: isDirectory,
      isFile: !isDirectory,
    }
  }))
  // 只保留文件夹和视频文件
  const filtered = allEntries.filter(e => e.isDir || isVideo(e.name))

  // 排序：文件夹在前，文件在后，同类按名称排序
  entries.value = filtered.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1
    if (!a.isDir && b.isDir) return 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  // 智能清理缓存：只保留当前目录中存在的文件的缓存
  const currentPaths = new Set(filtered.map(e => e.path))
  const oldCache = new Map(thumbsCache.value)
  thumbsCache.value.clear()
  // 恢复仍然存在的文件的缓存
  for (const [path, thumb] of oldCache) {
    if (currentPaths.has(path)) {
      thumbsCache.value.set(path, thumb)
    }
  }

  // 重置进度并统计需要生成缩略图的视频文件数（只计算没有缓存的）
  resetProgress()
  const videoFiles = entries.value.filter(e => e.isFile && isVideo(e.name))
  const uncachedVideos = videoFiles.filter(e => !thumbsCache.value.has(e.path))
  if (uncachedVideos.length > 0) {
    thumbnailProgress.value.total = uncachedVideos.length
  }
}

onMounted(() => {
  load()
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => browser.currentDirPath, load)
watch(() => browser.refreshTrigger, load)

async function openBlankMenu(e: MouseEvent): Promise<void> {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdKey = isMac ? '⌘' : 'Ctrl'

  // 检查是否可以粘贴
  const canPasteHere = await browser.canPaste()

  showMenu({
    x: e.clientX,
    y: e.clientY,
    items: [
      {
        label: '新建文件夹',
        action: async () => {
          if (!props.inputDialog) return
          const name = await props.inputDialog.show({
            title: '新建文件夹',
            placeholder: '请输入文件夹名称'
          })
          if (!name) return
          await browser.newFolder(name)
          await load()
        }
      },
      {
        label: '在系统中打开',
        action: () => revealInSystem(browser.currentDirPath || '')
      },
      { label: `粘贴 (${cmdKey}+V)`, disabled: !canPasteHere, action: async () => { await browser.pasteClipboard(); await load() } }
    ]
  })
}

function openItemMenu(e: MouseEvent, item: Entry) {
  // 如果右键的项未被选中，则将其设为唯一选中
  const alreadySelected = typeof (browser as any).isSelected === 'function' ? (browser as any).isSelected(item.path) : (browser.selectedItem === item.path)
  if (!alreadySelected) {
    browser.selectItem(item.path)
    if (typeof (browser as any).setAnchor === 'function') {
      (browser as any).setAnchor(item.path)
    }
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdKey = isMac ? '⌘' : 'Ctrl'
  
  // 判断是否多选
  const selectedCount = browser.selectedItems?.length || 0
  const isMultiSelect = selectedCount > 1

  showMenu({
    x: e.clientX,
    y: e.clientY,
    items: [
      {
        label: '重命名',
        action: () => startEdit(item),
        disabled: isMultiSelect // 多选时禁用重命名
      },
      { 
        label: isMultiSelect ? `复制 ${selectedCount} 项 (${cmdKey}+C)` : `复制 (${cmdKey}+C)`, 
        action: () => browser.copy(item.path) 
      },
      { 
        label: isMultiSelect ? `剪切 ${selectedCount} 项 (${cmdKey}+X)` : `剪切 (${cmdKey}+X)`, 
        action: () => browser.cut(item.path) 
      },
      {
        label: '在系统中打开',
        action: () => revealInSystem(item.path)
      },
      {
        label: isMultiSelect ? `删除 ${selectedCount} 项` : '删除',
        danger: true,
        action: async () => {
          let confirmText = ''
          if (isMultiSelect) {
            confirmText = `确定要删除选中的 ${selectedCount} 项吗？\n\n⚠️ 所有文件和文件夹都将被永久删除！`
          } else {
            confirmText = item.isDir
              ? `确定要删除文件夹 "${item.name}" 吗？\n\n⚠️ 文件夹及其所有内容都将被永久删除！`
              : `确定要删除 "${item.name}" 吗？`
          }
          
          const confirmed = await ask(confirmText, {
            title: '确认删除',
            kind: 'warning'
          })
          if (!confirmed) return
          
          try {
            if (isMultiSelect) {
              // 批量删除
              for (const path of browser.selectedItems) {
                const info = await import('@tauri-apps/plugin-fs').then(m => m.stat(path))
                await browser.remove(path, info.isDirectory)
              }
            } else {
              await browser.remove(item.path, item.isDir)
            }
            await load()
          } catch (error) {
            console.error('删除失败:', error)
            await message(`删除失败: ${error}`, { title: '错误', kind: 'error' })
          }
        }
      },
    ]
  })
}

// 开始编辑文件名（使用内联编辑）
async function startEdit(item: Entry) {
  editingItem.value = item.path
  editingName.value = item.name
  await nextTick()
  // 聚焦输入框并选中文件名（不含扩展名）
  const inputs = document.querySelectorAll('input')
  const input = Array.from(inputs).find(inp => inp !== editInput.value) as HTMLInputElement
  if (input) {
    input.focus()
    const lastDot = item.name.lastIndexOf('.')
    if (lastDot > 0) {
      input.setSelectionRange(0, lastDot)
    } else {
      input.select()
    }
  }
}

// 完成编辑
async function finishEdit(item: Entry) {
  if (!editingName.value.trim() || editingName.value === item.name) {
    cancelEdit()
    return
  }

  const newName = editingName.value.trim()
  const oldPath = item.path

  // 检查是否存在同名文件或文件夹
  const nameExists = entries.value.some(e => e.path !== oldPath && e.name === newName)
  if (nameExists) {
    await message(
      `已存在同名的${item.isDir ? '文件夹' : '文件'} "${newName}"，请使用其他名称。`,
      { title: '重命名失败', kind: 'warning' }
    )
    // 不调用 cancelEdit()，让用户可以继续修改
    // 重新聚焦输入框
    await nextTick()
    const inputs = document.querySelectorAll('input')
    const input = Array.from(inputs).find(inp => inp !== editInput.value) as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
    return
  }

  try {
    // 如果是视频文件，保存旧的缩略图缓存
    const oldThumb = thumbsCache.value.get(oldPath)

    // 执行重命名
    await browser.rename(oldPath, newName)

    // 计算新路径并迁移缓存
    if (oldThumb && isVideo(newName)) {
      const newPath = await joinPath(browser.currentDirPath, newName)
      thumbsCache.value.delete(oldPath)
      thumbsCache.value.set(newPath, oldThumb)
    }

    cancelEdit()
    await load()
  } catch (error) {
    console.error('重命名失败:', error)
    await message(`重命名失败: ${error}`, { title: '错误', kind: 'error' })
    cancelEdit()
  }
}

// 取消编辑
function cancelEdit() {
  editingItem.value = null
  editingName.value = ''
}

function onOpen(item: Entry) {
  if (item.isDir) browser.enterDir(item.path)
}

function onClick(e: MouseEvent, item: Entry) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const isCtrlLike = isMac ? e.metaKey : e.ctrlKey
  const isShift = e.shiftKey

  const currentIdx = entries.value.findIndex(it => it.path === item.path)
  if (currentIdx < 0) return

  if (isShift) {
    const anchorPath = (browser as any).selectedAnchor || browser.selectedItem || item.path
    const anchorIdx = entries.value.findIndex(it => it.path === anchorPath)
    const start = Math.min(anchorIdx < 0 ? currentIdx : anchorIdx, currentIdx)
    const end = Math.max(anchorIdx < 0 ? currentIdx : anchorIdx, currentIdx)
    const range = entries.value.slice(start, end + 1).map(it => it.path)
    if (typeof (browser as any).setSelection === 'function') {
      (browser as any).setSelection(range, item.path)
    } else {
      browser.selectItem(item.path)
    }
    if (!(browser as any).selectedAnchor && typeof (browser as any).setAnchor === 'function') {
      (browser as any).setAnchor(anchorPath)
    }
  } else if (isCtrlLike) {
    if (typeof (browser as any).toggleSelectItem === 'function') {
      (browser as any).toggleSelectItem(item.path)
    } else {
      // 退化为单选
      browser.selectItem(item.path)
    }
    if (!(browser as any).selectedAnchor && typeof (browser as any).setAnchor === 'function') {
      (browser as any).setAnchor(item.path)
    }
  } else {
    browser.selectItem(item.path)
    if (typeof (browser as any).setAnchor === 'function') {
      (browser as any).setAnchor(item.path)
    }
  }

  // 更新右侧播放器的当前视频为最后点击项（若为视频）
  if (item.isFile && isVideo(item.name)) {
    browser.currentVideoPath = item.path
  }
}

function isVideo(name: string) {
  return /\.(mp4|mov|webm|mkv|avi)$/i.test(name)
}

function onDragStart(ev: DragEvent, item: Entry) {
  ev.dataTransfer?.setData('text/plain', item.path)
}

function onDragOver(_ev: DragEvent, _item: Entry) {
  // highlight if needed
}

async function onDrop(ev: DragEvent, item: Entry) {
  const src = ev.dataTransfer?.getData('text/plain')
  if (!src || !item.isDir) return
  const dest = await joinPath(item.path, src.split(/[\\/]/).pop() || '')
  await browser.move(src, dest)
  await load()
}

const thumbsCache = ref(new Map<string, string>())

// 占位符图片（灰色视频图标）
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%239ca3af'%3E%3Crect x='8' y='16' width='48' height='32' rx='4' fill='none' stroke='%239ca3af' stroke-width='2'/%3E%3Cpath d='M28 26l12 8-12 8z' fill='%239ca3af'/%3E%3C/svg%3E"

function thumbOf(path: string): string {
  const cached = thumbsCache.value.get(path)
  if (cached) return cached

  // 标记开始生成
  if (!thumbnailProgress.value.isGenerating && thumbnailProgress.value.total > 0) {
    thumbnailProgress.value.isGenerating = true
  }

  // 异步加载缩略图
  getThumbnail(path).then((url: string) => {
    thumbsCache.value.set(path, url)
    // 触发响应式更新
    thumbsCache.value = new Map(thumbsCache.value)
  }).catch((err) => {
    console.error('Failed to generate thumbnail for', path, err)
  })

  return PLACEHOLDER
}

// 计算进度百分比
const progressPercent = computed(() => {
  if (thumbnailProgress.value.total === 0) return 0
  return Math.round((thumbnailProgress.value.completed / thumbnailProgress.value.total) * 100)
})

function onBlankClick() {
  browser.clearSelection()
}

// 判断项是否被剪切
function isCutItem(item: Entry): boolean {
  if (!browser.clipboard) return false
  if (browser.clipboard.type !== 'cut') return false
  const isCut = browser.clipboard.paths.includes(item.path)
  if (isCut) {
    console.log('检测到剪切项:', item.path, 'clipboard:', browser.clipboard)
  }
  return isCut
}

function cardClass(item: Entry) {
  const isActive = typeof (browser as any).isSelected === 'function' ? (browser as any).isSelected(item.path) : (browser.selectedItem === item.path)
  const isCut = isCutItem(item)

  if (isCut) {
    // 被剪切的项：灰色背景 + 半透明效果
    return [
      'p-2 bg-gray-200 border rounded-lg transition-all cursor-pointer select-none flex flex-col items-center gap-2 opacity-60',
      isActive ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-gray-300 hover:shadow-md'
    ]
  }

  return [
    'p-2 bg-white border rounded-lg transition-shadow cursor-pointer select-none flex flex-col items-center gap-2',
    isActive ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-gray-200 hover:shadow-md'
  ]
}

function nameClass(item: Entry) {
  const isActive = typeof (browser as any).isSelected === 'function' ? (browser as any).isSelected(item.path) : (browser.selectedItem === item.path)
  const isCut = isCutItem(item)

  if (isCut) {
    // 被剪切的项文字也变灰
    return isActive ? 'text-blue-500 font-medium' : 'text-gray-500'
  }

  return isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
}
</script>

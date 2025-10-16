<template>
  <div class="h-full flex flex-col">
    <div class="px-3 py-3 border-b border-gray-200 font-semibold text-gray-800">项目</div>
    
    <!-- 无项目时显示居中提示 -->
    <div v-if="projects.length === 0" class="flex-1 flex items-center justify-center p-4">
      <div class="text-center">
        <div class="mb-3">
          <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </div>
        <p class="text-sm text-gray-600 mb-4">暂无项目</p>
        <p class="text-xs text-gray-500">点击下方按钮导入项目</p>
      </div>
    </div>
    
    <!-- 有项目时显示列表 -->
    <ul v-else class="flex-1 overflow-auto p-2 space-y-1">
      <li v-for="p in projects" :key="p"
          :class="['px-3 py-2 rounded-lg cursor-pointer transition-colors', p === currentProjectPath ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700']"
          @click="openProject(p)"
          @contextmenu.prevent="openProjectMenu($event, p)">
        <span class="block truncate" :title="p">{{ names[p] ?? p }}</span>
      </li>
    </ul>
    
    <button @click="importProject" class="m-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
      + 导入项目
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useBrowserStore } from '@/stores/browser'
import { open } from '@tauri-apps/plugin-dialog'
import { basename as _basename } from '@tauri-apps/api/path'
import { message } from '@tauri-apps/plugin-dialog'
import { useContextMenu } from '@/components/context'

const projectsStore = useProjectsStore()
const browserStore = useBrowserStore()
const { showMenu } = useContextMenu()

const projects = computed(() => projectsStore.projects)
const currentProjectPath = computed(() => browserStore.currentProjectPath)

const names = reactive<Record<string, string>>({})

async function loadNames() {
  for (const p of projects.value) {
    if (!names[p]) {
      names[p] = await _basename(p)
    }
  }
}

onMounted(loadNames)
watch(projects, loadNames)

async function importProject() {
  const selected = await open({ directory: true, multiple: false })
  if (!selected || Array.isArray(selected)) return
  await projectsStore.addProject(selected)
  browserStore.openProject(selected)
}

function openProject(p: string) {
  browserStore.openProject(p)
}

function openProjectMenu(e: MouseEvent, p: string) {
  showMenu({
    x: e.clientX,
    y: e.clientY,
    items: [
      { 
        label: '在系统中打开', 
        action: async () => {
          try {
            await projectsStore.revealInOs(p)
          } catch (error) {
            console.error('打开项目失败:', error)
            await message(`无法在系统中打开项目: ${error}`, { 
              title: '错误', 
              kind: 'error' 
            })
          }
        }
      },
      { label: '删除项目', danger: true, action: () => projectsStore.removeProject(p) }
    ]
  })
}
</script>


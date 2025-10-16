<template>
  <div class="h-screen grid grid-cols-[260px_1fr_420px] overflow-hidden bg-gray-50">
    <aside class="border-r border-gray-200 bg-white overflow-auto">
      <LeftSidebar />
    </aside>
    <main class="grid grid-rows-[auto_1fr] overflow-hidden">
      <Toolbar @open-settings="openSettings" :input-dialog="inputDialog" />
      <VideoGrid :input-dialog="inputDialog" />
    </main>
    <aside class="border-l border-gray-200 bg-white overflow-hidden">
      <RightPlayer />
    </aside>
  </div>
  <ContextMenu />
  <SettingsModal ref="settingsModal" />
  <InputDialog ref="inputDialog" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LeftSidebar from './components/LeftSidebar.vue'
import Toolbar from './components/Toolbar.vue'
import VideoGrid from './components/VideoGrid.vue'
import RightPlayer from './components/RightPlayer.vue'
import ContextMenu from './components/ContextMenu.vue'
import SettingsModal from './components/SettingsModal.vue'
import InputDialog from './components/InputDialog.vue'
import { useProjectsStore } from '@/stores/projects'

const settingsModal = ref<InstanceType<typeof SettingsModal>>()
const inputDialog = ref<InstanceType<typeof InputDialog>>()

onMounted(() => {
  const ps = useProjectsStore()
  ps.load()
})

function openSettings() {
  settingsModal.value?.open()
}
</script>



<template>
  <div class="h-full min-h-0 grid grid-rows-[1fr_auto] bg-gray-100">
    <div v-if="!videoSrc" class="flex items-center justify-center text-gray-400">
      选择一个视频播放
    </div>
    <div v-else class="grid grid-rows-[1fr_auto_auto] min-h-0">
      <div class="min-h-0 overflow-hidden bg-gray-200 flex items-center justify-center">
        <video
          ref="videoRef"
          :src="videoSrc"
          class="max-w-full max-h-full object-contain"
          @loadedmetadata="onLoaded"
          @play="onPlay"
          @pause="onPause"
          @ended="onEnded"
        />
      </div>
      <div class="border-t border-gray-200 p-2 flex items-center justify-center gap-2 bg-white/80 backdrop-blur">
        <button @click="toggle" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors">
          {{ playing ? '暂停' : '播放' }}
        </button>
        <button @click="seek(-5)" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors">
          快退5s
        </button>
        <button @click="seek(5)" class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors">
          快进5s
        </button>
      </div>
      <div class="border-t border-gray-200 px-3 py-2 text-sm text-gray-600 bg-gray-50">
        <div class="flex items-center justify-between gap-3">
          <div class="truncate" :title="videoName">
            {{ videoName || '未选择视频' }}
          </div>
          <div class="flex items-center gap-3 whitespace-nowrap">
            <span v-if="videoWidth && videoHeight">{{ videoWidth }}×{{ videoHeight }}</span>
            <span v-if="durationSec">{{ formattedDuration }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBrowserStore } from '@/stores/browser'
import { convertFileSrc } from '@tauri-apps/api/core'

const browser = useBrowserStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const playing = ref(false)
const videoWidth = ref(0)
const videoHeight = ref(0)
const durationSec = ref(0)

const videoSrc = computed(() => browser.currentVideoPath ? convertFileSrc(browser.currentVideoPath) : '')
const videoName = computed(() => {
  const p = browser.currentVideoPath
  if (!p) return ''
  const parts = p.split(/[\\\/]/)
  return parts[parts.length - 1] || ''
})
const formattedDuration = computed(() => formatDuration(durationSec.value))

watch(() => browser.currentVideoPath, () => {
  playing.value = false
  videoWidth.value = 0
  videoHeight.value = 0
  durationSec.value = 0
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
})

function toggle() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) {
    v.play()
    playing.value = true
  } else {
    v.pause()
    playing.value = false
  }
}

function seek(delta: number) {
  const v = videoRef.value
  if (!v) return
  v.currentTime = Math.max(0, v.currentTime + delta)
}

function onLoaded() {
  const v = videoRef.value
  if (!v) return
  videoWidth.value = v.videoWidth
  videoHeight.value = v.videoHeight
  durationSec.value = isFinite(v.duration) ? Math.max(0, v.duration) : 0
}

function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function onPlay() {
  playing.value = true
}

function onPause() {
  // 结束事件也会触发 pause，这里保持为 false
  playing.value = false
}

function onEnded() {
  const v = videoRef.value
  if (!v) return
  v.pause()
  playing.value = false
}
</script>


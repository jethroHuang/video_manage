<template>
  <div v-if="visible" :style="{ left: x + 'px', top: y + 'px' }"
       class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] p-1.5"
       @contextmenu.prevent>
    <div v-for="(it, i) in items" :key="i"
         :class="['px-3 py-2 rounded-md cursor-pointer text-sm transition-colors', it.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100', it.disabled && 'opacity-50 pointer-events-none']"
         @click="onClick(it)">
      {{ it.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContextMenu } from '@/components/context'

const { visible, x, y, items, click } = useContextMenu()

function onClick(it: any) {
  if (!it.disabled) click(it)
}
</script>



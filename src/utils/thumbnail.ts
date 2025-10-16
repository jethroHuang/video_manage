import { invoke } from '@tauri-apps/api/core'
import { ref } from 'vue'

const memoryCache = new Map<string, string>()
const processingSet = new Set<string>() // 跟踪正在处理的文件，避免重复

// 限制并发生成数量，避免同时调用太多 FFmpeg 进程
const pendingQueue: Array<{ path: string; resolve: (url: string) => void; reject: (err: any) => void }> = []
let activeCount = 0
const MAX_CONCURRENT = 3

// 进度跟踪
export const thumbnailProgress = ref({
  total: 0,
  completed: 0,
  isGenerating: false
})

export function resetProgress() {
  thumbnailProgress.value = {
    total: 0,
    completed: 0,
    isGenerating: false
  }
  processingSet.clear() // 清空处理中的文件集合
  memoryCache.clear() // 清空缓存
}

export function incrementTotal() {
  thumbnailProgress.value.total++
  thumbnailProgress.value.isGenerating = true
}

async function processQueue() {
  if (activeCount >= MAX_CONCURRENT || pendingQueue.length === 0) return
  
  const item = pendingQueue.shift()
  if (!item) return
  
  activeCount++
  try {
    const url = await invoke<string>('generate_thumbnail', { videoPath: item.path })
    memoryCache.set(item.path, url)
    item.resolve(url)
    // 更新进度
    thumbnailProgress.value.completed++
    // 检查是否全部完成
    if (thumbnailProgress.value.completed >= thumbnailProgress.value.total) {
      setTimeout(() => {
        thumbnailProgress.value.isGenerating = false
      }, 500) // 延迟隐藏，让用户看到100%
    }
  } catch (err) {
    item.reject(err)
    // 失败也算完成
    thumbnailProgress.value.completed++
    if (thumbnailProgress.value.completed >= thumbnailProgress.value.total) {
      setTimeout(() => {
        thumbnailProgress.value.isGenerating = false
      }, 500)
    }
  } finally {
    processingSet.delete(item.path) // 从处理集合中移除
    activeCount--
    processQueue() // 处理下一个
  }
}

export async function getThumbnail(filePath: string): Promise<string> {
  const cached = memoryCache.get(filePath)
  if (cached) return cached
  
  // 如果正在处理中，等待处理完成
  if (processingSet.has(filePath)) {
    // 轮询等待缓存结果
    return new Promise((resolve) => {
      const checkCache = setInterval(() => {
        const result = memoryCache.get(filePath)
        if (result) {
          clearInterval(checkCache)
          resolve(result)
        }
      }, 100)
    })
  }
  
  // 标记为正在处理
  processingSet.add(filePath)
  
  // 使用队列控制并发
  const url = await new Promise<string>((resolve, reject) => {
    pendingQueue.push({ path: filePath, resolve, reject })
    processQueue()
  }).catch((err) => {
    // 失败时缓存占位，避免重复重试
    const placeholder =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' fill='%239ca3af'%3E%3Crect x='8' y='16' width='48' height='32' rx='4' fill='none' stroke='%239ca3af' stroke-width='2'/%3E%3Cpath d='M28 26l12 8-12 8z' fill='%239ca3af'/%3E%3C/svg%3E"
    memoryCache.set(filePath, placeholder)
    return placeholder
  })
  
  return url
}


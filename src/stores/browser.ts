import { defineStore } from 'pinia'
import { remove as removeFile, remove as removeDir, rename, copyFile, mkdir as createDir, stat } from '@tauri-apps/plugin-fs'
import { join, dirname } from '@tauri-apps/api/path'
import { ask, message } from '@tauri-apps/plugin-dialog'

type Clipboard = { type: 'copy' | 'cut'; path: string } | null

export const useBrowserStore = defineStore('browser', {
  state: () => ({
    currentProjectPath: '',
    currentDirPath: '',
    currentVideoPath: '',
    selectedItem: '' as string | null,
    clipboard: null as Clipboard,
    refreshTrigger: 0,
  }),
  getters: {
    canGoBack(): boolean {
      return this.currentDirPath !== this.currentProjectPath && !!this.currentProjectPath
    },
  },
  actions: {
    async canPaste(): Promise<boolean> {
      if (!this.clipboard) return false
      const sourceDir = await dirname(this.clipboard.path)
      return sourceDir !== this.currentDirPath
    },
    async openProject(p: string) {
      this.currentProjectPath = p
      this.currentDirPath = p
      this.currentVideoPath = ''
      this.selectedItem = ''
    },
    async enterDir(p: string) {
      this.currentDirPath = p
      this.selectedItem = ''
    },
    async goBack() {
      if (this.currentDirPath === this.currentProjectPath) return
      const parent = await dirname(this.currentDirPath)
      this.currentDirPath = parent
    },
    async newFolder(name: string) {
      const p = await join(this.currentDirPath, name)
      await createDir(p)
    },
    async rename(from: string, toName: string) {
      const to = await join(await dirname(from), toName)
      await rename(from, to)
      // 如果重命名的是当前播放的视频，更新路径
      if (this.currentVideoPath === from) {
        this.currentVideoPath = to
      }
      // 如果重命名的是当前选中的项，更新路径
      if (this.selectedItem === from) {
        this.selectedItem = to
      }
    },
    async remove(p: string, isDir: boolean) {
      // 删除目录时需要递归删除
      if (isDir) {
        await removeDir(p, { recursive: true })
      } else {
        await removeFile(p)
      }
      // 如果删除的是当前播放的视频，清空播放器
      if (this.currentVideoPath === p) {
        this.currentVideoPath = ''
      }
      // 如果删除的是文件夹，检查当前视频是否在该文件夹内（兼容不同路径分隔符）
      if (isDir && this.currentVideoPath) {
        const normalizedDir = p.replace(/\\/g, '/')
        const normalizedVideo = this.currentVideoPath.replace(/\\/g, '/')
        if (normalizedVideo.startsWith(normalizedDir + '/')) {
          this.currentVideoPath = ''
        }
      }
      // 如果删除的是当前选中的项，清空选中
      if (this.selectedItem === p) {
        this.selectedItem = ''
      }
      // 如果删除的是文件夹，检查当前选中项是否在该文件夹内
      if (isDir && this.selectedItem) {
        const normalizedDir = p.replace(/\\/g, '/')
        const normalizedSelected = this.selectedItem.replace(/\\/g, '/')
        if (normalizedSelected.startsWith(normalizedDir + '/')) {
          this.selectedItem = ''
        }
      }
    },
    async move(src: string, dest: string) {
      try {
        await rename(src, dest)
      } catch {
        await copyFile(src, dest)
        await removeFile(src)
      }
      // 如果移动的是当前播放的视频，清空播放器
      if (this.currentVideoPath === src) {
        this.currentVideoPath = ''
      }
      // 如果移动的是当前选中的项，清空选中
      if (this.selectedItem === src) {
        this.selectedItem = ''
      }
    },
    copy(path: string) {
      this.clipboard = { type: 'copy', path }
    },
    cut(path: string) {
      this.clipboard = { type: 'cut', path }
    },
    async pasteClipboard() {
      if (!this.clipboard) return
      
      // 检查源文件的父目录
      const sourceDir = await dirname(this.clipboard.path)
      
      // 如果源文件就在当前目录，不允许粘贴
      if (sourceDir === this.currentDirPath) {
        await message(
          '不能在文件所在的文件夹中粘贴',
          { title: '提示', kind: 'info' }
        )
        return
      }
      
      const name = this.clipboard.path.split(/[\\/]/).pop() || ''
      const dest = await join(this.currentDirPath, name)
      if (this.clipboard.type === 'copy') {
        await copyFile(this.clipboard.path, dest)
      } else {
        // 剪切操作：移动文件
        await this.move(this.clipboard.path, dest)
      }
      // 粘贴后清空剪切板
      this.clipboard = null
      this.refresh()
    },
    async deleteSelected() {
      if (!this.selectedItem) return
      
      try {
        // 检查选中项是否为文件夹
        const info = await stat(this.selectedItem)
        const isDir = info.isDirectory
        
        // 确认删除
        const itemName = this.selectedItem.split(/[\\/]/).pop() || ''
        const confirmed = await ask(
          isDir 
            ? `确定要删除文件夹 "${itemName}" 吗？\n\n⚠️ 文件夹及其所有内容都将被永久删除！` 
            : `确定要删除 "${itemName}" 吗？`,
          { 
            title: '确认删除', 
            kind: 'warning' 
          }
        )
        if (!confirmed) return
        
        await this.remove(this.selectedItem, isDir)
        this.refresh()
      } catch (error) {
        console.error('删除失败:', error)
        await message(`删除失败: ${error}`, { title: '错误', kind: 'error' })
      }
    },
    selectVideo(p: string) {
      this.currentVideoPath = p
      this.selectedItem = p
    },
    selectItem(p: string) {
      this.selectedItem = p
    },
    clearSelection() {
      this.selectedItem = ''
    },
    refresh() {
      // 触发刷新：递增触发器让监听者重新加载
      this.refreshTrigger++
    },
  }
})


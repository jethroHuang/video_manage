import { defineStore } from 'pinia'
import { remove as removeFile, remove as removeDir, rename, copyFile, mkdir as createDir, stat } from '@tauri-apps/plugin-fs'
import { join, dirname } from '@tauri-apps/api/path'
import { ask, message } from '@tauri-apps/plugin-dialog'

type Clipboard = { type: 'copy' | 'cut'; paths: string[] } | null

export const useBrowserStore = defineStore('browser', {
  state: () => ({
    currentProjectPath: '',
    currentDirPath: '',
    currentVideoPath: '',
    selectedItem: '' as string | null,
    selectedItems: [] as string[],
    selectedAnchor: '' as string | null,
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
      if (!this.clipboard || this.clipboard.paths.length === 0) return false
      const sourceDirs = await Promise.all(this.clipboard.paths.map(p => dirname(p)))
      // 不允许将任一来自当前目录的项目粘贴回当前目录
      return sourceDirs.every(d => d !== this.currentDirPath)
    },
    async openProject(p: string) {
      this.currentProjectPath = p
      this.currentDirPath = p
      this.currentVideoPath = ''
      this.selectedItem = ''
      this.selectedItems = []
      this.selectedAnchor = ''
    },
    async enterDir(p: string) {
      this.currentDirPath = p
      this.selectedItem = ''
      this.selectedItems = []
      this.selectedAnchor = ''
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
      // 从多选集合中移除被删除项
      if (this.selectedItems.length > 0) {
        this.selectedItems = this.selectedItems.filter(it => it !== p)
        if (this.selectedItems.length === 0) {
          this.selectedItem = ''
        } else if (!this.selectedItems.includes(this.selectedItem || '')) {
          this.selectedItem = this.selectedItems[this.selectedItems.length - 1]
        }
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
      // 同步多选集合
      if (this.selectedItems.length > 0) {
        const idx = this.selectedItems.indexOf(src)
        if (idx >= 0) {
          const next = [...this.selectedItems]
          next.splice(idx, 1, dest)
          this.selectedItems = next
        }
      }
    },
    copy(path: string) {
      // 如果有多选，复制所有选中的项；否则只复制单个项
      if (this.selectedItems.length > 1) {
        this.clipboard = { type: 'copy', paths: [...this.selectedItems] }
      } else {
        this.clipboard = { type: 'copy', paths: [path] }
      }
      console.log('复制到剪贴板:', this.clipboard)
    },
    cut(path: string) {
      // 如果有多选，剪切所有选中的项；否则只剪切单个项
      if (this.selectedItems.length > 1) {
        this.clipboard = { type: 'cut', paths: [...this.selectedItems] }
      } else {
        this.clipboard = { type: 'cut', paths: [path] }
      }
      console.log('剪切到剪贴板:', this.clipboard)
    },
    async pasteClipboard() {
      if (!this.clipboard || this.clipboard.paths.length === 0) return

      const sourceDirs = await Promise.all(this.clipboard.paths.map(p => dirname(p)))
      if (sourceDirs.some(d => d === this.currentDirPath)) {
        await message('不能在源文件所在的文件夹中粘贴（至少一项在当前目录）', { title: '提示', kind: 'info' })
        return
      }

      const clipboardType = this.clipboard.type
      const pathsToPaste = [...this.clipboard.paths]
      
      for (const src of pathsToPaste) {
        try {
          const name = src.split(/[\\/]/).pop() || ''
          const dest = await join(this.currentDirPath, name)
          
          if (clipboardType === 'copy') {
            const srcStat = await stat(src)
            if (srcStat.isDirectory) {
              // TODO: 复制文件夹需要递归实现
              console.warn(`暂不支持复制文件夹: ${name}`)
            } else {
              await copyFile(src, dest)
            }
          } else {
            // 剪切操作
            await this.move(src, dest)
          }
        } catch (err) {
          console.error('粘贴失败:', src, err)
          // 继续粘贴下一个文件，不中断循环
        }
      }
      
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
      this.selectedItems = [p]
      this.selectedAnchor = p
    },
    // 单选：清空其他选择
    selectItem(p: string) {
      this.selectedItem = p
      this.selectedItems = [p]
      this.selectedAnchor = p
    },
    // 切换选择（Ctrl/Cmd）
    toggleSelectItem(p: string) {
      const set = new Set(this.selectedItems)
      if (set.has(p)) {
        set.delete(p)
      } else {
        set.add(p)
      }
      this.selectedItems = Array.from(set)
      // 更新最后焦点项
      this.selectedItem = p
      // Ctrl 点击不改变锚点（保持上次的连续选择基准）
    },
    // 设定一个批量选择集合（Shift 连选）
    setSelection(paths: string[], focusPath?: string) {
      this.selectedItems = [...paths]
      this.selectedItem = focusPath ?? (paths[paths.length - 1] || '')
    },
    // 设置锚点
    setAnchor(p: string) {
      this.selectedAnchor = p
    },
    // 查询是否已选
    isSelected(p: string): boolean {
      return this.selectedItems.includes(p)
    },
    clearSelection() {
      this.selectedItem = ''
      this.selectedItems = []
      this.selectedAnchor = ''
    },
    refresh() {
      // 触发刷新：递增触发器让监听者重新加载
      this.refreshTrigger++
    },
  }
})


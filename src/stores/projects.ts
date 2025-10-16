import { defineStore } from 'pinia'
import { readTextFile, writeTextFile, BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs'
import { open as openShell } from '@tauri-apps/plugin-shell'
import { openPath } from '@tauri-apps/plugin-opener'
import { appConfigDir } from '@tauri-apps/api/path'

const PROJECTS_FILE = 'projects.json'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as string[]
  }),
  actions: {
    async load() {
      try {
        const txt = await readTextFile(PROJECTS_FILE, { baseDir: BaseDirectory.AppConfig })
        this.projects = JSON.parse(txt)
      } catch (e) {
        console.warn('Failed to load projects:', e)
        this.projects = []
      }
    },
    async save() {
      try {
        // 确保配置目录存在
        const configDir = await appConfigDir()
        const dirExists = await exists(configDir)
        if (!dirExists) {
          await mkdir(configDir, { recursive: true })
        }
        
        // 写入配置文件
        await writeTextFile(PROJECTS_FILE, JSON.stringify(this.projects), { 
          baseDir: BaseDirectory.AppConfig 
        })
      } catch (e) {
        console.error('Failed to save projects:', e)
        throw e
      }
    },
    async addProject(p: string) {
      if (!this.projects.includes(p)) {
        this.projects.push(p)
        await this.save()
      }
    },
    async removeProject(p: string) {
      this.projects = this.projects.filter(x => x !== p)
      await this.save()
    },
    async revealInOs(p: string) {
      try {
        // 优先使用 opener 插件，如果失败则回退到 shell 插件
        try {
          await openPath(p)
        } catch (openerError) {
          console.warn('opener 插件失败，尝试使用 shell 插件:', openerError)
          await openShell(p)
        }
      } catch (error) {
        console.error('无法在系统中打开路径:', error)
        throw new Error(`无法在系统中打开路径: ${error}`)
      }
    },
  }
})


import { readDir as _readDir, mkdir as createDir, remove as removeFile, remove as removeDir, rename, copyFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

export const listEntries = (p: string) => _readDir(p)

export const makeDir = async (dir: string, name: string) => createDir(await join(dir, name))

export { createDir, removeFile, removeDir, rename, copyFile, join as joinPath }


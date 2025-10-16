# 快速开始指南

## ✅ 已修复的问题

之前遇到的 `@tauri-apps/plugin-*` 包找不到的问题已经修复。现在使用 Tauri v2 内置的 `@tauri-apps/api` 模块，无需安装额外的插件包。

## 🚀 启动步骤

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 2. 启动开发服务器

```bash
npm run tauri:dev
```

首次运行时，Tauri 会编译 Rust 后端，这可能需要 3-5 分钟。编译完成后，应用窗口会自动打开。

### 3. 开始使用

1. 点击左下角"**+ 导入项目**"按钮
2. 选择一个包含视频文件的文件夹
3. 在中间区域浏览视频缩略图
4. 点击视频在右侧播放

## 📦 打包发布

```bash
npm run tauri:build
```

打包完成后，可执行文件位于：
- **macOS**: `src-tauri/target/release/bundle/dmg/` 和 `macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/` 和 `nsis/`

## 🔧 技术栈

- **前端**: Vue 3 + Vite + TypeScript + Tailwind CSS
- **状态管理**: Pinia
- **桌面框架**: Tauri 2.x
- **API**: @tauri-apps/api (fs, dialog, path, shell)

## ⚠️ 常见问题

### Q: 提示找不到模块或类型声明？
A: 运行 `npm install` 或 `yarn install` 安装依赖后即可解决。

### Q: 视频缩略图不显示？
A: 确保视频格式是浏览器支持的格式（MP4/WebM/MOV），部分编码可能不支持。

### Q: 无法访问某些文件夹？
A: Tauri v2 需要在 `tauri.conf.json` 中配置文件系统权限。当前配置已允许访问用户通过对话框选择的目录。

### Q: 首次编译 Rust 很慢？
A: 这是正常现象，Rust 编译器会优化代码。后续的增量编译会快很多。

## 📝 开发提示

- 修改 Vue 代码会触发热更新（HMR）
- 修改 Rust 代码需要重启 `npm run tauri:dev`
- Tailwind 类名可在 `src/**/*.vue` 中直接使用
- 项目列表保存在系统配置目录（macOS: `~/Library/Application Support/com.example.video_manage/`）

## 🎯 核心功能

✅ 三栏布局（项目列表 | 视频网格 | 播放器）  
✅ 视频首帧缩略图生成  
✅ 文件/文件夹管理（新建、重命名、删除、复制、剪切、粘贴）  
✅ 拖拽移动视频到文件夹  
✅ 右键菜单  
✅ 视频播放控制（播放/暂停/快进/快退）  
✅ 项目持久化  
✅ 跨平台支持（Windows/macOS）  



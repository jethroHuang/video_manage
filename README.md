# 视频管理桌面应用

基于 Tauri + Vue3 + Vite + TypeScript + Tailwind CSS 构建的跨平台视频文件管理应用。

必须基于 Tauri v2 的 api 编写代码。

## 功能特性

- 📁 **项目管理**：导入多个文件夹作为项目，快速切换
- 🎬 **视频浏览**：网格布局显示视频缩略图（首帧截取）
- 📂 **文件操作**：新建文件夹、重命名、复制、剪切、粘贴、删除
- 🎥 **视频播放**：内置播放器支持播放/暂停/快进/快退
- 🖱️ **拖拽移动**：拖动视频到文件夹中进行整理
- 💻 **跨平台**：支持 Windows 和 macOS

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **类型支持**：TypeScript
- **UI 样式**：Tailwind CSS
- **状态管理**：Pinia
- **桌面容器**：Tauri 2.x

## 开发环境准备

### 前置要求

- Node.js >= 18
- Rust >= 1.70
- 系统依赖（根据平台）：
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools

### 安装依赖

```bash
# 安装前端依赖（使用 npm 或 yarn）
npm install
# 或
yarn install

# Rust 依赖会在首次运行时自动安装
```

## 开发

```bash
# 启动开发服务器
npm run tauri:dev
```

## 构建

```bash
# 构建生产版本
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录下：
- **macOS**: `.dmg` 和 `.app`
- **Windows**: `.msi` 和 `.exe`

## 项目结构

```
video_manage/
├── src/                      # Vue 前端源码
│   ├── components/           # Vue 组件
│   │   ├── LeftSidebar.vue   # 左侧项目列表
│   │   ├── Toolbar.vue       # 顶部工具栏
│   │   ├── VideoGrid.vue     # 中间视频网格
│   │   ├── RightPlayer.vue   # 右侧播放器
│   │   ├── ContextMenu.vue   # 右键菜单
│   │   └── context.ts        # 菜单逻辑
│   ├── stores/               # Pinia 状态管理
│   │   ├── projects.ts       # 项目列表持久化
│   │   └── browser.ts        # 浏览器状态
│   ├── utils/                # 工具函数
│   │   ├── fs.ts             # 文件系统封装
│   │   └── thumbnail.ts      # 缩略图生成
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   └── style.css             # Tailwind 样式
├── src-tauri/                # Tauri Rust 后端
│   ├── src/
│   │   └── main.rs           # Rust 入口
│   ├── Cargo.toml            # Rust 依赖
│   └── tauri.conf.json       # Tauri 配置
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## 使用说明

1. **导入项目**：点击左侧栏底部"导入项目"按钮，选择包含视频的文件夹
2. **浏览视频**：在中间区域查看视频缩略图和文件夹
3. **播放视频**：单击视频缩略图在右侧播放
4. **文件操作**：
   - 右键视频/文件夹：重命名、复制、剪切、删除
   - 右键空白区域：新建文件夹、粘贴
   - 拖动视频到文件夹：移动文件
5. **项目管理**：右键项目名称可删除或在系统中打开

## 注意事项

- 缩略图使用 HTML5 Video API 生成，支持浏览器可解码的格式（MP4/WebM/MOV 等）
- 项目列表保存在应用配置目录中（`AppConfig/projects.json`）
- 文件操作直接修改磁盘文件，请谨慎使用删除功能
- 本项目使用 Tauri v2 + `@tauri-apps/api` 内置模块（无需额外插件包）
- 首次打开项目时，Tauri 会自动编译 Rust 后端，可能需要几分钟

## License

MIT


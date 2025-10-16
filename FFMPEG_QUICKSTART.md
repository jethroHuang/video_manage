# FFmpeg 集成 - 快速开始

## ⚡ 5 分钟完成配置

### 对于 macOS 用户（推荐使用 Homebrew）

```bash
# 1. 安装 FFmpeg（如果还没有）
brew install ffmpeg

# 2. 复制到项目
cp $(which ffmpeg) src-tauri/binaries/ffmpeg-$(uname -m)-apple-darwin

# 3. 添加执行权限
chmod +x src-tauri/binaries/ffmpeg-*-apple-darwin

# 4. 完成！开始开发
npm run tauri:dev
```

### 对于 Windows 用户

```powershell
# 1. 下载 FFmpeg (约 80MB)
# 访问: https://www.gyan.dev/ffmpeg/builds/
# 下载: ffmpeg-release-essentials.zip

# 2. 解压并复制
# 找到 bin\ffmpeg.exe，重命名并复制到：
# src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe

# 3. 完成！开始开发
npm run tauri:dev
```

### 对于 Linux 用户

```bash
# 1. 下载静态编译版本
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz

# 2. 复制到项目
mv ffmpeg-*-amd64-static/ffmpeg src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu

# 3. 添加执行权限
chmod +x src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu

# 4. 完成！开始开发
npm run tauri:dev
```

## ✅ 验证安装

```bash
# 测试 FFmpeg 是否可用
./src-tauri/binaries/ffmpeg-*-apple-darwin -version  # macOS
.\src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe -version  # Windows
./src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu -version  # Linux
```

应该输出版本信息，例如：`ffmpeg version N-114XXX`

## 📦 构建发布版本

```bash
npm run tauri:build
```

Tauri 会自动打包对应平台的 FFmpeg，用户无需单独安装！

## 📖 详细文档

查看 [FFMPEG_SETUP.md](./FFMPEG_SETUP.md) 了解：
- 跨平台打包说明
- 工作原理详解
- 常见问题解答
- 故障排查指南


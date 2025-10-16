# FFmpeg 二进制文件存放目录

此目录用于存放不同平台的 FFmpeg 静态编译二进制文件。

## 文件命名规范

请按照以下命名规范放置 FFmpeg 二进制文件：

```
binaries/
  ├── ffmpeg-aarch64-apple-darwin          # macOS Apple Silicon (M1/M2/M3)
  ├── ffmpeg-x86_64-apple-darwin           # macOS Intel
  ├── ffmpeg-x86_64-pc-windows-msvc.exe    # Windows 64位
  └── ffmpeg-x86_64-unknown-linux-gnu      # Linux 64位
```

## 下载地址

### macOS (Intel & Apple Silicon)
- 官方网站: https://evermeet.cx/ffmpeg/
- 直接下载: https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip
- 下载后解压，将二进制文件重命名为对应平台名称

### Windows
- 官方网站: https://www.gyan.dev/ffmpeg/builds/
- 推荐: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
- 解压后在 `bin/` 目录找到 `ffmpeg.exe`，重命名为 `ffmpeg-x86_64-pc-windows-msvc.exe`

### Linux
- 官方网站: https://johnvansickle.com/ffmpeg/
- 直接下载: https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
- 解压后找到 `ffmpeg` 二进制，重命名为 `ffmpeg-x86_64-unknown-linux-gnu`

## 注意事项

1. **文件权限**: macOS 和 Linux 上需要给二进制文件添加执行权限：
   ```bash
   chmod +x ffmpeg-*-apple-darwin
   chmod +x ffmpeg-*-linux-gnu
   ```

2. **文件大小**: 每个二进制文件约 60-100 MB，会增加应用体积

3. **版本选择**: 推荐使用静态编译的 "essentials" 或 "release" 版本，避免依赖系统库

4. **测试**: 下载后可以在终端测试是否能正常运行：
   ```bash
   ./binaries/ffmpeg-x86_64-apple-darwin -version
   ```

## 可选：仅打包当前平台

如果只想为当前平台构建，可以只下载对应平台的二进制文件。


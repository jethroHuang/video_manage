# FFmpeg 集成指南

本应用已配置将 FFmpeg 打包到应用内部，无需用户单独安装。

## 🎯 开发者配置步骤

### 第一步：下载 FFmpeg 静态二进制文件

根据你需要支持的平台下载对应的 FFmpeg 静态编译版本：

#### macOS (推荐同时下载两个架构)

**Apple Silicon (M1/M2/M3):**
```bash
# 下载 FFmpeg (Apple Silicon)
curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o ffmpeg-arm64.zip
unzip ffmpeg-arm64.zip
mv ffmpeg src-tauri/binaries/ffmpeg-aarch64-apple-darwin
chmod +x src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

**Intel:**
```bash
# 下载 FFmpeg (Intel)
# 访问 https://evermeet.cx/ffmpeg/ 下载 x86_64 版本
# 或使用 Homebrew 安装后复制：
# brew install ffmpeg
# cp $(which ffmpeg) src-tauri/binaries/ffmpeg-x86_64-apple-darwin
chmod +x src-tauri/binaries/ffmpeg-x86_64-apple-darwin
```

**提示**: macOS 通用二进制可以用 `lipo` 命令合并：
```bash
lipo -create -output ffmpeg-universal-apple-darwin \
  ffmpeg-x86_64-apple-darwin \
  ffmpeg-aarch64-apple-darwin
```

#### Windows

1. 访问: https://www.gyan.dev/ffmpeg/builds/
2. 下载: **ffmpeg-release-essentials.zip** (约 80MB)
3. 解压后找到 `bin/ffmpeg.exe`
4. 重命名并复制到项目：
   ```powershell
   copy ffmpeg-xxx\bin\ffmpeg.exe src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe
   ```

#### Linux

```bash
# 下载 FFmpeg (Linux x86_64)
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
mv ffmpeg-*-amd64-static/ffmpeg src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu
chmod +x src-tauri/binaries/ffmpeg-x86_64-unknown-linux-gnu
```

### 第二步：验证文件结构

确保 `src-tauri/binaries/` 目录包含以下文件：

```
src-tauri/binaries/
├── README.md
├── ffmpeg-aarch64-apple-darwin          (macOS Apple Silicon, 约 60-80MB)
├── ffmpeg-x86_64-apple-darwin           (macOS Intel, 约 60-80MB)
├── ffmpeg-x86_64-pc-windows-msvc.exe    (Windows, 约 80-100MB)
└── ffmpeg-x86_64-unknown-linux-gnu      (Linux, 约 70-90MB)
```

**注意**: 
- 你可以只下载当前平台的二进制文件用于开发测试
- 打包时 Tauri 会自动选择对应平台的文件
- 不要将这些大文件提交到 Git（已在 .gitignore 中配置）

### 第三步：测试 FFmpeg 是否可用

```bash
# macOS/Linux
./src-tauri/binaries/ffmpeg-x86_64-apple-darwin -version

# Windows
.\src-tauri\binaries\ffmpeg-x86_64-pc-windows-msvc.exe -version
```

应该输出 FFmpeg 版本信息，例如：
```
ffmpeg version N-114XXX-gXXXXXXX
```

### 第四步：开发测试

```bash
npm run tauri:dev
```

- **开发模式**: 优先使用系统 FFmpeg（如果已安装），找不到则使用打包的版本
- **生产模式**: 始终使用打包的 FFmpeg

### 第五步：构建应用

```bash
npm run tauri:build
```

Tauri 会自动：
1. 检测目标平台
2. 将对应平台的 `ffmpeg-*` 二进制打包到 `resources/binaries/ffmpeg` 中
3. 在运行时通过 `resource_dir()` API 访问

## 📦 打包说明

### 应用体积增加

每个平台的 FFmpeg 二进制文件约 60-100MB，最终应用体积：

| 平台 | 无 FFmpeg | 含 FFmpeg |
|-----|----------|----------|
| macOS | ~5MB | ~65-85MB |
| Windows | ~4MB | ~84-104MB |
| Linux | ~4MB | ~74-94MB |

### .gitignore 配置

建议在 `.gitignore` 中添加：

```gitignore
# FFmpeg 二进制文件（体积大，不提交到版本控制）
src-tauri/binaries/ffmpeg-*
```

仅提交 `src-tauri/binaries/README.md` 作为说明文档。

## 🔧 工作原理

### 代码实现

查看 `src-tauri/src/main.rs` 中的 `get_ffmpeg_path()` 函数：

```rust
fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    // 开发模式：尝试系统 ffmpeg
    #[cfg(debug_assertions)]
    {
        if let Ok(output) = Command::new("ffmpeg").arg("-version").output() {
            if output.status.success() {
                return Ok(std::path::PathBuf::from("ffmpeg"));
            }
        }
    }
    
    // 生产模式：使用打包的 ffmpeg
    app.path()
        .resource_dir()
        .map_err(|e| format!("无法获取资源目录: {}", e))?
        .join("binaries")
        .join(if cfg!(target_os = "windows") {
            "ffmpeg.exe"
        } else {
            "ffmpeg"
        })
        .canonicalize()
        .map_err(|e| format!("FFmpeg 未找到: {}", e))
}
```

### Tauri 配置

在 `tauri.conf.json` 中：

```json
{
  "bundle": {
    "externalBin": [
      "binaries/ffmpeg"
    ]
  }
}
```

Tauri 会根据目标平台查找：
- macOS: `binaries/ffmpeg-x86_64-apple-darwin` 或 `-aarch64-apple-darwin`
- Windows: `binaries/ffmpeg-x86_64-pc-windows-msvc.exe`
- Linux: `binaries/ffmpeg-x86_64-unknown-linux-gnu`

## 🚨 常见问题

### Q1: 编译时提示找不到 FFmpeg？

**开发模式**：检查是否安装了系统 FFmpeg 或者 `binaries/` 目录是否有对应平台文件

**生产模式**：必须提供对应平台的二进制文件才能构建

### Q2: macOS 提示"无法验证开发者"？

```bash
# 移除隔离属性
xattr -d com.apple.quarantine src-tauri/binaries/ffmpeg-*-apple-darwin
```

### Q3: Linux 提示权限被拒绝？

```bash
chmod +x src-tauri/binaries/ffmpeg-*-linux-gnu
```

### Q4: 打包后提示 FFmpeg 未找到？

检查：
1. `tauri.conf.json` 的 `externalBin` 配置是否正确
2. 二进制文件命名是否符合 Tauri 约定（见上文）
3. 运行时日志中的实际路径（在错误消息中会显示）

### Q5: 想使用系统 FFmpeg 而不打包？

删除 `tauri.conf.json` 中的 `externalBin` 配置，并修改 `main.rs` 中的 `get_ffmpeg_path()` 函数直接返回 `"ffmpeg"`。

## 📚 参考链接

- FFmpeg 官网: https://ffmpeg.org/
- Tauri External Binary: https://v2.tauri.app/reference/config/#externalbin
- macOS FFmpeg: https://evermeet.cx/ffmpeg/
- Windows FFmpeg: https://www.gyan.dev/ffmpeg/builds/
- Linux FFmpeg: https://johnvansickle.com/ffmpeg/

## ✅ 部署清单

构建正式版本前的检查项：

- [ ] 下载所有目标平台的 FFmpeg 二进制文件
- [ ] 验证文件命名符合 Tauri 约定
- [ ] 测试每个平台的二进制可执行（`-version` 命令）
- [ ] 运行 `npm run tauri:build` 确保打包成功
- [ ] 在真实环境测试生成缩略图功能
- [ ] 确认 FFmpeg 二进制未提交到 Git（体积控制）


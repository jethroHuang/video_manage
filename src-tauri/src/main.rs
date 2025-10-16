#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose};
use tauri::Manager;

/// 获取 ffmpeg 可执行文件路径
fn get_ffmpeg_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let ffmpeg_name = if cfg!(target_os = "windows") {
        "ffmpeg-x86_64-pc-windows-msvc.exe"
    } else {
        "ffmpeg-aarch64-apple-darwin"
    };
    
    // 在开发模式下，直接使用 src-tauri/binaries/ 目录
    #[cfg(debug_assertions)]
    {
        let dev_path = std::env::current_dir()
            .map_err(|e| format!("无法获取当前目录: {}", e))?
            .join("src-tauri")
            .join("binaries")
            .join(ffmpeg_name);
        
        if dev_path.exists() {
            return Ok(dev_path);
        }
    }
    
    // 生产环境：使用打包的 ffmpeg 二进制文件
    app.path()
        .resource_dir()
        .map_err(|e| format!("无法获取资源目录: {}", e))?
        .join("binaries")
        .join(ffmpeg_name)
        .canonicalize()
        .map_err(|e| format!("FFmpeg 未找到: {}. 请确保已将 ffmpeg 二进制文件放入 src-tauri/binaries/ 目录", e))
}

#[tauri::command]
async fn generate_thumbnail(video_path: String, app: tauri::AppHandle) -> Result<String, String> {
    // 使用 SHA256 生成缓存文件名
    let mut hasher = Sha256::new();
    hasher.update(video_path.as_bytes());
    let hash = format!("{:x}", hasher.finalize());
    
    // 使用临时目录存储缩略图
    let cache_dir = std::env::temp_dir().join("video_manage_thumbnails");
    std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    
    let thumb_path = cache_dir.join(format!("{}.jpg", hash));
    
    // 如果缩略图已存在，直接返回
    if thumb_path.exists() {
        let data = std::fs::read(&thumb_path).map_err(|e| e.to_string())?;
        let b64 = general_purpose::STANDARD.encode(data);
        return Ok(format!("data:image/jpeg;base64,{}", b64));
    }
    
    // 获取 ffmpeg 可执行文件路径
    let ffmpeg_path = get_ffmpeg_path(&app)?;
    
    // 使用 FFmpeg 生成缩略图（带重试与更强探测）
    let run_ffmpeg = |args: Vec<&str>| -> Result<std::process::Output, String> {
        Command::new(&ffmpeg_path)
            .args(args)
            .output()
            .map_err(|e| format!("FFmpeg 执行失败: {}. 路径: {:?}", e, ffmpeg_path))
    };

    // 尝试 1：原始参数（-i 在前，轻微偏移）
    let attempt1 = vec![
        "-i", &video_path,
        "-ss", "00:00:00.100",
        "-vframes", "1",
        "-vf", "scale=320:-1",
        "-q:v", "2",
        "-y",
        thumb_path.to_str().unwrap(),
    ];

    // 尝试 2：提升探测深度，仍然 -i 在前
    let attempt2 = vec![
        "-analyzeduration", "100M",
        "-probesize", "100M",
        "-i", &video_path,
        "-ss", "00:00:00.100",
        "-vframes", "1",
        "-vf", "scale=320:-1",
        "-q:v", "2",
        "-y",
        thumb_path.to_str().unwrap(),
    ];

    // 尝试 3：将 -ss 前置到输入前（某些容器更稳），并去掉复杂选项
    let attempt3 = vec![
        "-ss", "0.1",
        "-analyzeduration", "100M",
        "-probesize", "100M",
        "-i", &video_path,
        "-vframes", "1",
        "-vf", "scale=320:-1",
        "-q:v", "2",
        "-y",
        thumb_path.to_str().unwrap(),
    ];

    // 尝试 4：不 seek，直接第一帧
    let attempt4 = vec![
        "-analyzeduration", "100M",
        "-probesize", "100M",
        "-i", &video_path,
        "-vframes", "1",
        "-vf", "scale=320:-1",
        "-q:v", "2",
        "-y",
        thumb_path.to_str().unwrap(),
    ];

    let attempts = [attempt1, attempt2, attempt3, attempt4];
    let mut last_err: Option<String> = None;
    let mut success = false;

    for args in attempts.into_iter() {
        match run_ffmpeg(args) {
            Ok(output) => {
                if output.status.success() {
                    success = true;
                    break;
                } else {
                    last_err = Some(format!("FFmpeg 错误: {}", String::from_utf8_lossy(&output.stderr)));
                }
            }
            Err(e) => {
                last_err = Some(e);
            }
        }
    }

    if !success {
        return Err(last_err.unwrap_or_else(|| "FFmpeg 未能生成缩略图".to_string()));
    }
    
    // 读取生成的缩略图并返回 base64
    let data = std::fs::read(&thumb_path).map_err(|e| e.to_string())?;
    let b64 = general_purpose::STANDARD.encode(data);
    Ok(format!("data:image/jpeg;base64,{}", b64))
}

#[tauri::command]
fn clear_thumbnail_cache() -> Result<String, String> {
    let cache_dir = std::env::temp_dir().join("video_manage_thumbnails");
    
    if !cache_dir.exists() {
        return Ok("缓存目录不存在".to_string());
    }
    
    let mut count = 0;
    let mut total_size = 0u64;
    
    // 统计并删除文件
    if let Ok(entries) = std::fs::read_dir(&cache_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                total_size += metadata.len();
                count += 1;
            }
            let _ = std::fs::remove_file(entry.path());
        }
    }
    
    // 删除目录
    let _ = std::fs::remove_dir(&cache_dir);
    
    let size_mb = total_size as f64 / 1024.0 / 1024.0;
    Ok(format!("已清除 {} 个缓存文件，释放 {:.2} MB 空间", count, size_mb))
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![generate_thumbnail, clear_thumbnail_cache])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}


use crate::services::download;
use log::info;
use tauri::Runtime;

#[tauri::command]
pub async fn download_music<R: Runtime>(
    window: tauri::Window<R>,
    path: String,
    url: String,
    bitrate: u32,
) -> Result<(), String> {
    info!("download_music path={} url={} bitrate={}", path, url, bitrate);
    download::run_download(window, path, url, bitrate).await
}

#[tauri::command]
pub async fn stop_download_music() -> Result<(), String> {
    info!("stop_download_music");
    download::stop_download();
    Ok(())
}

#[tauri::command]
pub async fn check_download_deps() -> Result<serde_json::Value, String> {
    download::check_download_deps().await
}

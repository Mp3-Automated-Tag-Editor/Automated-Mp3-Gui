use crate::models::EditViewSongMetadata;
use crate::services::{edit, library};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use log::{info, warn};
use tauri::Window;

#[tauri::command]
pub fn check_directory(var: String) -> Result<(bool, usize), (bool, String)> {
    match edit::collect_mp3_paths(&var) {
        Ok(paths) => Ok((true, paths.len())),
        Err(e) => Err((
            false,
            format!(
                "This directory cannot be selected. Failed to read directory {}: {}",
                var, e
            ),
        )),
    }
}

/// Cache-first library load: returns SQLite rows immediately and starts a background
/// mtime/size verify + parallel re-index. Prefer this over `read_music_directory`.
#[tauri::command]
pub async fn load_library(
    window: Window,
    directory: String,
) -> Result<Vec<EditViewSongMetadata>, String> {
    library::ensure_schema()?;
    // Signal any in-flight scan to stop; new worker waits for the lock.
    library::cancel_scan();

    let cached = library::query_by_directory(&directory)?;
    let dir = directory.clone();
    let win = window.clone();
    std::thread::spawn(move || {
        for _ in 0..100 {
            if !library::is_scanning() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        if let Err(e) = library::scan_directory(&win, &dir) {
            warn!("library scan failed for {dir}: {e}");
            let _ = win.emit(
                "library_scan_done",
                library::LibraryScanDone {
                    directory: dir,
                    track_count: 0,
                    updated: 0,
                    removed: 0,
                },
            );
        }
    });
    Ok(cached)
}

/// Legacy sync full read — now returns indexed rows (no base64 covers) and triggers scan.
#[tauri::command]
pub async fn read_music_directory(
    window: Window,
    directory: String,
) -> Result<Vec<EditViewSongMetadata>, String> {
    load_library(window, directory).await
}

#[tauri::command]
pub fn get_track_cover(path: String) -> Result<String, String> {
    edit::get_cover_base64(&path)
}

#[tauri::command]
pub fn refresh_library_track(
    path: String,
    directory: Option<String>,
) -> Result<EditViewSongMetadata, String> {
    library::refresh_track(&path, directory.as_deref())
}

#[tauri::command]
pub fn update_music_file(
    path: String,
    song: EditViewSongMetadata,
    cover_image_path: Option<String>,
) -> (bool, String) {
    info!(
        "update_music_file path={} image_src_len={} cover_path={:?}",
        path,
        song.image_src.len(),
        cover_image_path
    );
    let mut song = song;
    if !path.is_empty() {
        song.path = path.clone();
    }
    let song_path = song.path.clone();

    match edit::edit_song_metadata(song, cover_image_path.as_deref()) {
        Ok(_) => {
            if let Err(e) = library::refresh_track(&song_path, None) {
                warn!("library refresh after save failed: {e}");
            }
            (true, "Successfully Saved Song Details".to_owned())
        }
        Err(message) => (false, message),
    }
}

/// Embed album art from an image file path into an MP3 (bypasses base64 IPC).
#[tauri::command]
pub fn set_album_art(mp3_path: String, image_path: String) -> (bool, String) {
    info!("set_album_art mp3={} image={}", mp3_path, image_path);
    match edit::write_cover_art_from_path(&mp3_path, &image_path) {
        Ok(()) => {
            if let Err(e) = library::refresh_track(&mp3_path, None) {
                warn!("library refresh after set_album_art failed: {e}");
            }
            (true, "Album art embedded".to_owned())
        }
        Err(message) => (false, message),
    }
}

/// Download a cover image URL to a temp file (avoids webview CORS).
#[tauri::command]
pub async fn fetch_album_art_url(url: String) -> Result<(String, String), String> {
    info!("fetch_album_art_url {}", url);
    let result = tokio::task::spawn_blocking(move || edit::fetch_cover_url_to_temp(&url))
        .await
        .map_err(|e| format!("Task failed: {e}"))?;
    let (path, bytes) = result?;
    let b64 = B64.encode(&bytes);
    Ok((path, b64))
}

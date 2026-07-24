use crate::models::EditViewSongMetadata;
use crate::services::edit;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use log::{info, warn};
use std::fs;

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

#[tauri::command]
pub fn read_music_directory(directory: String) -> Result<Vec<EditViewSongMetadata>, String> {
    info!("dir: {}", directory);
    let mut songs: Vec<EditViewSongMetadata> = Vec::new();
    let mut id_num = 0u32;
    let paths = edit::collect_mp3_paths(&directory)?;
    for path in paths {
        id_num += 1;
        let file_name_str = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown.mp3")
            .to_string();
        let file_path = path.to_string_lossy().to_string();
        match edit::get_details_for_song(&file_path, id_num, &file_name_str) {
            Ok(single_song) => songs.push(single_song),
            Err(e) => {
                warn!("Skipping unreadable MP3 {}: {}", file_path, e);
            }
        }
    }
    Ok(songs)
}

#[tauri::command]
pub fn read_music_directory_paginated(
    directory: String,
    page_number: usize,
    page_size: usize,
) -> Result<Vec<EditViewSongMetadata>, String> {
    info!("dir: {}", directory);
    let mut songs: Vec<EditViewSongMetadata> = Vec::new();

    let paths = fs::read_dir(&directory)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    let mut mp3_paths: Vec<String> = Vec::new();
    let mut mp3_file_name: Vec<String> = Vec::new();

    for entry in paths {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                warn!("Skipping unreadable directory entry: {}", e);
                continue;
            }
        };
        let path = entry.path();
        if !path.is_file() || !edit::is_mp3_file(&path) {
            continue;
        }
        mp3_paths.push(path.to_string_lossy().to_string());
        mp3_file_name.push(entry.file_name().to_string_lossy().to_string());
    }

    let start_index = page_number * page_size;
    let end_index = std::cmp::min(start_index + page_size, mp3_paths.len());

    if start_index >= mp3_paths.len() {
        return Ok(songs);
    }

    for i in start_index..end_index {
        match edit::get_details_for_song(
            &mp3_paths[i],
            i.try_into().unwrap_or(0),
            &mp3_file_name[i],
        ) {
            Ok(single_song) => songs.push(single_song),
            Err(e) => {
                warn!("Skipping unreadable MP3 {}: {}", mp3_paths[i], e);
            }
        }
    }

    Ok(songs)
}

#[tauri::command]
pub async fn read_music_directory_multithreaded(
    directory: String,
) -> Result<Vec<EditViewSongMetadata>, String> {
    let directory_clone = directory.clone();
    let songs = tokio::task::spawn_blocking(move || {
        info!("dir: {}", directory_clone);
        let mut songs: Vec<EditViewSongMetadata> = Vec::new();
        let mut id_num = 0u32;
        let paths = fs::read_dir(&directory_clone)
            .map_err(|e| format!("Failed to read directory: {}", e))?;
        for entry in paths {
            let entry = match entry {
                Ok(e) => e,
                Err(e) => {
                    warn!("Skipping unreadable directory entry: {}", e);
                    continue;
                }
            };
            let path = entry.path();
            if !path.is_file() || !edit::is_mp3_file(&path) {
                continue;
            }
            id_num += 1;
            let file_name = entry.file_name();
            let file_name_str = file_name.to_string_lossy();
            let file_path = path.to_string_lossy().to_string();
            match edit::get_details_for_song(&file_path, id_num, &file_name_str) {
                Ok(single_song) => songs.push(single_song),
                Err(e) => {
                    warn!("Skipping unreadable MP3 {}: {}", file_path, e);
                }
            }
        }
        Ok::<Vec<EditViewSongMetadata>, String>(songs)
    })
    .await
    .map_err(|e| format!("Task failed: {:?}", e))??;
    Ok(songs)
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
        song.path = path;
    }

    match edit::edit_song_metadata(song, cover_image_path.as_deref()) {
        Ok(_) => (true, "Successfully Saved Song Details".to_owned()),
        Err(message) => (false, message),
    }
}

/// Embed album art from an image file path into an MP3 (bypasses base64 IPC).
#[tauri::command]
pub fn set_album_art(mp3_path: String, image_path: String) -> (bool, String) {
    info!("set_album_art mp3={} image={}", mp3_path, image_path);
    match edit::write_cover_art_from_path(&mp3_path, &image_path) {
        Ok(()) => (true, "Album art embedded".to_owned()),
        Err(message) => (false, message),
    }
}

/// Download a cover image URL to a temp file (avoids webview CORS).
#[tauri::command]
pub fn fetch_album_art_url(url: String) -> Result<(String, String), String> {
    info!("fetch_album_art_url {}", url);
    let (path, bytes) = edit::fetch_cover_url_to_temp(&url)?;
    let b64 = B64.encode(&bytes);
    Ok((path, b64))
}

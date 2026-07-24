//! Cross-cutting helpers (paths, shared string checks).

use std::path::{Path, PathBuf};

/// App data root: `~/.config/auto-mp3` (Windows: `%USERPROFILE%\.config\auto-mp3`).
pub fn get_auto_mp3_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".config")
        .join("auto-mp3")
}

pub fn get_settings_path() -> String {
    get_auto_mp3_dir()
        .join("settings.json")
        .to_string_lossy()
        .to_string()
}

pub fn normalize_artist_key(artist: &str) -> String {
    artist.trim().to_lowercase()
}

/// True when a tag string has a real value (not empty / "None").
pub fn is_filled(value: &str) -> bool {
    let t = value.trim();
    !t.is_empty() && t != "None"
}

pub fn is_mp3_file(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("mp3"))
        .unwrap_or(false)
}

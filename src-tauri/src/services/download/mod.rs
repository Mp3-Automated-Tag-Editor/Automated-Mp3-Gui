use encoding_rs::UTF_8;
use log::info;
use std::collections::HashMap;
use std::fs::{create_dir_all, File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::Command as StdCommand;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::api::process::{Command, CommandChild, CommandEvent};
use tauri::Runtime;

use crate::models::{DownloadBackend, DownloadFinished};

static DOWNLOAD_STOP: AtomicBool = AtomicBool::new(false);
lazy_static::lazy_static! {
    static ref ACTIVE_CHILD: Mutex<Option<CommandChild>> = Mutex::new(None);
}

#[derive(Debug, Clone)]
struct FailedDownload {
    artist: String,
    song: String,
    url: String,
    reason: String,
}

pub fn is_spotify_url(url: &str) -> bool {
    let u = url.trim().to_lowercase();
    u.contains("open.spotify.com") || u.starts_with("spotify:")
}

pub fn select_backend(url: &str) -> DownloadBackend {
    if is_spotify_url(url) {
        DownloadBackend::SpotDl
    } else {
        DownloadBackend::YtDlp
    }
}

pub fn ffmpeg_on_path() -> bool {
    StdCommand::new("ffmpeg")
        .arg("-version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn deno_on_path() -> bool {
    StdCommand::new("deno")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn sidecar_env() -> HashMap<String, String> {
    let mut env = HashMap::new();
    env.insert("PYTHONUTF8".into(), "1".into());
    env.insert("PYTHONIOENCODING".into(), "utf-8".into());
    env.insert("LANG".into(), "en_US.UTF-8".into());
    env.insert("LC_ALL".into(), "en_US.UTF-8".into());
    env.insert("NO_COLOR".into(), "1".into());
    env.insert("TERM".into(), "dumb".into());
    env.insert("FORCE_COLOR".into(), "0".into());
    env
}

fn configure_sidecar(cmd: Command) -> Command {
    cmd.envs(sidecar_env()).encoding(UTF_8)
}

fn ensure_spotdl_deno<R: Runtime>(window: &tauri::Window<R>) {
    if deno_on_path() {
        let _ = window.emit(
            "download_progress",
            "— Deno found on PATH".to_string(),
        );
        return;
    }

    let _ = window.emit(
        "download_progress",
        "— Deno not on PATH; running spotdl --download-deno (one-time)…".to_string(),
    );

    match Command::new_sidecar("spotdl") {
        Ok(cmd) => match configure_sidecar(cmd).args(["--download-deno"]).output() {
            Ok(output) => {
                for line in output.stdout.lines().chain(output.stderr.lines()) {
                    let t = line.trim();
                    if !t.is_empty() {
                        let _ = window.emit("download_progress", t.to_string());
                    }
                }
                if output.status.success() {
                    let _ = window.emit(
                        "download_progress",
                        "— Deno helper install finished".to_string(),
                    );
                } else {
                    let _ = window.emit(
                        "download_progress",
                        "— spotdl --download-deno did not succeed; install Deno system-wide if downloads keep failing".to_string(),
                    );
                }
            }
            Err(e) => {
                let _ = window.emit(
                    "download_progress",
                    format!("— Could not run spotdl --download-deno: {}", e),
                );
            }
        },
        Err(e) => {
            let _ = window.emit(
                "download_progress",
                format!("— spotdl sidecar missing for Deno setup: {}", e),
            );
        }
    }
}

fn bitrate_label(bitrate: u32) -> String {
    match bitrate {
        128 | 192 | 256 | 320 => format!("{}k", bitrate),
        _ => "320k".to_string(),
    }
}

fn ytdlp_audio_quality(bitrate: u32) -> String {
    match bitrate {
        128 => "128K".into(),
        192 => "192K".into(),
        256 => "256K".into(),
        320 => "320K".into(),
        _ => "192K".into(),
    }
}

fn looks_like_download_success(line: &str) -> bool {
    let l = line.to_lowercase();
    l.contains("downloaded \"") || l.starts_with("downloaded ")
}

fn split_artist_title(display: &str) -> (String, String) {
    let t = display.trim();
    if let Some((artist, title)) = t.split_once(" - ") {
        (artist.trim().to_string(), title.trim().to_string())
    } else if let Some((artist, title)) = t.split_once(" – ") {
        (artist.trim().to_string(), title.trim().to_string())
    } else {
        ("Unknown".to_string(), t.to_string())
    }
}

fn is_http_url(s: &str) -> bool {
    let u = s.trim().to_lowercase();
    u.starts_with("http://") || u.starts_with("https://")
}

/// Parse a spotDL / yt-dlp failure line into a structured record when possible.
fn parse_failure_line(line: &str) -> Option<FailedDownload> {
    let line = line.trim();
    if line.is_empty() {
        return None;
    }

    // spotDL save-errors / print-errors:
    // "https://open.spotify.com/track/... - LookupError: No results found for song: Artist - Title"
    if let Some((url_part, rest)) = line.split_once(" - ") {
        if is_http_url(url_part) {
            let reason = rest.trim().to_string();
            let (artist, song) = if let Some(idx) = reason.to_lowercase().find("song: ") {
                let display = reason[idx + "song: ".len()..].trim();
                split_artist_title(display)
            } else if let Some((_, display)) = reason.split_once(": ") {
                // Fallback: try "Error: Artist - Title" style
                if display.contains(" - ") {
                    split_artist_title(display)
                } else {
                    ("Unknown".into(), "Unknown".into())
                }
            } else {
                ("Unknown".into(), "Unknown".into())
            };
            return Some(FailedDownload {
                artist,
                song,
                url: url_part.trim().to_string(),
                reason,
            });
        }
    }

    // "LookupError: No results found for song: Artist - Title"
    let lower = line.to_lowercase();
    if lower.contains("no results found for song:") {
        if let Some(idx) = lower.find("song:") {
            let display = line[idx + "song:".len()..].trim();
            let (artist, song) = split_artist_title(display);
            return Some(FailedDownload {
                artist,
                song,
                url: String::new(),
                reason: line.to_string(),
            });
        }
    }

    // Generic AudioProviderError / ERROR without URL
    if lower.contains("audioprovidererror")
        || lower.starts_with("error:")
        || lower.contains("download error")
        || lower.contains("failed to download")
    {
        return Some(FailedDownload {
            artist: "Unknown".into(),
            song: "Unknown".into(),
            url: String::new(),
            reason: line.to_string(),
        });
    }

    None
}

fn failure_log_dir() -> PathBuf {
    // Same app data root as settings.json / Mp3data.db
    crate::util::get_auto_mp3_dir().join("download-logs")
}

fn new_failure_paths() -> Result<(PathBuf, PathBuf), String> {
    let dir = failure_log_dir();
    create_dir_all(&dir).map_err(|e| format!("Could not create download-logs folder: {}", e))?;
    let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S");
    let structured = dir.join(format!("failed-downloads-{}.txt", stamp));
    let spotdl_raw = dir.join(format!("spotdl-errors-{}.txt", stamp));
    Ok((structured, spotdl_raw))
}

fn format_failure_line(f: &FailedDownload) -> String {
    let url = if f.url.is_empty() {
        "(no link captured)"
    } else {
        f.url.as_str()
    };
    format!(
        "✗ FAILED | Artist: {} | Song: {} | Link: {} | Reason: {}",
        f.artist, f.song, url, f.reason
    )
}

fn write_structured_failure_log(
    path: &Path,
    source_url: &str,
    backend: &str,
    failures: &[FailedDownload],
) -> Result<(), String> {
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    writeln!(
        file,
        "# Failed downloads — {}",
        chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
    )
    .map_err(|e| e.to_string())?;
    writeln!(file, "# Backend: {}", backend).map_err(|e| e.to_string())?;
    writeln!(file, "# Source query: {}", source_url).map_err(|e| e.to_string())?;
    writeln!(file, "# Columns: Artist | Song | Link | Reason").map_err(|e| e.to_string())?;
    writeln!(file).map_err(|e| e.to_string())?;

    for f in failures {
        let url = if f.url.is_empty() {
            "(no link captured)"
        } else {
            f.url.as_str()
        };
        writeln!(
            file,
            "{} | {} | {} | {}",
            f.artist.replace('|', "/"),
            f.song.replace('|', "/"),
            url,
            f.reason.replace('\n', " ")
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Merge failures from spotDL's --save-errors file into our list (prefer URL-bearing rows).
fn ingest_spotdl_save_errors(path: &Path, failures: &mut Vec<FailedDownload>) {
    let Ok(file) = File::open(path) else {
        return;
    };
    let reader = BufReader::new(file);
    for line in reader.lines().flatten() {
        let t = line.trim();
        if t.is_empty() || t.chars().all(|c| c.is_ascii_digit() || c == '-') {
            // skip timestamp headers like 2026-07-22-19-30-00
            continue;
        }
        if let Some(f) = parse_failure_line(t) {
            // Prefer entries that include a URL
            if !f.url.is_empty() {
                if !failures.iter().any(|e| e.url == f.url && e.reason == f.reason) {
                    failures.push(f);
                }
            } else if !failures.iter().any(|e| {
                e.artist == f.artist && e.song == f.song && e.reason == f.reason
            }) {
                failures.push(f);
            }
        }
    }
}

fn append_jsonl_archive(failures: &[FailedDownload]) {
    if failures.is_empty() {
        return;
    }
    let dir = failure_log_dir();
    let _ = create_dir_all(&dir);
    let archive = dir.join("failed-downloads.jsonl");
    let Ok(mut file) = OpenOptions::new().create(true).append(true).open(archive) else {
        return;
    };
    let ts = chrono::Local::now().to_rfc3339();
    for f in failures {
        let _ = writeln!(
            file,
            r#"{{"timestamp":"{}","artist":"{}","song":"{}","url":"{}","reason":"{}"}}"#,
            ts,
            f.artist.replace('"', "'"),
            f.song.replace('"', "'"),
            f.url.replace('"', "'"),
            f.reason.replace('"', "'").replace('\n', " ")
        );
    }
}

pub fn stop_download() {
    DOWNLOAD_STOP.store(true, Ordering::Relaxed);
    if let Ok(mut guard) = ACTIVE_CHILD.lock() {
        if let Some(child) = guard.take() {
            let _ = child.kill();
        }
    }
}

pub async fn run_download<R: Runtime>(
    window: tauri::Window<R>,
    library_path: String,
    url: String,
    bitrate: u32,
) -> Result<(), String> {
    DOWNLOAD_STOP.store(false, Ordering::Relaxed);

    let lib = Path::new(&library_path);
    if !lib.is_dir() {
        return Err(format!("Library folder is not a directory: {}", library_path));
    }

    if !ffmpeg_on_path() {
        let msg = "ffmpeg not found on PATH. Install ffmpeg and restart the app.".to_string();
        let _ = window.emit("download_progress", msg.clone());
        let _ = window.emit(
            "download_finished",
            DownloadFinished {
                success: false,
                code: None,
                backend: "none".into(),
                message: msg.clone(),
                failed_count: 0,
                failure_log_path: None,
            },
        );
        return Err(msg);
    }

    ensure_spotdl_deno(&window);

    let backend = select_backend(&url);
    let backend_name = match backend {
        DownloadBackend::SpotDl => "spotdl",
        DownloadBackend::YtDlp => "yt-dlp",
    };

    let (structured_log_path, spotdl_errors_path) = new_failure_paths()?;

    let _ = window.emit(
        "download_progress",
        format!("— Using {} for this URL", backend_name),
    );
    let _ = window.emit(
        "download_progress",
        format!("— Output folder: {}", library_path),
    );
    let _ = window.emit(
        "download_progress",
        format!(
            "— Failure log (if any): {}",
            structured_log_path.display()
        ),
    );

    let (sidecar_name, args): (&str, Vec<String>) = match backend {
        DownloadBackend::SpotDl => {
            let out = library_path.trim_end_matches(['/', '\\']).to_string();
            (
                "spotdl",
                vec![
                    "download".into(),
                    url.clone(),
                    "--bitrate".into(),
                    bitrate_label(bitrate),
                    "--format".into(),
                    "mp3".into(),
                    "--output".into(),
                    out,
                    "--simple-tui".into(),
                    "--print-errors".into(),
                    "--save-errors".into(),
                    spotdl_errors_path.to_string_lossy().to_string(),
                    "--log-level".into(),
                    "INFO".into(),
                    "--restrict".into(),
                    "none".into(),
                ],
            )
        }
        DownloadBackend::YtDlp => {
            let template = Path::new(&library_path)
                .join("%(playlist_title|Untitled)s/%(title)s.%(ext)s")
                .to_string_lossy()
                .to_string();
            let template_flat = Path::new(&library_path)
                .join("%(title)s.%(ext)s")
                .to_string_lossy()
                .to_string();
            let out_template = if url.to_lowercase().contains("playlist")
                || url.to_lowercase().contains("list=")
            {
                template
            } else {
                template_flat
            };
            (
                "yt-dlp",
                vec![
                    "-x".into(),
                    "--audio-format".into(),
                    "mp3".into(),
                    "--audio-quality".into(),
                    ytdlp_audio_quality(bitrate),
                    "--no-mtime".into(),
                    "--embed-metadata".into(),
                    "--parse-metadata".into(),
                    "%(title)s:%(meta_title)s".into(),
                    "--parse-metadata".into(),
                    "%(uploader|Unknown Artist)s:%(meta_artist)s".into(),
                    "--parse-metadata".into(),
                    "%(playlist_title|)s:%(meta_album)s".into(),
                    "--parse-metadata".into(),
                    "webpage_url:%(meta_comment)s".into(),
                    "--replace-in-metadata".into(),
                    "artist".into(),
                    "^$".into(),
                    "Unknown Artist".into(),
                    "--replace-in-metadata".into(),
                    "album".into(),
                    "^$".into(),
                    "YouTube".into(),
                    "--replace-in-metadata".into(),
                    "genre".into(),
                    "^$".into(),
                    "YouTube".into(),
                    "-o".into(),
                    out_template,
                    url.clone(),
                ],
            )
        }
    };

    info!(
        "Starting download sidecar={} args={:?} bitrate={}",
        sidecar_name, args, bitrate
    );

    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let (mut rx, child) = configure_sidecar(
        Command::new_sidecar(sidecar_name)
            .map_err(|e| format!("Failed to resolve sidecar '{}': {}", sidecar_name, e))?,
    )
    .args(arg_refs)
    .spawn()
    .map_err(|e| format!("Failed to spawn '{}': {}", sidecar_name, e))?;

    {
        let mut guard = ACTIVE_CHILD.lock().map_err(|_| "download lock poisoned")?;
        *guard = Some(child);
    }

    let window_clone = window.clone();
    let backend_label = backend_name.to_string();
    let source_url = url.clone();
    let structured_log_path_clone = structured_log_path.clone();
    let spotdl_errors_path_clone = spotdl_errors_path.clone();

    tauri::async_runtime::spawn(async move {
        let mut exit_code: Option<i32> = None;
        let mut downloaded_count: u32 = 0;
        let mut failures: Vec<FailedDownload> = Vec::new();
        let mut last_http_url = String::new();

        let mut handle_line = |line: String, failures: &mut Vec<FailedDownload>| {
            let trimmed = line.trim().to_string();
            if trimmed.is_empty() {
                return;
            }

            if is_http_url(&trimmed) && !trimmed.contains(' ') {
                last_http_url = trimmed.clone();
            }

            if looks_like_download_success(&trimmed) {
                downloaded_count = downloaded_count.saturating_add(1);
                let _ = window_clone.emit("download_progress", trimmed);
                return;
            }

            if let Some(mut f) = parse_failure_line(&trimmed) {
                if f.url.is_empty() && !last_http_url.is_empty() {
                    f.url = last_http_url.clone();
                }
                let ui = format_failure_line(&f);
                let _ = window_clone.emit("download_progress", ui);
                // Avoid exact duplicates
                if !failures.iter().any(|e| {
                    e.url == f.url
                        && e.artist == f.artist
                        && e.song == f.song
                        && e.reason == f.reason
                }) {
                    failures.push(f);
                }
                return;
            }

            let _ = window_clone.emit("download_progress", trimmed);
        };

        while let Some(event) = rx.recv().await {
            if DOWNLOAD_STOP.load(Ordering::Relaxed) {
                break;
            }
            match event {
                CommandEvent::Stdout(line) => handle_line(line, &mut failures),
                CommandEvent::Stderr(line) => handle_line(line, &mut failures),
                CommandEvent::Terminated(payload) => {
                    exit_code = payload.code;
                    break;
                }
                CommandEvent::Error(err) => {
                    if err.to_lowercase().contains("utf-8") {
                        let _ = window_clone.emit(
                            "download_progress",
                            "— Skipped a non-UTF-8 log line".to_string(),
                        );
                    } else {
                        let _ = window_clone.emit("download_progress", format!("✗ {}", err));
                    }
                }
                _ => {}
            }
        }

        {
            if let Ok(mut guard) = ACTIVE_CHILD.lock() {
                *guard = None;
            }
        }

        // Pull URL-rich failures from spotDL's native error file
        if spotdl_errors_path_clone.exists() {
            ingest_spotdl_save_errors(&spotdl_errors_path_clone, &mut failures);
            let _ = window_clone.emit(
                "download_progress",
                format!(
                    "— spotDL raw error dump: {}",
                    spotdl_errors_path_clone.display()
                ),
            );
        }

        let failed_count = failures.len() as u32;
        let mut failure_log_path: Option<String> = None;

        if !failures.is_empty() {
            // Re-emit a clear summary block in the UI logs
            let _ = window_clone.emit(
                "download_progress",
                format!("— —— Failed downloads ({}) ——", failed_count),
            );
            for f in &failures {
                let _ = window_clone.emit("download_progress", format_failure_line(f));
            }

            match write_structured_failure_log(
                &structured_log_path_clone,
                &source_url,
                &backend_label,
                &failures,
            ) {
                Ok(()) => {
                    failure_log_path =
                        Some(structured_log_path_clone.to_string_lossy().to_string());
                    let _ = window_clone.emit(
                        "download_progress",
                        format!(
                            "— Wrote failure log: {}",
                            structured_log_path_clone.display()
                        ),
                    );
                    append_jsonl_archive(&failures);
                }
                Err(e) => {
                    let _ = window_clone.emit(
                        "download_progress",
                        format!("— Could not write failure log: {}", e),
                    );
                }
            }
        }

        let stopped = DOWNLOAD_STOP.load(Ordering::Relaxed);
        let success = !stopped && (exit_code == Some(0) || downloaded_count > 0);
        let message = if stopped {
            "Download stopped.".to_string()
        } else if exit_code == Some(0) && failed_count == 0 {
            if downloaded_count > 0 {
                format!(
                    "Download finished successfully ({} track(s)).",
                    downloaded_count
                )
            } else {
                "Download finished successfully.".to_string()
            }
        } else if downloaded_count > 0 {
            format!(
                "Finished — {} downloaded, {} failed. See failure log for links.",
                downloaded_count, failed_count
            )
        } else {
            format!(
                "Download exited with code {:?} ({} failed).",
                exit_code.unwrap_or(-1),
                failed_count
            )
        };

        let _ = window_clone.emit("download_progress", format!("— {}", message));
        let _ = window_clone.emit(
            "download_finished",
            DownloadFinished {
                success,
                code: exit_code,
                backend: backend_label,
                message,
                failed_count,
                failure_log_path,
            },
        );
    });

    Ok(())
}

pub async fn check_download_deps() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "ffmpeg": ffmpeg_on_path(),
        "deno": deno_on_path(),
        "note": "yt-dlp and spotdl are bundled sidecars; ffmpeg must be on PATH. Deno is recommended for some YouTube downloads (spotdl --download-deno)."
    }))
}

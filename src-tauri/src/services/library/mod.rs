//! SQLite-backed library index with disk cover thumbnails and background scans.

use log::{info, warn};
use rayon::prelude::*;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Window;

use crate::constants::library as lib_const;
use crate::models::EditViewSongMetadata;
use crate::repository;
use crate::services::edit;
use crate::util::{get_auto_mp3_dir, is_mp3_file};

static SCAN_CANCEL: AtomicBool = AtomicBool::new(false);
static SCAN_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryScanProgress {
    pub directory: String,
    pub done: usize,
    pub total: usize,
    pub phase: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryScanDone {
    pub directory: String,
    pub track_count: usize,
    pub updated: usize,
    pub removed: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTracksBatch {
    pub directory: String,
    pub tracks: Vec<EditViewSongMetadata>,
}

pub(crate) struct FileFingerprint {
    mtime_ms: i64,
    size: i64,
}

pub fn covers_dir() -> PathBuf {
    get_auto_mp3_dir().join(lib_const::COVERS_DIR)
}

pub fn ensure_schema() -> Result<(), String> {
    let conn = open_db()?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS library_tracks (
            path TEXT PRIMARY KEY NOT NULL,
            directory TEXT NOT NULL,
            file_name TEXT NOT NULL,
            id TEXT NOT NULL,
            artist TEXT NOT NULL DEFAULT 'None',
            title TEXT NOT NULL DEFAULT 'None',
            album TEXT NOT NULL DEFAULT 'None',
            year INTEGER NOT NULL DEFAULT 0,
            track INTEGER NOT NULL DEFAULT 0,
            genre TEXT NOT NULL DEFAULT 'None',
            comments TEXT NOT NULL DEFAULT 'None',
            album_artist TEXT NOT NULL DEFAULT 'None',
            composer TEXT NOT NULL DEFAULT 'None',
            discno INTEGER NOT NULL DEFAULT 0,
            cover_thumb_path TEXT NOT NULL DEFAULT '',
            has_cover INTEGER NOT NULL DEFAULT 0,
            percentage INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'UNSAVED',
            session_name TEXT NOT NULL DEFAULT 'None',
            mtime_ms INTEGER NOT NULL DEFAULT 0,
            size INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_library_tracks_directory
            ON library_tracks(directory);",
    )
    .map_err(|e| format!("Failed to create library_tracks: {e}"))?;
    let _ = fs::create_dir_all(covers_dir());
    Ok(())
}

fn open_db() -> Result<Connection, String> {
    Connection::open(repository::get_db_path())
        .map_err(|e| format!("Failed to open database: {e}"))
}

fn path_hash(path: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn thumb_path_for(mp3_path: &str) -> PathBuf {
    covers_dir().join(format!("{}.jpg", path_hash(mp3_path)))
}

pub fn file_fingerprint(path: &Path) -> Result<FileFingerprint, String> {
    let meta = fs::metadata(path).map_err(|e| format!("stat failed: {e}"))?;
    let size = meta.len() as i64;
    let mtime_ms = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    Ok(FileFingerprint { mtime_ms, size })
}

/// Write a small JPEG thumb from raw cover bytes. Returns absolute path or empty.
pub fn write_cover_thumb(mp3_path: &str, cover_bytes: &[u8]) -> Result<String, String> {
    if cover_bytes.is_empty() {
        return Ok(String::new());
    }
    let dir = covers_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("covers dir: {e}"))?;
    let dest = thumb_path_for(mp3_path);

    let img = image::load_from_memory(cover_bytes)
        .map_err(|e| format!("decode cover: {e}"))?;
    let mut rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let max_edge = lib_const::THUMB_MAX_EDGE;
    if w > max_edge || h > max_edge {
        let scale = (max_edge as f32) / (w.max(h) as f32);
        let nw = ((w as f32) * scale).round().max(1.0) as u32;
        let nh = ((h as f32) * scale).round().max(1.0) as u32;
        rgb = image::imageops::resize(&rgb, nw, nh, image::imageops::FilterType::Triangle);
    }
    let mut out = std::io::Cursor::new(Vec::new());
    let mut encoder =
        image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, lib_const::THUMB_JPEG_QUALITY);
    encoder
        .encode(
            rgb.as_raw(),
            rgb.width(),
            rgb.height(),
            image::ColorType::Rgb8,
        )
        .map_err(|e| format!("thumb jpeg: {e}"))?;
    fs::write(&dest, out.into_inner()).map_err(|e| format!("write thumb: {e}"))?;
    Ok(dest.to_string_lossy().to_string())
}

pub fn remove_cover_thumb(mp3_path: &str) {
    let p = thumb_path_for(mp3_path);
    let _ = fs::remove_file(p);
}

fn row_to_song(row: &rusqlite::Row<'_>) -> rusqlite::Result<EditViewSongMetadata> {
    let cover_thumb: String = row.get(14)?;
    let has_cover: i64 = row.get(15)?;
    // List payload: thumb path in image_src (FE uses convertFileSrc). Empty if no cover.
    let image_src = if has_cover != 0 && !cover_thumb.is_empty() {
        cover_thumb
    } else {
        String::new()
    };
    Ok(EditViewSongMetadata {
        id: row.get(3)?,
        file: row.get(2)?,
        artist: row.get(4)?,
        title: row.get(5)?,
        album: row.get(6)?,
        path: row.get(0)?,
        year: row.get::<_, i64>(7)? as u32,
        track: row.get::<_, i64>(8)? as u32,
        genre: row.get(9)?,
        comments: row.get(10)?,
        album_artist: row.get(11)?,
        composer: row.get(12)?,
        discno: row.get::<_, i64>(13)? as u32,
        image_src,
        percentage: row.get::<_, i64>(16)? as u32,
        status: row.get(17)?,
        session_name: row.get(18)?,
    })
}

const SELECT_COLS: &str = "path, directory, file_name, id, artist, title, album, year, track,
    genre, comments, album_artist, composer, discno, cover_thumb_path, has_cover,
    percentage, status, session_name, mtime_ms, size";

pub fn query_by_directory(directory: &str) -> Result<Vec<EditViewSongMetadata>, String> {
    ensure_schema()?;
    let conn = open_db()?;
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM library_tracks WHERE directory = ?1 ORDER BY path"
        ))
        .map_err(|e| format!("prepare: {e}"))?;
    let rows = stmt
        .query_map(params![directory], row_to_song)
        .map_err(|e| format!("query: {e}"))?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(out)
}

pub fn get_cached_track(path: &str) -> Result<Option<EditViewSongMetadata>, String> {
    ensure_schema()?;
    let conn = open_db()?;
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {SELECT_COLS} FROM library_tracks WHERE path = ?1"
        ))
        .map_err(|e| format!("prepare: {e}"))?;
    stmt.query_row(params![path], row_to_song)
        .optional()
        .map_err(|e| format!("query: {e}"))
}

fn load_fingerprints(directory: &str) -> Result<HashMap<String, FileFingerprint>, String> {
    let conn = open_db()?;
    let mut stmt = conn
        .prepare("SELECT path, mtime_ms, size FROM library_tracks WHERE directory = ?1")
        .map_err(|e| format!("prepare: {e}"))?;
    let rows = stmt
        .query_map(params![directory], |row| {
            Ok((
                row.get::<_, String>(0)?,
                FileFingerprint {
                    mtime_ms: row.get(1)?,
                    size: row.get(2)?,
                },
            ))
        })
        .map_err(|e| format!("query: {e}"))?;
    let mut map = HashMap::new();
    for row in rows {
        let (path, fp) = row.map_err(|e| format!("row: {e}"))?;
        map.insert(path, fp);
    }
    Ok(map)
}

pub fn upsert_track(
    directory: &str,
    song: &EditViewSongMetadata,
    fp: &FileFingerprint,
    cover_thumb_path: &str,
    has_cover: bool,
) -> Result<(), String> {
    ensure_schema()?;
    let conn = open_db()?;
    conn.execute(
        "INSERT INTO library_tracks (
            path, directory, file_name, id, artist, title, album, year, track,
            genre, comments, album_artist, composer, discno, cover_thumb_path,
            has_cover, percentage, status, session_name, mtime_ms, size
        ) VALUES (
            ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21
        )
        ON CONFLICT(path) DO UPDATE SET
            directory=excluded.directory,
            file_name=excluded.file_name,
            id=excluded.id,
            artist=excluded.artist,
            title=excluded.title,
            album=excluded.album,
            year=excluded.year,
            track=excluded.track,
            genre=excluded.genre,
            comments=excluded.comments,
            album_artist=excluded.album_artist,
            composer=excluded.composer,
            discno=excluded.discno,
            cover_thumb_path=excluded.cover_thumb_path,
            has_cover=excluded.has_cover,
            percentage=excluded.percentage,
            status=excluded.status,
            session_name=excluded.session_name,
            mtime_ms=excluded.mtime_ms,
            size=excluded.size",
        params![
            song.path,
            directory,
            song.file,
            song.id,
            song.artist,
            song.title,
            song.album,
            song.year as i64,
            song.track as i64,
            song.genre,
            song.comments,
            song.album_artist,
            song.composer,
            song.discno as i64,
            cover_thumb_path,
            if has_cover { 1i64 } else { 0i64 },
            song.percentage as i64,
            song.status,
            song.session_name,
            fp.mtime_ms,
            fp.size,
        ],
    )
    .map_err(|e| format!("upsert failed: {e}"))?;
    Ok(())
}

pub fn delete_paths(paths: &[String]) -> Result<(), String> {
    if paths.is_empty() {
        return Ok(());
    }
    ensure_schema()?;
    let conn = open_db()?;
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("tx: {e}"))?;
    for path in paths {
        remove_cover_thumb(path);
        tx.execute("DELETE FROM library_tracks WHERE path = ?1", params![path])
            .map_err(|e| format!("delete: {e}"))?;
    }
    tx.commit().map_err(|e| format!("commit: {e}"))?;
    Ok(())
}

/// Re-index a single file after save / cover change.
pub fn refresh_track(path: &str, directory: Option<&str>) -> Result<EditViewSongMetadata, String> {
    ensure_schema()?;
    let p = Path::new(path);
    if !p.is_file() || !is_mp3_file(p) {
        return Err(format!("Not a readable MP3: {path}"));
    }
    let file_name = p
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown.mp3")
        .to_string();
    let fp = file_fingerprint(p)?;
    let (mut song, cover_bytes) = edit::read_song_metadata(path, 0, &file_name)?;
    let has_cover = !cover_bytes.is_empty();
    let thumb = if has_cover {
        match write_cover_thumb(path, &cover_bytes) {
            Ok(t) => t,
            Err(e) => {
                warn!("thumb write failed for {path}: {e}");
                String::new()
            }
        }
    } else {
        remove_cover_thumb(path);
        String::new()
    };
    // Percentage should count cover presence even when image_src is a path
    song.image_src = if has_cover {
        if thumb.is_empty() {
            "has_cover".to_string()
        } else {
            thumb.clone()
        }
    } else {
        String::new()
    };
    song.percentage = edit::metadata_completion_percentage(&song);
    // Store thumb path (or empty) for list IPC
    let list_image = thumb.clone();
    song.image_src = list_image.clone();

    let dir = directory
        .map(|s| s.to_string())
        .or_else(|| {
            get_cached_track(path)
                .ok()
                .flatten()
                .and_then(|_| {
                    // Fall back to parent folder as library root guess
                    p.parent()
                        .map(|parent| parent.to_string_lossy().to_string())
                })
        })
        .unwrap_or_else(|| {
            p.parent()
                .map(|parent| parent.to_string_lossy().to_string())
                .unwrap_or_default()
        });

    // Prefer existing directory from DB if present
    let dir = {
        let conn = open_db()?;
        conn.query_row(
            "SELECT directory FROM library_tracks WHERE path = ?1",
            params![path],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or(dir)
    };

    upsert_track(&dir, &song, &fp, &list_image, has_cover && !list_image.is_empty())?;
    song.image_src = list_image;
    Ok(song)
}

fn emit_progress(window: &Window, directory: &str, done: usize, total: usize, phase: &str) {
    let _ = window.emit(
        "library_scan_progress",
        LibraryScanProgress {
            directory: directory.to_string(),
            done,
            total,
            phase: phase.to_string(),
        },
    );
}

fn emit_batch(window: &Window, directory: &str, tracks: Vec<EditViewSongMetadata>) {
    if tracks.is_empty() {
        return;
    }
    let _ = window.emit(
        "library_tracks_batch",
        LibraryTracksBatch {
            directory: directory.to_string(),
            tracks,
        },
    );
}

/// Background (or sync) directory scan: only re-read new/stale files.
pub fn scan_directory(window: &Window, directory: &str) -> Result<(), String> {
    if SCAN_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        info!("library scan already running; skipping");
        return Ok(());
    }
    SCAN_CANCEL.store(false, Ordering::SeqCst);
    let result = scan_directory_inner(window, directory);
    SCAN_RUNNING.store(false, Ordering::SeqCst);
    result
}

fn scan_directory_inner(window: &Window, directory: &str) -> Result<(), String> {
    ensure_schema()?;
    emit_progress(window, directory, 0, 0, "discover");

    let paths = edit::collect_mp3_paths(directory)?;
    let total = paths.len();
    emit_progress(window, directory, 0, total, "compare");

    let existing = load_fingerprints(directory)?;
    let disk_set: HashSet<String> = paths
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    let removed: Vec<String> = existing
        .keys()
        .filter(|p| !disk_set.contains(*p))
        .cloned()
        .collect();
    let removed_count = removed.len();
    delete_paths(&removed)?;

    let mut to_read: Vec<(PathBuf, u32)> = Vec::new();
    for (idx, path) in paths.iter().enumerate() {
        let path_str = path.to_string_lossy().to_string();
        let needs = match file_fingerprint(path) {
            Ok(fp) => match existing.get(&path_str) {
                Some(old) => old.mtime_ms != fp.mtime_ms || old.size != fp.size,
                None => true,
            },
            Err(_) => true,
        };
        if needs {
            to_read.push((path.clone(), (idx as u32).saturating_add(1)));
        }
    }

    info!(
        "library scan {}: {} on disk, {} to read, {} removed",
        directory,
        total,
        to_read.len(),
        removed_count
    );

    let updated = AtomicUsize::new(0);
    let batch_buf: Mutex<Vec<EditViewSongMetadata>> = Mutex::new(Vec::new());
    let dir_owned = directory.to_string();

    to_read.par_iter().for_each(|(path, id_num)| {
        if SCAN_CANCEL.load(Ordering::Relaxed) {
            return;
        }
        let path_str = path.to_string_lossy().to_string();
        let file_name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown.mp3")
            .to_string();
        let fp = match file_fingerprint(path) {
            Ok(fp) => fp,
            Err(e) => {
                warn!("skip {path_str}: {e}");
                return;
            }
        };
        let (mut song, cover_bytes) = match edit::read_song_metadata(&path_str, *id_num, &file_name)
        {
            Ok(v) => v,
            Err(e) => {
                warn!("skip unreadable {path_str}: {e}");
                return;
            }
        };
        let has_cover = !cover_bytes.is_empty();
        let thumb = if has_cover {
            write_cover_thumb(&path_str, &cover_bytes).unwrap_or_default()
        } else {
            remove_cover_thumb(&path_str);
            String::new()
        };
        song.image_src = if has_cover && thumb.is_empty() {
            "has_cover".to_string()
        } else {
            thumb.clone()
        };
        song.percentage = edit::metadata_completion_percentage(&song);
        song.image_src = thumb.clone();

        if let Err(e) = upsert_track(
            &dir_owned,
            &song,
            &fp,
            &thumb,
            has_cover && !thumb.is_empty(),
        ) {
            warn!("upsert {path_str}: {e}");
            return;
        }

        let n = updated.fetch_add(1, Ordering::Relaxed) + 1;
        let mut guard = batch_buf.lock().unwrap();
        guard.push(song);
        if guard.len() >= lib_const::SCAN_PROGRESS_EVERY {
            let batch = std::mem::take(&mut *guard);
            drop(guard);
            emit_batch(window, &dir_owned, batch);
            emit_progress(window, &dir_owned, n.min(total), total, "indexing");
        }
    });

    let leftover = batch_buf.lock().unwrap().drain(..).collect::<Vec<_>>();
    emit_batch(window, directory, leftover);

    let updated_count = updated.load(Ordering::Relaxed);
    let final_tracks = query_by_directory(directory)?;
    let _ = window.emit(
        "library_scan_done",
        LibraryScanDone {
            directory: directory.to_string(),
            track_count: final_tracks.len(),
            updated: updated_count,
            removed: removed_count,
        },
    );
    // Push full snapshot so FE can reconcile deletions
    emit_batch(window, directory, final_tracks.clone());
    emit_progress(window, directory, total, total, "done");

    // Orphan thumb cleanup for removed paths already handled in delete_paths
    let _ = SystemTime::now();
    Ok(())
}

pub fn cancel_scan() {
    SCAN_CANCEL.store(true, Ordering::SeqCst);
}

pub fn is_scanning() -> bool {
    SCAN_RUNNING.load(Ordering::SeqCst)
}

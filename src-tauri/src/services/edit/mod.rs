use base64::{engine::general_purpose::STANDARD, Engine as _};
use id3::frame::Frame;
use id3::{Encoding, TagLike, Version};
use lofty::file::TaggedFileExt;
use lofty::probe::Probe;
use lofty::tag::{Accessor, ItemKey};
use log::{info, warn};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::models::{self, EditViewSongMetadata};
use crate::util;

fn parse_u32_field(value: Option<&str>, default: u32) -> u32 {
    value
        .unwrap_or("")
        .trim()
        .parse::<u32>()
        .unwrap_or(default)
}

fn is_filled_str(value: &str) -> bool {
    let t = value.trim();
    !t.is_empty() && t != "None"
}

/// Map the ID3 Description field (historically session name) to UI status.
fn status_from_description(session: &str) -> String {
    let s = session.trim();
    if s.is_empty() || s == "None" {
        "UNSAVED".to_string()
    } else if s.eq_ignore_ascii_case("SAVED") {
        "SAVED".to_string()
    } else {
        // Legacy scrape-session markers
        "EDIT".to_string()
    }
}

/// Equal-weight completeness across all Edit-sheet fields.
pub fn metadata_completion_percentage(song: &EditViewSongMetadata) -> u32 {
    let checks = [
        is_filled_str(&song.title),
        is_filled_str(&song.artist),
        is_filled_str(&song.album),
        song.year > 0,
        song.track > 0,
        is_filled_str(&song.genre),
        is_filled_str(&song.album_artist),
        is_filled_str(&song.composer),
        is_filled_str(&song.comments),
        !song.image_src.trim().is_empty(),
    ];
    let filled = checks.iter().filter(|&&c| c).count();
    ((filled as f32 / checks.len() as f32) * 100.0).round() as u32
}

pub fn is_mp3_file(path: &Path) -> bool {
    util::is_mp3_file(path)
}

/// Recursively collect MP3 file paths under `directory`.
pub fn collect_mp3_paths(directory: &str) -> Result<Vec<PathBuf>, String> {
    let root = Path::new(directory);
    if !root.is_dir() {
        return Err(format!("Not a directory: {}", directory));
    }
    let mut paths = Vec::new();
    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() && is_mp3_file(path) {
            paths.push(path.to_path_buf());
        }
    }
    paths.sort();
    Ok(paths)
}

/// Read tags + raw cover bytes (no base64). Used by the library index.
pub fn read_song_metadata(
    complete_path: &str,
    id: u32,
    file_name: &str,
) -> Result<(models::EditViewSongMetadata, Vec<u8>), String> {
    let path = Path::new(complete_path);

    if !path.is_file() {
        return Err(format!("Path is not a file: {}", complete_path));
    }

    if !is_mp3_file(path) {
        return Err(format!("Not an MP3 file: {}", complete_path));
    }

    let tagged_file = Probe::open(path)
        .map_err(|e| format!("Bad path provided ({}): {}", complete_path, e))?
        .read()
        .map_err(|e| format!("Failed to read file ({}): {}", complete_path, e))?;

    let tag = match tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
        Some(tag) => tag,
        None => {
            let mut song = EditViewSongMetadata {
                id: id.to_string(),
                file: file_name.to_string(),
                path: complete_path.to_string(),
                artist: "None".to_string(),
                title: Path::new(file_name)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(file_name)
                    .to_string(),
                album: "None".to_string(),
                year: 0,
                track: 0,
                genre: "None".to_string(),
                comments: "None".to_string(),
                album_artist: "None".to_string(),
                composer: "None".to_string(),
                discno: 0,
                image_src: String::new(),
                percentage: 0,
                status: "UNSAVED".to_string(),
                session_name: "None".to_string(),
            };
            song.percentage = metadata_completion_percentage(&song);
            return Ok((song, Vec::new()));
        }
    };

    let cover_bytes: Vec<u8> = tag
        .pictures()
        .get(0)
        .map(|p| p.data().to_vec())
        .or_else(|| {
            id3::Tag::read_from_path(path)
                .ok()
                .and_then(|t| t.pictures().next().map(|p| p.data.clone()))
        })
        .unwrap_or_default();

    let session = tag
        .get_string(&ItemKey::TrackSubtitle)
        .or_else(|| tag.get_string(&ItemKey::Description))
        .unwrap_or("None")
        .to_string();
    // Fallback: COMM with description "Description" (written by save path)
    let session = if session == "None" || session.is_empty() {
        id3::Tag::read_from_path(path)
            .ok()
            .and_then(|t| {
                t.comments()
                    .find(|c| c.description == "Description")
                    .map(|c| c.text.clone())
            })
            .unwrap_or(session)
    } else {
        session
    };

    let mut song = EditViewSongMetadata {
        id: id.to_string(),
        file: file_name.to_string(),
        path: complete_path.to_string(),
        artist: tag.artist().as_deref().unwrap_or("None").to_string(),
        title: tag.title().as_deref().unwrap_or("None").to_string(),
        album: tag.album().as_deref().unwrap_or("None").to_string(),
        year: tag.year().unwrap_or(0),
        track: parse_u32_field(tag.get_string(&ItemKey::TrackNumber), 0),
        genre: tag
            .get_string(&ItemKey::Genre)
            .unwrap_or("None")
            .to_string(),
        comments: tag
            .get_string(&ItemKey::Comment)
            .unwrap_or("None")
            .to_string(),
        album_artist: tag
            .get_string(&ItemKey::AlbumArtist)
            .unwrap_or("None")
            .to_string(),
        composer: tag
            .get_string(&ItemKey::Composer)
            .unwrap_or("None")
            .to_string(),
        discno: parse_u32_field(tag.get_string(&ItemKey::DiscNumber), 0),
        // Placeholder so percentage counts cover; caller replaces with thumb path / base64
        image_src: if cover_bytes.is_empty() {
            String::new()
        } else {
            "has_cover".to_string()
        },
        percentage: 0,
        status: status_from_description(&session),
        session_name: session,
    };
    song.percentage = metadata_completion_percentage(&song);

    Ok((song, cover_bytes))
}

/// Legacy helper: full base64 cover in `image_src` (prefer library index + thumbs).
#[allow(dead_code)]
pub fn get_details_for_song(
    complete_path: &str,
    id: u32,
    file_name: &str,
) -> Result<models::EditViewSongMetadata, String> {
    let (mut song, cover_bytes) = read_song_metadata(complete_path, id, file_name)?;
    song.image_src = if cover_bytes.is_empty() {
        String::new()
    } else {
        STANDARD.encode(&cover_bytes)
    };
    Ok(song)
}

/// Full cover as base64 for Edit detail panes (on demand).
pub fn get_cover_base64(complete_path: &str) -> Result<String, String> {
    let path = Path::new(complete_path);
    if !path.is_file() || !is_mp3_file(path) {
        return Err(format!("Not a readable MP3: {}", complete_path));
    }
    let tagged_file = Probe::open(path)
        .map_err(|e| format!("Bad path: {e}"))?
        .read()
        .map_err(|e| format!("Read failed: {e}"))?;
    if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
        if let Some(pic) = tag.pictures().get(0) {
            return Ok(STANDARD.encode(pic.data()));
        }
    }
    Ok(id3::Tag::read_from_path(path)
        .ok()
        .and_then(|t| t.pictures().next().map(|p| STANDARD.encode(&p.data)))
        .unwrap_or_default())
}

fn strip_data_url_base64(raw: &str) -> &str {
    let trimmed = raw.trim();
    if let Some(idx) = trimmed.find("base64,") {
        &trimmed[idx + "base64,".len()..]
    } else {
        trimmed
    }
}

/// Mp3Tag-compatible cover: JPEG, front cover, empty description, max ~1000px.
/// Windows Explorer / WMP / many players ignore ID3v2.4 APIC; JPEG+v2.3 is the
/// widely recommended combo (Mp3Tag default write: ID3v2.3).
fn normalize_cover_jpeg(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let is_jpeg = bytes.len() >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff;
    let img = match image::load_from_memory(bytes) {
        Ok(img) => img,
        Err(e) if is_jpeg => {
            // Some JPEGs decode poorly; Mp3Tag would still embed the raw bytes.
            warn!("Could not re-encode JPEG ({e}); embedding original bytes");
            return Ok(bytes.to_vec());
        }
        Err(e) => return Err(format!("Could not decode cover image: {e}")),
    };
    let mut rgb = img.to_rgb8();
    let (w, h) = rgb.dimensions();
    let max_edge = 1000u32;
    if w > max_edge || h > max_edge {
        let scale = (max_edge as f32) / (w.max(h) as f32);
        let nw = ((w as f32) * scale).round().max(1.0) as u32;
        let nh = ((h as f32) * scale).round().max(1.0) as u32;
        rgb = image::imageops::resize(&rgb, nw, nh, image::imageops::FilterType::Lanczos3);
    }
    let mut out = std::io::Cursor::new(Vec::new());
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 85);
    encoder
        .encode(
            rgb.as_raw(),
            rgb.width(),
            rgb.height(),
            image::ColorType::Rgb8,
        )
        .map_err(|e| format!("JPEG encode failed: {}", e))?;
    Ok(out.into_inner())
}

fn attach_front_cover(tag: &mut id3::Tag, image_bytes: &[u8]) -> Result<Vec<u8>, String> {
    let jpeg = normalize_cover_jpeg(image_bytes)?;
    tag.remove_all_pictures();
    // eyeD3 / Mp3Tag-style: FRONT_COVER, empty description, image/jpeg.
    // Latin1 encoding is required: rust-id3 defaults ID3v2.3 frames to UTF-16,
    // and Mac Finder/Music skip APIC when the empty description is UTF-16 (BOM+null).
    let frame = Frame::from(id3::frame::Picture {
        mime_type: "image/jpeg".to_string(),
        picture_type: id3::frame::PictureType::CoverFront,
        description: String::new(),
        data: jpeg.clone(),
    })
    .set_encoding(Some(Encoding::Latin1));
    tag.add_frame(frame);
    Ok(jpeg)
}

/// Write like Mp3Tag's recommended MPEG settings: ID3v2.3 only (not 2.4).
/// Also strip any trailing ID3v1 — Music/iTunes often mishandle dual v1+v2 tags.
fn write_tag_mp3tag_style(path: &Path, tag: &id3::Tag) -> Result<(), String> {
    tag.write_to_path(path, Version::Id3v23)
        .map_err(|e| format!("Failed to write ID3v2.3 tag: {}", e))?;
    // Best-effort: ignore errors if no v1 tag exists.
    let _ = id3::v1::Tag::remove_from_path(path);
    Ok(())
}

/// Persist metadata + optional cover art (Mp3Tag-compatible: ID3v2.3 + JPEG APIC).
pub fn edit_song_metadata(
    song: EditViewSongMetadata,
    cover_image_path: Option<&str>,
) -> Result<(), String> {
    let path = Path::new(&song.path);

    if !path.is_file() {
        return Err("ERROR: Path is not a file!".to_string());
    }
    if !is_mp3_file(path) {
        return Err("ERROR: Album art writing is only supported for MP3 files.".to_string());
    }

    let mut tag = match id3::Tag::read_from_path(path) {
        Ok(t) => t,
        Err(e) => {
            warn!(
                "No existing ID3 tag on {} ({}); creating a new one",
                song.path, e
            );
            id3::Tag::new()
        }
    };

    tag.set_artist(&song.artist);
    tag.set_title(&song.title);
    tag.set_album(&song.album);
    if song.year > 0 {
        tag.set_year(song.year as i32);
    }
    if song.track > 0 {
        tag.set_track(song.track);
    }
    if song.discno > 0 {
        tag.set_disc(song.discno);
    }
    if is_filled_str(&song.genre) {
        tag.set_genre(&song.genre);
    }
    if is_filled_str(&song.album_artist) {
        tag.set_album_artist(&song.album_artist);
    }
    if is_filled_str(&song.composer) {
        tag.set_text("TCOM", &song.composer);
    }

    tag.remove_comment(Some(""), None);
    if is_filled_str(&song.comments) {
        tag.add_frame(id3::frame::Comment {
            lang: "eng".to_string(),
            description: String::new(),
            text: song.comments.clone(),
        });
    }

    tag.set_text("TIT3", "SAVED");
    tag.remove_comment(Some("Description"), None);
    tag.add_frame(id3::frame::Comment {
        lang: "eng".to_string(),
        description: "Description".to_string(),
        text: "SAVED".to_string(),
    });

    let mut sidecar_jpeg: Option<Vec<u8>> = None;

    // 1) Disk path (preferred — same as Mp3Tag "import cover from file")
    if let Some(cover_path) = cover_image_path {
        if !cover_path.is_empty() {
            let image_data = std::fs::read(cover_path)
                .map_err(|e| format!("Could not read cover '{}': {}", cover_path, e))?;
            if image_data.is_empty() {
                return Err("Cover image file is empty".to_string());
            }
            info!(
                "[UpdateImage] import cover from file ({} bytes) ← {}",
                image_data.len(),
                cover_path
            );
            sidecar_jpeg = Some(attach_front_cover(&mut tag, &image_data)?);
        }
    }

    // 2) Fallback: base64 in song.image_src
    if sidecar_jpeg.is_none() {
        let image_raw = strip_data_url_base64(&song.image_src);
        if !image_raw.is_empty() {
            let image_data: Vec<u8> = STANDARD
                .decode(image_raw)
                .map_err(|e| format!("Invalid album art base64: {}", e))?;
            if image_data.is_empty() {
                return Err("Album art payload decoded to empty bytes".to_string());
            }
            info!(
                "[UpdateImage] import cover from base64 ({} bytes)",
                image_data.len()
            );
            sidecar_jpeg = Some(attach_front_cover(&mut tag, &image_data)?);
        } else {
            warn!(
                "[UpdateImage] no cover path/base64 — text tags only for {}",
                song.path
            );
        }
    }

    write_tag_mp3tag_style(path, &tag)?;

    if sidecar_jpeg.is_some() {
        let verify = id3::Tag::read_from_path(path)
            .map_err(|e| format!("Wrote tags but failed to re-read for verify: {}", e))?;
        let pic_count = verify.pictures().count();
        if pic_count == 0 {
            return Err(
                "Album art did not persist in the file (APIC missing after write).".to_string(),
            );
        }
        info!(
            "[UpdateImage] verified {} picture(s) ID3v2.3 on {}",
            pic_count, song.path
        );
    }

    Ok(())
}

/// Embed cover art from raw image bytes (Mp3Tag-style ID3v2.3 + JPEG APIC).
pub fn write_cover_art(mp3_path: &str, image_bytes: &[u8]) -> Result<(), String> {
    let path = Path::new(mp3_path);
    if !path.is_file() {
        return Err(format!("MP3 not found: {}", mp3_path));
    }
    if !is_mp3_file(path) {
        return Err("Cover art writing is only supported for MP3 files.".to_string());
    }
    if image_bytes.is_empty() {
        return Err("Image bytes are empty".to_string());
    }

    let mut tag = match id3::Tag::read_from_path(path) {
        Ok(t) => t,
        Err(_) => id3::Tag::new(),
    };

    let _jpeg = attach_front_cover(&mut tag, image_bytes)?;
    write_tag_mp3tag_style(path, &tag)?;

    let verify = id3::Tag::read_from_path(path)
        .map_err(|e| format!("Wrote cover but failed to verify: {}", e))?;
    let pic = verify
        .pictures()
        .next()
        .ok_or_else(|| "Cover art missing after write".to_string())?;
    info!(
        "[set_album_art] ok mime={} bytes={} version=ID3v2.3 → {}",
        pic.mime_type,
        pic.data.len(),
        mp3_path
    );
    Ok(())
}

/// Embed cover art from an image file on disk.
pub fn write_cover_art_from_path(mp3_path: &str, image_path: &str) -> Result<(), String> {
    let bytes = std::fs::read(image_path)
        .map_err(|e| format!("Could not read image '{}': {}", image_path, e))?;
    write_cover_art(mp3_path, &bytes)
}

/// Download an image URL to a temp JPEG; returns the temp path + jpeg bytes.
pub fn fetch_cover_url_to_temp(url: &str) -> Result<(String, Vec<u8>), String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .get(url)
        .header(
            reqwest::header::USER_AGENT,
            "auto-mp3/2.0.2 (album-art-fetch)",
        )
        .send()
        .map_err(|e| format!("Download failed: {}", e))?
        .error_for_status()
        .map_err(|e| format!("HTTP error: {}", e))?;
    let bytes = response
        .bytes()
        .map_err(|e| format!("Read body failed: {}", e))?
        .to_vec();
    if bytes.len() < 24 {
        return Err("Downloaded file is too small to be an image".to_string());
    }
    let jpeg = normalize_cover_jpeg(&bytes)?;
    let tmp = std::env::temp_dir().join(format!(
        "auto-mp3-cover-{}-{}.jpg",
        std::process::id(),
        chrono::Local::now().format("%H%M%S%3f")
    ));
    std::fs::write(&tmp, &jpeg)
        .map_err(|e| format!("Could not write temp cover: {}", e))?;
    Ok((tmp.to_string_lossy().to_string(), jpeg))
}

#[cfg(test)]
mod tests;

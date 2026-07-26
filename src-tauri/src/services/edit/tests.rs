use super::*;
use crate::models::EditViewSongMetadata;
use std::env;
use std::fs;

/// Locate the on-disk APIC encoding byte in an ID3v2.3 tag (not preserved by rust-id3 on read).
fn apic_encoding_byte(mp3_bytes: &[u8]) -> Option<u8> {
    if mp3_bytes.len() < 10 || &mp3_bytes[0..3] != b"ID3" {
        return None;
    }
    // ID3v2 tag size is synchsafe; frames follow the 10-byte header.
    let tag_size = ((mp3_bytes[6] as usize) << 21)
        | ((mp3_bytes[7] as usize) << 14)
        | ((mp3_bytes[8] as usize) << 7)
        | (mp3_bytes[9] as usize);
    let tag_end = 10 + tag_size;
    let mut offset = 10usize;
    while offset + 10 <= tag_end.min(mp3_bytes.len()) {
        if mp3_bytes[offset] == 0 {
            break; // padding
        }
        let id = &mp3_bytes[offset..offset + 4];
        // ID3v2.3 frame size is plain big-endian (not synchsafe).
        let size = u32::from_be_bytes([
            mp3_bytes[offset + 4],
            mp3_bytes[offset + 5],
            mp3_bytes[offset + 6],
            mp3_bytes[offset + 7],
        ]) as usize;
        if id == b"APIC" && size > 0 && offset + 10 < mp3_bytes.len() {
            return Some(mp3_bytes[offset + 10]);
        }
        offset = offset.saturating_add(10).saturating_add(size);
    }
    None
}

#[test]
fn writes_apic_cover_art_to_mp3() {
    let dir = env::temp_dir().join("auto-mp3-art-unit");
    let _ = fs::create_dir_all(&dir);
    let mp3 = dir.join("cover-test.mp3");
    // Tiny silent-ish MP3 from prior fixture, or invent bytes with ID3-less frame
    let src = env::temp_dir().join("auto-mp3-art-test").join("test.mp3");
    if src.exists() {
        fs::copy(&src, &mp3).expect("copy fixture");
    } else {
        // Minimal file; id3 write_to_path can prepend a tag to non-mp3 too for this test
        fs::write(&mp3, b"ID3\x04\x00\x00\x00\x00\x00\x00").expect("write stub");
    }

    let jpeg = {
        // Valid 8x8 red JPEG via image crate
        let mut buf = std::io::Cursor::new(Vec::new());
        let img = image::RgbImage::from_pixel(8, 8, image::Rgb([200, 40, 40]));
        let mut enc = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, 90);
        enc.encode(img.as_raw(), 8, 8, image::ColorType::Rgb8)
            .unwrap();
        buf.into_inner()
    };
    // Force .mp3 extension path even for stub
    let song = EditViewSongMetadata {
        id: "1".into(),
        file: "cover-test.mp3".into(),
        artist: "A".into(),
        title: "T".into(),
        album: "Al".into(),
        path: mp3.to_string_lossy().into(),
        year: 2024,
        track: 1,
        genre: "Rock".into(),
        comments: "c".into(),
        album_artist: "AA".into(),
        composer: "C".into(),
        discno: 1,
        image_src: String::new(),
        percentage: 0,
        status: "UNSAVED".into(),
        session_name: "None".into(),
    };

    let jpeg_path = dir.join("cover.jpg");
    fs::write(&jpeg_path, &jpeg).unwrap();
    edit_song_metadata(song, Some(jpeg_path.to_str().unwrap())).expect("save should succeed");

    let tag = id3::Tag::read_from_path(&mp3).expect("re-read");
    assert_eq!(tag.pictures().count(), 1);
    let pic = tag.pictures().next().unwrap();
    assert_eq!(pic.mime_type, "image/jpeg");
    assert_eq!(pic.picture_type, id3::frame::PictureType::CoverFront);
    assert!(pic.data.len() > 50, "expected real jpeg bytes");

    // Mac Finder/Music require Latin1 (0x00) on APIC — not UTF-16 (0x01) empty desc.
    let raw = fs::read(&mp3).expect("read written mp3");
    assert_eq!(
        apic_encoding_byte(&raw),
        Some(0x00),
        "APIC encoding byte must be Latin1 (0x00) for Mac compatibility"
    );
}

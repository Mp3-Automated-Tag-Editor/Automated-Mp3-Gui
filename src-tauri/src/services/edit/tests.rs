use super::*;
use crate::models::EditViewSongMetadata;
use std::env;
use std::fs;

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
}

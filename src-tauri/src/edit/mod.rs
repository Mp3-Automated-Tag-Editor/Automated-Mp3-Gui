use base64::encode;
use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::picture::MimeType;
use lofty::picture::{Picture, PictureType};
use lofty::probe::Probe;
use lofty::tag::TagExt;
use lofty::tag::{Accessor, ItemKey};
use log::{debug, info, warn};
use std::path::Path;

use crate::types::{self, EditViewSongMetadata};

fn parse_u32_field(value: Option<&str>, default: u32) -> u32 {
    value
        .unwrap_or("")
        .trim()
        .parse::<u32>()
        .unwrap_or(default)
}

pub fn is_mp3_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("mp3"))
        .unwrap_or(false)
}

pub fn get_details_for_song(
    complete_path: &str,
    id: u32,
    file_name: &str,
) -> Result<types::EditViewSongMetadata, String> {
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

    info!("Number of Tags: {}", tagged_file.tags().len());

    let tag = match tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
        Some(tag) => tag,
        None => {
            // Playable MP3 with no tags — still include with filename fallbacks
            return Ok(EditViewSongMetadata {
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
                albumArtist: "None".to_string(),
                composer: "None".to_string(),
                discno: 0,
                imageSrc: String::new(),
                percentage: 0,
                status: "UNSAVED".to_string(),
                sessionName: "None".to_string(),
            });
        }
    };

    let image_data = tag.pictures().get(0);
    let base64_image_string = match image_data {
        Some(data) => encode(data.data()),
        None => "".to_owned(),
    };

    let session = tag
        .get_string(&ItemKey::Description)
        .unwrap_or("None")
        .to_string();

    let song = EditViewSongMetadata {
        id: id.to_string(),
        file: (&file_name).to_string(),
        path: (&complete_path).to_string(),
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
        albumArtist: tag
            .get_string(&ItemKey::AlbumArtist)
            .unwrap_or("None")
            .to_string(),
        composer: tag
            .get_string(&ItemKey::Composer)
            .unwrap_or("None")
            .to_string(),
        discno: parse_u32_field(tag.get_string(&ItemKey::DiscNumber), 0),
        imageSrc: base64_image_string,
        percentage: 0,
        status: if session == "None" {
            "UNSAVED".to_string()
        } else {
            "EDIT".to_string()
        },
        sessionName: session,
    };

    Ok(song)
}

pub fn edit_song_metadata(song: EditViewSongMetadata) -> Result<(), String> {
    let path = Path::new(&song.path);

    if !path.is_file() {
        return Err("ERROR: Path is not a file!".to_string());
    }

    let mut tagged_file = Probe::open(path)
        .map_err(|e| format!("ERROR: Bad path provided!: {}", e))?
        .read()
        .map_err(|e| format!("ERROR: Failed to read file!: {}", e))?;

    let tag = if let Some(tag) = tagged_file.primary_tag_mut() {
        tag
    } else if let Some(tag) = tagged_file.first_tag_mut() {
        tag
    } else {
        return Err("ERROR: No tags found!".to_string());
    };

    tag.set_artist(song.artist);
    tag.set_title(song.title);
    tag.set_album(song.album);
    tag.set_year(song.year);
    tag.insert_text(ItemKey::Year, song.year.to_string());
    tag.insert_text(ItemKey::TrackNumber, song.track.to_string());
    tag.insert_text(ItemKey::Genre, song.genre);
    tag.insert_text(ItemKey::Comment, song.comments);
    tag.insert_text(ItemKey::AlbumArtist, song.albumArtist);
    tag.insert_text(ItemKey::Composer, song.composer);
    tag.insert_text(ItemKey::DiscNumber, song.discno.to_string());
    tag.insert_text(ItemKey::Description, song.sessionName);

    if !song.imageSrc.is_empty() {
        debug!("[ENTER][UpdateImage] - updating Image");
        let image_data: Vec<u8> = base64::decode(song.imageSrc).map_err(|e| e.to_string())?;
        let picture: Picture = Picture::new_unchecked(
            PictureType::CoverFront,
            Some(MimeType::Png),
            None,
            image_data,
        );
        tag.set_picture(0, picture);
    }

    let mut val = match tag.save_to_path(&song.path, WriteOptions::default()) {
        Ok(_) => Ok(()),
        Err(error_value) => Err(error_value.to_string()),
    };

    if val.is_err() {
        return val;
    }

    let tag = id3::Tag::read_from_path(&song.path)
        .map_err(|e| format!("Failed to re-read ID3 tag: {}", e))?;

    val = match tag.write_to_path(&song.path, id3::Version::Id3v24) {
        Ok(_) => Ok(()),
        Err(error_value) => Err(error_value.to_string()),
    };

    val
}

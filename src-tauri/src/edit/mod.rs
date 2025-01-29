use base64::encode;
use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::picture::MimeType;
use lofty::picture::{Picture, PictureType};
use lofty::probe::Probe;
use lofty::tag::TagExt;
use lofty::tag::{Accessor, ItemKey, Tag, TagType};
use log::{debug, warn};
use std::path::Path;
use std::fs;

use crate::types::{self, EditViewSongMetadata};

// pub fn read_music_directory(directory: &str) -> Result<Vec<types::SongMetadata>, MusicError> {
//     let mut songs = Vec::new();

//     for entry in WalkDir::new(directory).into_iter().filter_map(|e| e.ok()) {
//         if entry.path().is_file() {
//             if let Some(extension) = entry.path().extension() {
//                 if extension == "mp3" {
//                     let path = entry.path().to_str().unwrap();
//                     let tag = Tag::read_from_path(path)?;

//                     let song = SongMetadata {
//                         id: tag..to_string(),
//                         fileName: path.to_string(),
//                         artist: tag.artist().unwrap_or("").to_string(),
//                         title: tag.title().unwrap_or("").to_string(),
//                         album: tag.album().unwrap_or("").to_string(),
//                         year: tag.year().unwrap_or(0),
//                         track: tag.track().unwrap_or(0),
//                         genre: tag.genre().unwrap_or("").to_string(),
//                         comments: tag.comment().map_or("".to_string(), |c| c.text.clone()),
//                         albumArtist: tag.album_artist().unwrap_or("").to_string(),
//                         composer: tag.composer().unwrap_or("").to_string(),
//                         discno: tag.disc().unwrap_or(0),
//                         imageSrc: "".to_string(), // Handling images can be added as needed
//                         percentage: 0.0, // Placeholder
//                         status: "unknown".to_string(), // Placeholder
//                     };
//                     songs.push(song);
//                 }
//             }
//         }
//     }

//     Ok(songs)
// }

pub fn get_details_for_song(
    complete_path: &str,
    id: u32,
    file_name: &str,
) -> Result<types::EditViewSongMetadata, String> {
    //(directory: &str)
    // let path_str = "G:/Music/Editing Completed Songs (Ready for download)/[Cleaned Up] John Mayer - Everything You'll Ever Be (Hotel Bathroom Song) (2023_05_23 13_29_06 UTC).mp3";
    let path = Path::new(&complete_path);

    if !path.is_file() {
        panic!("ERROR: Path is not a file!");
    }

    let tagged_file = Probe::open(path)
        .expect("ERROR: Bad path provided!")
        .read()
        .expect("ERROR: Failed to read file!");

    let tag = match tagged_file.primary_tag() {
        Some(primary_tag) => primary_tag,
        // If the "primary" tag doesn't exist, we just grab the
        // first tag we can find. Realistically, a tag reader would likely
        // iterate through the tags to find a suitable one.
        None => tagged_file.first_tag().expect("ERROR: No tags found!"),
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
        year: tag
            .get_string(&ItemKey::Year)
            .unwrap_or("0")
            .parse::<u32>()
            .unwrap(),
        track: tag
            .get_string(&ItemKey::TrackNumber)
            .unwrap_or("0")
            .parse::<u32>()
            .unwrap(),
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
        discno: tag
            .get_string(&ItemKey::DiscNumber)
            .unwrap_or("0")
            .parse::<u32>()
            .unwrap(),
        imageSrc: base64_image_string,
        percentage: 0,
        status: if session == "None" { "UNSAVED" } else { "EDIT" }.to_string(),
        sessionName: session,
    };

    Ok(song)
}

pub fn edit_song_metadata(song: EditViewSongMetadata) -> Result<(), String> {
    let path = Path::new(&song.path);
    let new_filename = format!("{} - {}.mp3", &song.artist, &song.title);

    if !path.is_file() {
        return Err("ERROR: Path is not a file!".to_string());
    }

    let mut tagged_file = Probe::open(path)
        .expect("ERROR: Bad path provided!")
        .read()
        .expect("ERROR: Failed to read file!");

    let mut tag = match tagged_file.primary_tag_mut() {
        Some(primary_tag) => primary_tag,
        None => tagged_file.first_tag_mut().expect("ERROR: No tags found!"),
    };

    tag.set_artist(song.artist);
    tag.set_title(song.title);
    tag.set_album(song.album);
    tag.insert_text(ItemKey::Year, song.year.to_string());
    tag.insert_text(ItemKey::TrackNumber, song.track.to_string());
    tag.insert_text(ItemKey::Genre, song.genre);
    tag.insert_text(ItemKey::Comment, song.comments);
    tag.insert_text(ItemKey::AlbumArtist, song.albumArtist);
    tag.insert_text(ItemKey::Composer, song.composer);
    tag.insert_text(ItemKey::DiscNumber, song.discno.to_string());
    tag.insert_text(ItemKey::Description, song.sessionName);

    // Handle image data if present
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
        Err(error_value) => Err(error_value.to_string())
    };

    if val.is_err() {
        return val;
    }

    let mut tag = id3::Tag::read_from_path(&song.path).unwrap();

    val = match tag.write_to_path(&song.path, id3::Version::Id3v23) {
        Ok(_) => Ok(()),
        Err(error_value) => Err(error_value.to_string())
    };

    // Rename the file
    let new_path = path.with_file_name(new_filename);
    fs::rename(path, &new_path).map_err(|e| e.to_string())?;

    val
}

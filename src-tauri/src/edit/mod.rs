use base64::encode;
use lofty::prelude::*;
use lofty::probe::Probe;
use std::path::Path;

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

pub fn get_details_for_song(complete_path: &str, id: u32, file_name: &str) -> Result<types::EditViewSongMetadata, String> { //(directory: &str)
    let path_str = "G:/Music/Editing Completed Songs (Ready for download)/[Cleaned Up] John Mayer - Everything You'll Ever Be (Hotel Bathroom Song) (2023_05_23 13_29_06 UTC).mp3";
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
        None => "".to_owned()
    };

    // let base64_image_string = match image_data {
    //     Some(data) => std::str::from_utf8(data.data()).unwrap(),
    //     None => ""
    // };

    let song = EditViewSongMetadata {
        id: id.to_string(),
        file: (&file_name).to_string(),
        path: (&complete_path).to_string(),
        artist: tag.artist().as_deref().unwrap_or("None").to_string(),
        title: tag.title().as_deref().unwrap_or("None").to_string(),
        album: tag.album().as_deref().unwrap_or("None").to_string(),
        year: tag.get_string(&ItemKey::Year).unwrap_or("0").parse::<u32>().unwrap(),
        track: tag.get_string(&ItemKey::TrackNumber).unwrap_or("0").parse::<u32>().unwrap(),
        genre: tag.get_string(&ItemKey::Genre).unwrap_or("None").to_string(),
        comments: tag.get_string(&ItemKey::Comment).unwrap_or("None").to_string(),
        albumArtist: tag.get_string(&ItemKey::AlbumArtist).unwrap_or("None").to_string(),
        composer: tag.get_string(&ItemKey::Composer).unwrap_or("None").to_string(),
        discno: tag.get_string(&ItemKey::DiscNumber).unwrap_or("0").parse::<u32>().unwrap(),
        imageSrc: base64_image_string,
        percentage: 0,
        status: "edit".to_owned()
    };

    Ok(song)
}
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    threads: i32,
    test: String,
    developer_settings: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Window_Emit<'a>  {
    pub id: u32,
    pub state: bool,
    pub data: &'a str,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MetaData {
    id: u32,
    file_name: String,
    path: String,
    title: String,
    artist: String,
    album: String,
    year: u8,
    track: u8,
    genre: String,
    comment: String,
    album_artist: String,
    composer: String,
    discno: u8,
    successful_field_calls: u32,
    successful_mechanism_calls: u32,
    successful_queries: u32,
    total_field_calls: u32,
    total_mechanism_calls: u32,
    total_successful_queries: u32,
    album_art: String,
}

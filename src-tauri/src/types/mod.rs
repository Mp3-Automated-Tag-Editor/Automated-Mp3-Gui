use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    threads: i32,
    test: String,
    developer_settings: bool,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Network_Details {
    pub if_connected: bool,
    pub speed:u32,
    pub latency: u32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Server_Health {
    status: i32,
    message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Window_Emit<'a>  {
    pub id: u32,
    pub state: bool,
    pub data: &'a str,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Error_Emit<'a>  {
    pub errorCode: u32,
    pub errorMessage: &'a str,
    pub id: u32,
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

#[derive(Debug, Deserialize)]
pub struct ClassifierOptions {
    #[serde(flatten)]
    pub options: HashMap<String, f64>,
}

#[derive(Debug, Deserialize)]
pub struct ValueField<T> {
    pub classifierOptions: ClassifierOptions,
    pub value: T,
}

#[derive(Debug, Deserialize)]
pub struct Data {
    pub artist: ValueField<String>,
    pub title: ValueField<String>,
    pub album: ValueField<String>,
    pub year: ValueField<u32>,
    pub track: ValueField<u32>,
    pub comments: ValueField<String>,
    pub albumArtist: ValueField<String>,
    pub composer: ValueField<String>,
    pub discno: ValueField<u32>,
    pub genre: ValueField<String>,
}

#[derive(Debug, Deserialize)]
pub struct Calls {
    pub successfulMechanismCalls: u32,
    pub totalMechanismCalls: u32,
    pub successfulQueries: u32,
    pub totalQueries: u32,
}

#[derive(Debug, Deserialize)]
pub struct ApiResponse {
    pub artist: String,
    pub title: String,
    pub data: Data,
    pub calls: Calls,
}
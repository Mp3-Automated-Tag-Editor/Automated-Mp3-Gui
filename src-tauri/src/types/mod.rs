use serde::{Deserialize, Serialize};
use std::{collections::HashMap, hash::Hash};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub threads: i32,
    pub test: String,
    pub developer_settings: bool,
    pub spotify: bool,
    pub palm: bool,
    pub ytmusic: bool,
    pub itunes: bool,
    pub genius: bool,
    pub groq: bool,
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
    pub status: i32,
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Status {
    PROCESSING,
    SUCCESS,
    FAILED,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Packet<'a>  {
    pub id: u32,
    pub status: Status,
    pub songName: &'a str,
    pub statusCode: u32, // 3xx for processing, 2xx for successful, 4xx for failure from Desktop, 5xx for Server failure
    pub errorMessage: &'a str,
    pub accuracy: f32
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScrapeResult<'a>  {
    pub status: Status,
    pub status_code: u32, // 3xx for processing, 2xx for successful, 4xx for failure from Desktop, 5xx for Server failure
    pub error_message: &'a str,
    pub session_name: &'a str,
    pub overall_accuracy: f32,
    pub total_files: u32,
    pub processed_files: u32,
    pub time: &'a str
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
    pub result: ResultData,
    pub from_cache: bool,
}

#[derive(Debug, Deserialize)]
pub struct ResultData {
    pub artist: String,
    pub title: String,
    pub data: Classifier_Data,
    pub calls: Calls,
}

#[derive(Debug, Deserialize)]
pub struct Classifier_Data {
    pub artist: Classifier<String>,
    pub title: Classifier<String>,
    pub album: Classifier<String>,
    pub year: Classifier<i32>,
    pub track: Classifier<i32>,
    pub comments: Classifier<String>,
    pub albumArtist: Classifier<String>,
    pub composer: Classifier<String>,
    pub discno: Classifier<i32>,
    pub genre: Classifier<String>,
}

#[derive(Debug, Deserialize)]
pub struct Classifier<T: Eq + Hash> {
    pub classifierOptions: HashMap<String, f64>,
    pub value: T,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditViewSongMetadata {
    pub id: String,
    pub file: String,
    pub artist: String,
    pub title: String,
    pub album: String,
    pub path: String,
    pub year: u32,
    pub track: u32,
    pub genre: String,
    pub comments: String,
    pub albumArtist: String,
    pub composer: String,
    pub discno: u32,
    pub imageSrc: String,
    pub percentage: u32,
    pub status: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub table_name: String,
    pub date: String,
    pub session_number: u32,
    pub custom_name: String,
    pub path: String,
    pub total_files: u32,
    pub processed_files: u32, //TODO: Implement this
}
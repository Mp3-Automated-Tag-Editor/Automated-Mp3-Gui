pub mod artist_country;
pub mod download;
pub mod stats;

pub use artist_country::*;
pub use download::*;
pub use stats::*;

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, hash::Hash};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub threads: i32,
    pub test: String,
    #[serde(rename = "developerSettings")]
    pub developer_settings: bool,
    #[serde(rename = "useCache")]
    pub use_cache: bool,
    pub spotify: bool,
    pub palm: bool,
    pub ytmusic: bool,
    pub itunes: bool,
    pub genius: bool,
    pub groq: bool,
    #[serde(rename = "deepseekR1")]
    pub deepseek_r1: bool,
    #[serde(rename = "amazonMusic")]
    pub amazon_music: bool,
    #[serde(rename = "appleMusic")]
    pub apple_music: bool,
    #[serde(rename = "theAudioDb")]
    pub the_audio_db: bool,
    pub deezer: bool,
    #[serde(rename = "musicBrainz")]
    pub music_brainz: bool,
    pub echonest: bool,
    pub pandora: bool,
    pub soundcloud: bool,
    pub tidal: bool,
    pub napster: bool,
    pub qobuz: bool,
    #[serde(rename = "qqMusic")]
    pub qq_music: bool,
    #[serde(rename = "yandexMusic")]
    pub yandex_music: bool,
    #[serde(rename = "vkMusic")]
    pub vk_music: bool,
    pub anghami: bool,
    pub zvuk: bool,
    pub gaana: bool,
    pub jiosaavn: bool,
    pub resso: bool,
    pub boomplay: bool,
    pub wikipedia: bool,
    #[serde(rename = "googleSearch")]
    pub google_search: bool,
    #[serde(default, rename = "libraryPath")]
    pub library_path: String,
    /// "review" | "apply"
    #[serde(default = "default_scrape_mode", rename = "scrapeMode")]
    pub scrape_mode: String,
}

fn default_scrape_mode() -> String {
    "review".to_string()
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NetworkDetails {
    pub if_connected: bool,
    pub speed: u32,
    pub latency: u32,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ServerHealth {
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
pub struct Packet<'a> {
    pub id: u32,
    pub status: Status,
    pub song_name: &'a str,
    pub status_code: u32, // 3xx processing, 2xx success, 4xx desktop fail, 5xx server fail
    pub error_message: &'a str,
    pub accuracy: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScrapeResult<'a> {
    pub status: Status,
    pub status_code: u32,
    pub error_message: &'a str,
    pub session_name: &'a str,
    pub overall_accuracy: f32,
    pub total_files: u32,
    pub processed_files: u32,
    pub time: &'a str,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Calls {
    pub successful_mechanism_calls: u32,
    pub total_mechanism_calls: u32,
    pub successful_queries: u32,
    pub total_queries: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub result: ResultData,
    #[allow(dead_code)]
    pub from_cache: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResultData {
    pub artist: String,
    pub title: String,
    pub data: ClassifierData,
    pub calls: Calls,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassifierData {
    #[allow(dead_code)]
    pub artist: Classifier<String>,
    #[allow(dead_code)]
    pub title: Classifier<String>,
    pub album: Classifier<String>,
    pub year: Classifier<i32>,
    pub track: Classifier<i32>,
    pub comments: Classifier<String>,
    pub album_artist: Classifier<String>,
    pub composer: Classifier<String>,
    pub discno: Classifier<i32>,
    pub genre: Classifier<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Classifier<T: Eq + Hash> {
    #[allow(dead_code)]
    pub classifier_options: HashMap<String, f64>,
    pub value: T,
}

/// Song row shared with the Edit UI (JSON field names stay camelCase).
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
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
    pub album_artist: String,
    pub composer: String,
    pub discno: u32,
    pub image_src: String,
    pub percentage: u32,
    pub status: String,
    pub session_name: String,
}

/// Emitted per song when scraping without SQLite sessions.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScrapeSongResult {
    pub path: String,
    pub file: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub year: u32,
    pub track: u32,
    pub genre: String,
    pub comments: String,
    pub album_artist: String,
    pub composer: String,
    pub discno: u32,
    pub accuracy: f32,
    pub applied: bool,
    pub success: bool,
    pub error_message: String,
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

//! Local disk cache for scrape API responses (keyed by path + classifier flags).

use log::warn;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::constants::scrape_cache as sc_const;
use crate::models::Settings;
use crate::util::get_auto_mp3_dir;

lazy_static::lazy_static! {
    /// In-flight scrape keys to dedupe concurrent workers.
    static ref INFLIGHT: Mutex<HashMap<String, ()>> = Mutex::new(HashMap::new());
}

fn cache_dir() -> PathBuf {
    get_auto_mp3_dir().join(sc_const::CACHE_DIR)
}

fn classifier_fingerprint(settings: &Settings) -> String {
    format!(
        "sp{}pa{}yt{}it{}ge{}gr{}ds{}am{}ap{}ta{}dz{}mb{}ec{}pn{}sc{}td{}np{}qb{}qq{}ya{}vk{}an{}zv{}ga{}ji{}re{}bo{}wi{}go{}",
        settings.spotify as u8,
        settings.palm as u8,
        settings.ytmusic as u8,
        settings.itunes as u8,
        settings.genius as u8,
        settings.groq as u8,
        settings.deepseek_r1 as u8,
        settings.amazon_music as u8,
        settings.apple_music as u8,
        settings.the_audio_db as u8,
        settings.deezer as u8,
        settings.music_brainz as u8,
        settings.echonest as u8,
        settings.pandora as u8,
        settings.soundcloud as u8,
        settings.tidal as u8,
        settings.napster as u8,
        settings.qobuz as u8,
        settings.qq_music as u8,
        settings.yandex_music as u8,
        settings.vk_music as u8,
        settings.anghami as u8,
        settings.zvuk as u8,
        settings.gaana as u8,
        settings.jiosaavn as u8,
        settings.resso as u8,
        settings.boomplay as u8,
        settings.wikipedia as u8,
        settings.google_search as u8,
    )
}

pub fn cache_key(song_path: &str, settings: &Settings) -> String {
    let mut hasher = Sha256::new();
    hasher.update(song_path.as_bytes());
    hasher.update(b"|");
    hasher.update(classifier_fingerprint(settings).as_bytes());
    hex::encode(hasher.finalize())
}

fn cache_file(key: &str) -> PathBuf {
    cache_dir().join(format!("{key}.json"))
}

pub fn get_cached_response(song_path: &str, settings: &Settings) -> Option<Value> {
    if !settings.use_cache {
        return None;
    }
    let key = cache_key(song_path, settings);
    let path = cache_file(&key);
    match fs::read_to_string(path) {
        Ok(raw) => serde_json::from_str(&raw).ok(),
        Err(_) => None,
    }
}

pub fn put_cached_response(song_path: &str, settings: &Settings, body: &Value) {
    if !settings.use_cache {
        return;
    }
    let dir = cache_dir();
    if let Err(e) = fs::create_dir_all(&dir) {
        warn!("scrape_cache: create_dir_all failed: {e}");
        return;
    }
    let key = cache_key(song_path, settings);
    match serde_json::to_string(body) {
        Ok(raw) => {
            if let Err(e) = fs::write(cache_file(&key), raw) {
                warn!("scrape_cache: write failed: {e}");
            }
        }
        Err(e) => warn!("scrape_cache: serialize failed: {e}"),
    }
}

/// Returns true if this worker should proceed; false if another worker owns the key.
pub fn try_begin_inflight(key: &str) -> bool {
    let mut guard = INFLIGHT.lock().unwrap();
    if guard.contains_key(key) {
        false
    } else {
        guard.insert(key.to_string(), ());
        true
    }
}

pub fn end_inflight(key: &str) {
    INFLIGHT.lock().unwrap().remove(key);
}

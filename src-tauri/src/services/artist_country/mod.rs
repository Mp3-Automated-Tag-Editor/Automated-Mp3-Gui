//! Artist → country resolution via MusicBrainz (cache + rate limit).

mod iso;

use log::{info, warn};
use serde::Serialize;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{Runtime, Window};

use crate::constants::{artist_country as ac_const, musicbrainz};
use crate::models::{
    ArtistCountryCache, ArtistCountryEntry, ArtistCountryResult, ResolveArtistCountriesResult,
};
use crate::util::{get_auto_mp3_dir, normalize_artist_key};

pub use iso::{country_display_name, iso2_to_numeric_id};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload {
    pending: u32,
    total: u32,
}

lazy_static::lazy_static! {
    static ref LAST_REQUEST: Mutex<Option<Instant>> = Mutex::new(None);
}

fn cache_path() -> PathBuf {
    get_auto_mp3_dir().join(ac_const::CACHE_FILE)
}

pub fn load_cache() -> ArtistCountryCache {
    let path = cache_path();
    match fs::read_to_string(&path) {
        Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
        Err(_) => HashMap::new(),
    }
}

pub fn save_cache(cache: &ArtistCountryCache) {
    let dir = get_auto_mp3_dir();
    if let Err(e) = fs::create_dir_all(&dir) {
        warn!("artist_country: create_dir_all failed: {e}");
        return;
    }
    match serde_json::to_string_pretty(cache) {
        Ok(raw) => {
            if let Err(e) = fs::write(cache_path(), raw) {
                warn!("artist_country: cache write failed: {e}");
            }
        }
        Err(e) => warn!("artist_country: cache serialize failed: {e}"),
    }
}

fn needs_lookup(cache: &ArtistCountryCache, artist: &str) -> bool {
    match cache.get(&normalize_artist_key(artist)) {
        None => true,
        Some(entry) => entry.error,
    }
}

async fn throttle() {
    let wait = {
        let guard = LAST_REQUEST.lock().unwrap();
        if let Some(last) = *guard {
            let elapsed = last.elapsed().as_millis() as u64;
            musicbrainz::MIN_INTERVAL_MS.saturating_sub(elapsed)
        } else {
            0
        }
    };
    if wait > 0 {
        tokio::time::sleep(Duration::from_millis(wait)).await;
    }
    *LAST_REQUEST.lock().unwrap() = Some(Instant::now());
}

fn mb_pick_country(artist: &serde_json::Value) -> ArtistCountryEntry {
    let country = artist
        .get("country")
        .and_then(|v| v.as_str())
        .map(|s| s.to_uppercase())
        .filter(|s| s.len() == 2);

    let area_codes = artist
        .pointer("/area/iso-3166-1-codes/0")
        .and_then(|v| v.as_str())
        .map(|s| s.to_uppercase())
        .filter(|s| s.len() == 2);

    let iso = country.or(area_codes);
    let area_name = artist
        .pointer("/area/name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let country_name = iso
        .as_ref()
        .map(|c| country_display_name(c))
        .or(area_name);

    ArtistCountryEntry {
        country: iso,
        country_name,
        error: false,
    }
}

pub async fn lookup_artist_country(artist: String) -> Result<ArtistCountryResult, String> {
    let name = artist.trim();
    if name.is_empty() {
        return Ok(ArtistCountryResult {
            country: None,
            country_name: None,
        });
    }

    throttle().await;

    let client = reqwest::Client::builder()
        .user_agent(musicbrainz::USER_AGENT)
        .build()
        .map_err(|e| e.to_string())?;

    let query = format!("artist:\"{}\"", name.replace('"', ""));
    let search = client
        .get(musicbrainz::ARTIST_SEARCH_URL)
        .query(&[
            ("query", query.as_str()),
            ("fmt", "json"),
            ("limit", musicbrainz::SEARCH_LIMIT),
        ])
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !search.status().is_success() {
        return Err(format!("MusicBrainz search failed: {}", search.status()));
    }

    let body: serde_json::Value = search.json().await.map_err(|e| e.to_string())?;
    let artists = body
        .get("artists")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    if artists.is_empty() {
        return Ok(ArtistCountryResult {
            country: None,
            country_name: None,
        });
    }

    let needle = name.to_lowercase();
    let mut best = artists[0].clone();
    for candidate in &artists {
        let cname = candidate
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();
        if cname == needle {
            best = candidate.clone();
            break;
        }
    }

    let mut entry = mb_pick_country(&best);

    if entry.country.is_none() {
        if let Some(id) = best.get("id").and_then(|v| v.as_str()) {
            throttle().await;
            let detail = client
                .get(format!("{}/{id}", musicbrainz::ARTIST_SEARCH_URL))
                .query(&[("fmt", "json")])
                .header("Accept", "application/json")
                .send()
                .await
                .map_err(|e| e.to_string())?;
            if detail.status().is_success() {
                let detail_body: serde_json::Value =
                    detail.json().await.map_err(|e| e.to_string())?;
                let picked = mb_pick_country(&detail_body);
                if picked.country.is_some() {
                    entry = picked;
                } else if entry.country_name.is_none() {
                    entry.country_name = picked.country_name;
                }
            }
        }
    }

    Ok(ArtistCountryResult {
        country: entry.country,
        country_name: entry.country_name,
    })
}

fn emit_progress<R: Runtime>(window: &Window<R>, pending: u32, total: u32) {
    let _ = window.emit(
        "artist_country_progress",
        ProgressPayload { pending, total },
    );
}

/// Resolve countries for unique artists; persists cache under `~/.config/auto-mp3`.
pub async fn resolve_artist_countries<R: Runtime>(
    window: Window<R>,
    artists: Vec<String>,
) -> Result<ResolveArtistCountriesResult, String> {
    let mut cache = load_cache();

    let unique: Vec<String> = {
        let mut seen = std::collections::HashSet::new();
        let mut out = Vec::new();
        for a in artists {
            let trimmed = a.trim().to_string();
            if trimmed.is_empty() || trimmed == ac_const::UNKNOWN_ARTIST {
                continue;
            }
            let key = normalize_artist_key(&trimmed);
            if seen.insert(key) {
                out.push(trimmed);
            }
        }
        out.sort();
        out
    };

    let missing: Vec<String> = unique
        .iter()
        .filter(|a| needs_lookup(&cache, a))
        .cloned()
        .collect();

    let total = missing.len() as u32;
    info!(
        "resolve_artist_countries unique={} missing={}",
        unique.len(),
        total
    );
    emit_progress(&window, total, total);

    for (i, name) in missing.iter().enumerate() {
        let key = normalize_artist_key(name);
        let entry = match lookup_artist_country(name.clone()).await {
            Ok(r) => ArtistCountryEntry {
                country: r.country,
                country_name: r.country_name,
                error: false,
            },
            Err(e) => {
                warn!("artist_country lookup failed for '{name}': {e}");
                ArtistCountryEntry {
                    country: None,
                    country_name: None,
                    error: true,
                }
            }
        };
        cache.insert(key, entry);

        let pending = total.saturating_sub((i + 1) as u32);
        if i % 5 == 0 || pending == 0 {
            save_cache(&cache);
        }
        emit_progress(&window, pending, total);
    }

    if !missing.is_empty() {
        save_cache(&cache);
    }

    let mut artist_iso = HashMap::new();
    let mut unknown = 0u32;
    for name in &unique {
        let key = normalize_artist_key(name);
        let iso = cache.get(&key).and_then(|e| e.country.clone());
        if iso.is_none() {
            unknown += 1;
        }
        artist_iso.insert(key, iso);
    }

    Ok(ResolveArtistCountriesResult {
        artist_iso,
        unknown_artists: unknown,
    })
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsTrack {
    pub path: String,
    pub file: String,
    pub artist: String,
    pub title: String,
    pub album: String,
    pub year: u32,
    pub genre: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStatsInput {
    pub tracks: Vec<StatsTrack>,
    pub liked_paths: Vec<String>,
    pub recently_played: Vec<String>,
    /// Normalized artist key (lowercase trimmed) → ISO2 or null
    pub artist_country: HashMap<String, Option<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NamedCount {
    pub name: String,
    pub count: u32,
    pub percent: f64,
    /// Sample track path for the FE to attach cover art
    pub sample_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecadeBucket {
    pub decade: String,
    pub count: u32,
    pub percent: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibrarySummary {
    pub songs: u32,
    pub artists: u32,
    pub albums: u32,
    pub genres: u32,
    pub liked: u32,
    pub year_min: Option<u32>,
    pub year_max: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryHighlights {
    pub top_artist: Option<String>,
    pub top_artist_count: u32,
    pub dominant_genre: Option<String>,
    pub dominant_genre_count: u32,
    pub oldest_year: Option<u32>,
    pub newest_year: Option<u32>,
    pub liked_count: u32,
    pub recent_title: Option<String>,
    pub recent_artist: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTimelineItem {
    pub year: u32,
    pub path: String,
    pub title: String,
    pub album: String,
    pub artist: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CountryBucket {
    pub iso2: String,
    pub name: String,
    /// ISO 3166-1 numeric (UN M49), for joining world-atlas topojson ids.
    pub numeric_id: Option<String>,
    pub track_count: u32,
    pub artist_count: u32,
    pub artists: Vec<String>,
    /// Sample track paths for covers (FE joins)
    pub sample_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStats {
    pub summary: LibrarySummary,
    pub genres: Vec<NamedCount>,
    pub artists: Vec<NamedCount>,
    pub decades: Vec<DecadeBucket>,
    pub highlights: LibraryHighlights,
    pub timeline: Vec<LibraryTimelineItem>,
    pub countries: Vec<CountryBucket>,
}

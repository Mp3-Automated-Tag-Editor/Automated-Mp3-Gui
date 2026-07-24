//! Shared Rust-side constants (keep in sync with FE `@/constants` where applicable).

pub mod musicbrainz {
    pub const ARTIST_SEARCH_URL: &str = "https://musicbrainz.org/ws/2/artist";
    pub const MIN_INTERVAL_MS: u64 = 1100;
    pub const SEARCH_LIMIT: &str = "5";
    pub const USER_AGENT: &str = "Auto-Mp3-Gui/2.0.0 (local; music library country stats)";
}

pub mod artist_country {
    pub const CACHE_FILE: &str = "artist-country-cache.json";
    pub const UNKNOWN_ARTIST: &str = "Unknown Artist";
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ArtistCountryEntry {
    pub country: Option<String>,
    pub country_name: Option<String>,
    #[serde(default)]
    pub error: bool,
}

pub type ArtistCountryCache = HashMap<String, ArtistCountryEntry>;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistCountryResult {
    pub country: Option<String>,
    pub country_name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolveArtistCountriesResult {
    /// Normalized artist key → ISO2 (or null).
    pub artist_iso: HashMap<String, Option<String>>,
    pub unknown_artists: u32,
}

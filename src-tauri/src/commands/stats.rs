use crate::models::{
    ArtistCountryResult, LibraryStats, LibraryStatsInput, ResolveArtistCountriesResult,
};
use crate::services::{artist_country, stats};
use log::info;
use tauri::{Runtime, Window};

#[tauri::command]
pub fn compute_library_stats(input: LibraryStatsInput) -> Result<LibraryStats, String> {
    info!(
        "compute_library_stats tracks={} liked={} recent={} countries_cache={}",
        input.tracks.len(),
        input.liked_paths.len(),
        input.recently_played.len(),
        input.artist_country.len()
    );
    Ok(stats::compute_library_stats(input))
}

#[tauri::command]
pub async fn lookup_artist_country(artist: String) -> Result<ArtistCountryResult, String> {
    artist_country::lookup_artist_country(artist).await
}

#[tauri::command]
pub async fn resolve_artist_countries<R: Runtime>(
    window: Window<R>,
    artists: Vec<String>,
) -> Result<ResolveArtistCountriesResult, String> {
    artist_country::resolve_artist_countries(window, artists).await
}

//! Library statistics aggregation (ported from the former TypeScript `aggregate.ts`).

use std::collections::{HashMap, HashSet};

use crate::models::{
    CountryBucket, DecadeBucket, LibraryHighlights, LibraryStats, LibraryStatsInput,
    LibrarySummary, LibraryTimelineItem, NamedCount, StatsTrack,
};
use crate::services::artist_country::{country_display_name, iso2_to_numeric_id};
use crate::util::{is_filled, normalize_artist_key};

fn display_artist(t: &StatsTrack) -> String {
    if is_filled(&t.artist) {
        t.artist.trim().to_string()
    } else {
        "Unknown Artist".to_string()
    }
}

fn display_album(t: &StatsTrack) -> String {
    if is_filled(&t.album) {
        t.album.trim().to_string()
    } else {
        "Unknown Album".to_string()
    }
}

fn display_title(t: &StatsTrack) -> String {
    if is_filled(&t.title) {
        t.title.trim().to_string()
    } else if !t.file.is_empty() {
        t.file
            .trim_end_matches(".mp3")
            .trim_end_matches(".MP3")
            .to_string()
    } else {
        "Unknown Title".to_string()
    }
}

fn normalize_genre(genre: &str) -> String {
    let t = genre.trim();
    if t.is_empty() || t == "None" {
        "Unknown".to_string()
    } else {
        t.to_string()
    }
}

fn valid_year(year: u32) -> bool {
    (1900..=2100).contains(&year)
}

struct CountAcc {
    count: u32,
    sample_path: Option<String>,
}

fn count_by<F>(tracks: &[StatsTrack], get_key: F) -> HashMap<String, CountAcc>
where
    F: Fn(&StatsTrack) -> String,
{
    let mut map: HashMap<String, CountAcc> = HashMap::new();
    for track in tracks {
        let key = get_key(track);
        map.entry(key)
            .and_modify(|a| a.count += 1)
            .or_insert_with(|| CountAcc {
                count: 1,
                sample_path: Some(track.path.clone()),
            });
    }
    map
}

fn to_named_counts(
    map: HashMap<String, CountAcc>,
    total: u32,
    limit: Option<usize>,
) -> Vec<NamedCount> {
    let mut sorted: Vec<_> = map
        .into_iter()
        .map(|(name, acc)| NamedCount {
            name,
            count: acc.count,
            percent: if total > 0 {
                (acc.count as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            sample_path: acc.sample_path,
        })
        .collect();
    sorted.sort_by(|a, b| {
        b.count
            .cmp(&a.count)
            .then_with(|| a.name.cmp(&b.name))
    });

    let Some(limit) = limit else {
        return sorted;
    };
    if sorted.len() <= limit {
        return sorted;
    }

    let mut top: Vec<_> = sorted.drain(..limit).collect();
    let other_count: u32 = sorted.iter().map(|r| r.count).sum();
    if other_count > 0 {
        top.push(NamedCount {
            name: "Other".to_string(),
            count: other_count,
            percent: if total > 0 {
                (other_count as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            sample_path: None,
        });
    }
    top
}

fn genre_breakdown(tracks: &[StatsTrack], limit: usize) -> Vec<NamedCount> {
    let map = count_by(tracks, |t| normalize_genre(&t.genre));
    to_named_counts(map, tracks.len() as u32, Some(limit))
}

fn top_artists(tracks: &[StatsTrack], limit: usize) -> Vec<NamedCount> {
    let map = count_by(tracks, display_artist);
    to_named_counts(map, tracks.len() as u32, Some(limit))
}

fn decade_buckets(tracks: &[StatsTrack]) -> Vec<DecadeBucket> {
    let mut map: HashMap<String, u32> = HashMap::new();
    let mut with_year = 0u32;
    for track in tracks {
        if !valid_year(track.year) {
            continue;
        }
        with_year += 1;
        let decade_start = (track.year / 10) * 10;
        let label = format!("{}s", decade_start);
        *map.entry(label).or_insert(0) += 1;
    }
    let mut out: Vec<_> = map
        .into_iter()
        .map(|(decade, count)| DecadeBucket {
            decade,
            count,
            percent: if with_year > 0 {
                (count as f64 / with_year as f64) * 100.0
            } else {
                0.0
            },
        })
        .collect();
    out.sort_by(|a, b| a.decade.cmp(&b.decade));
    out
}

fn library_summary(tracks: &[StatsTrack], liked_paths: &[String]) -> LibrarySummary {
    let artists: HashSet<_> = tracks.iter().map(display_artist).collect();
    let albums: HashSet<_> = tracks
        .iter()
        .map(|t| format!("{}::{}", display_album(t), display_artist(t)).to_lowercase())
        .collect();
    let genres: HashSet<_> = tracks.iter().map(|t| normalize_genre(&t.genre)).collect();
    let years: Vec<u32> = tracks
        .iter()
        .map(|t| t.year)
        .filter(|&y| valid_year(y))
        .collect();
    let liked_set: HashSet<_> = liked_paths.iter().cloned().collect();
    let liked = tracks
        .iter()
        .filter(|t| liked_set.contains(&t.path))
        .count() as u32;

    LibrarySummary {
        songs: tracks.len() as u32,
        artists: artists.len() as u32,
        albums: albums.len() as u32,
        genres: genres.len() as u32,
        liked,
        year_min: years.iter().copied().min(),
        year_max: years.iter().copied().max(),
    }
}

fn library_highlights(
    tracks: &[StatsTrack],
    liked_paths: &[String],
    recently_played: &[String],
) -> LibraryHighlights {
    let artists = top_artists(tracks, 1);
    let genres = genre_breakdown(tracks, 1);
    let years: Vec<u32> = tracks
        .iter()
        .map(|t| t.year)
        .filter(|&y| valid_year(y))
        .collect();
    let by_path: HashMap<_, _> = tracks.iter().map(|t| (t.path.as_str(), t)).collect();
    let recent = recently_played
        .iter()
        .find_map(|p| by_path.get(p.as_str()).copied());
    let liked_set: HashSet<_> = liked_paths.iter().cloned().collect();
    let liked_count = tracks
        .iter()
        .filter(|t| liked_set.contains(&t.path))
        .count() as u32;

    LibraryHighlights {
        top_artist: artists.first().map(|a| a.name.clone()),
        top_artist_count: artists.first().map(|a| a.count).unwrap_or(0),
        dominant_genre: genres.first().map(|g| g.name.clone()),
        dominant_genre_count: genres.first().map(|g| g.count).unwrap_or(0),
        oldest_year: years.iter().copied().min(),
        newest_year: years.iter().copied().max(),
        liked_count,
        recent_title: recent.map(display_title),
        recent_artist: recent.map(display_artist),
    }
}

fn library_timeline_items(tracks: &[StatsTrack]) -> Vec<LibraryTimelineItem> {
    let mut seen = HashSet::new();
    let mut items = Vec::new();
    for track in tracks {
        if !valid_year(track.year) {
            continue;
        }
        let album = display_album(track);
        let artist = display_artist(track);
        let key = format!("{}::{}::{}", track.year, album, artist).to_lowercase();
        if !seen.insert(key) {
            continue;
        }
        items.push(LibraryTimelineItem {
            year: track.year,
            path: track.path.clone(),
            title: display_title(track),
            album,
            artist,
        });
    }
    items.sort_by(|a, b| {
        a.year
            .cmp(&b.year)
            .then_with(|| a.album.cmp(&b.album))
    });
    items
}

fn country_buckets(
    tracks: &[StatsTrack],
    artist_country: &HashMap<String, Option<String>>,
) -> Vec<CountryBucket> {
    struct Acc {
        tracks: u32,
        artists: HashSet<String>,
        sample_paths: Vec<String>,
    }
    let mut map: HashMap<String, Acc> = HashMap::new();

    for track in tracks {
        let artist = display_artist(track);
        let key = normalize_artist_key(&artist);
        let iso = match artist_country.get(&key) {
            Some(Some(iso)) if !iso.trim().is_empty() => iso.trim().to_uppercase(),
            _ => continue,
        };
        let acc = map.entry(iso).or_insert_with(|| Acc {
            tracks: 0,
            artists: HashSet::new(),
            sample_paths: Vec::new(),
        });
        acc.tracks += 1;
        acc.artists.insert(artist);
        if acc.sample_paths.len() < 8 && !acc.sample_paths.contains(&track.path) {
            acc.sample_paths.push(track.path.clone());
        }
    }

    let mut out: Vec<_> = map
        .into_iter()
        .map(|(iso2, acc)| {
            let mut artists: Vec<_> = acc.artists.into_iter().collect();
            artists.sort();
            let name = country_display_name(&iso2);
            let numeric_id = iso2_to_numeric_id(&iso2);
            CountryBucket {
                iso2,
                name,
                numeric_id,
                track_count: acc.tracks,
                artist_count: artists.len() as u32,
                artists,
                sample_paths: acc.sample_paths,
            }
        })
        .collect();
    out.sort_by(|a, b| {
        b.track_count
            .cmp(&a.track_count)
            .then_with(|| a.iso2.cmp(&b.iso2))
    });
    out
}

/// Compute all library statistics from lightweight track rows.
pub fn compute_library_stats(input: LibraryStatsInput) -> LibraryStats {
    let tracks = &input.tracks;
    let summary = library_summary(tracks, &input.liked_paths);
    let genres = genre_breakdown(tracks, 8);
    let artists = top_artists(tracks, 10);
    let decades = decade_buckets(tracks);
    let highlights = library_highlights(tracks, &input.liked_paths, &input.recently_played);
    let timeline = library_timeline_items(tracks);
    let countries = country_buckets(tracks, &input.artist_country);

    LibraryStats {
        summary,
        genres,
        artists,
        decades,
        highlights,
        timeline,
        countries,
    }
}

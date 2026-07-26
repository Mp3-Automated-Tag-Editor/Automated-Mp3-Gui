use log::{error, info};
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use reqwest;
use reqwest::blocking::Client;
use rusqlite::params;
use serde_json::json;
use std::env;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Runtime;
use url::Url;

/*
TODO:
- Retreive Threads number from settings.json file
- Build out API functionality to retreive Album Art as well for given album (Look into both solutions, either calling endpoint, or modifying current data)
- In place file editing
- Scrape Summary - emit function, then display summary componenets.
*/

use crate::repository as db;
use crate::models::{self, ApiResponse, Packet, ScrapeResult};

static SHOULD_STOP: AtomicBool = AtomicBool::new(false);

// Thread-safe global variables
lazy_static::lazy_static! {
    static ref OVERALL_ACCURACY: Arc<Mutex<f32>> = Arc::new(Mutex::new(0.0));
    static ref TOTAL_FILES: AtomicU32 = AtomicU32::new(0);
    static ref PROCESSED_FILES: AtomicU32 = AtomicU32::new(0);
    static ref LATEST_SESSION: String = db::latest_session().unwrap();
}

/// Join `DEV_API_ENDPOINT` with a file name as a path segment.
/// Avoids `InvalidPort` from naive string concat when the base ends in `:port`.
fn build_scrape_url(base: &str, file_name: &str) -> Result<String, String> {
    let base = base.trim();
    if base.is_empty() {
        return Err("DEV_API_ENDPOINT is empty".to_string());
    }

    let mut url = Url::parse(base).map_err(|e| {
        format!(
            "Invalid DEV_API_ENDPOINT '{}': {}. Expected e.g. http://127.0.0.1:8000/api/scrape/",
            base, e
        )
    })?;

    let path = url.path().to_string();
    if !path.ends_with('/') {
        url.set_path(&format!("{}/", path));
    }

    // Encode the file name as a single path segment (spaces, unicode, etc.)
    let joined = url.join(file_name).map_err(|e| {
        format!(
            "Failed to join scrape URL from base '{}' and file '{}': {}",
            base, file_name, e
        )
    })?;

    Ok(joined.to_string())
}

pub fn stop_execution() {
    SHOULD_STOP.store(true, Ordering::Relaxed);
}

pub fn prepare_execution() {
    SHOULD_STOP.store(false, Ordering::Relaxed);
}

fn make_api_call<R: Runtime>(
    window: &tauri::Window<R>,
    endpoint: &str,
    path: &str,
    i: usize,
    id: u32,
    db_pool: &Arc<Mutex<Pool<SqliteConnectionManager>>>,
    settings_data: models::Settings,
    directory: &str,
    persist_session: bool,
    apply: bool,
) {
    // Perform a POST request using reqwest
    let client = Client::new();
    let req_url = match env::var("DEV_API_ENDPOINT") {
        Ok(val) => match build_scrape_url(&val, endpoint) {
            Ok(url) => url,
            Err(msg) => {
                error!("{}", msg);
                window
                    .emit(
                        "error_env",
                        Packet {
                            id: id,
                            status: models::Status::FAILED,
                            song_name: endpoint,
                            status_code: 405,
                            accuracy: 0.0,
                            error_message: msg.as_str(),
                        },
                    )
                    .unwrap();
                if !persist_session {
                    let _ = window.emit(
                        "scrape_song_result",
                        models::ScrapeSongResult {
                            path: path.to_string(),
                            file: endpoint.to_string(),
                            title: String::new(),
                            artist: String::new(),
                            album: String::new(),
                            year: 0,
                            track: 0,
                            genre: String::new(),
                            comments: String::new(),
                            album_artist: String::new(),
                            composer: String::new(),
                            discno: 0,
                            accuracy: 0.0,
                            applied: false,
                            success: false,
                            error_message: msg,
                        },
                    );
                }
                return;
            }
        },
        Err(_e) => {
            error!("Error: DEV_API_ENDPOINT environment variable not set.");
            window
                .emit(
                    "error_env",
                    Packet {
                        id: id,
                        status: models::Status::FAILED,
                        song_name: endpoint,
                        status_code: 405,
                        accuracy: 0.0,
                        error_message: "Error: DEV_API_ENDPOINT environment variable not set.",
                    },
                )
                .unwrap();
            if !persist_session {
                let _ = window.emit(
                    "scrape_song_result",
                    models::ScrapeSongResult {
                        path: path.to_string(),
                        file: endpoint.to_string(),
                        title: String::new(),
                        artist: String::new(),
                        album: String::new(),
                        year: 0,
                        track: 0,
                        genre: String::new(),
                        comments: String::new(),
                        album_artist: String::new(),
                        composer: String::new(),
                        discno: 0,
                        accuracy: 0.0,
                        applied: false,
                        success: false,
                        error_message: "DEV_API_ENDPOINT environment variable not set.".to_string(),
                    },
                );
            }
            return;
        }
    };

    info!("Scrape URL: {}", req_url);

    window
        .emit(
            "progress_start",
            Packet {
                id: id.clone(),
                status: models::Status::PROCESSING,
                song_name: endpoint,
                status_code: 300,
                accuracy: 0.0,
                error_message: "",
            },
        )
        .unwrap();

    TOTAL_FILES.fetch_add(1, Ordering::Relaxed);

    // Acquire a database connection from the pool only when persisting sessions
    let db_conn = if persist_session {
        Some(
            db_pool
                .lock()
                .unwrap()
                .get()
                .expect("Failed to get database connection"),
        )
    } else {
        None
    };

    info!("Request from {}, thread {}", endpoint, i);
    let overall_accuracy: f32;

    let data = json!({
        "searchParams": {
            "spotify": settings_data.spotify,
            "palm": settings_data.palm,
            "ytmusic": settings_data.ytmusic,
            "itunes": settings_data.itunes,
            "genius": settings_data.genius,
            "groq": settings_data.groq,
        },
        "useCache": settings_data.use_cache,
    });
    let data_string = serde_json::to_string(&data).unwrap();

    let cache_key = crate::services::scrape_cache::cache_key(path, &settings_data);
    let cached_value = crate::services::scrape_cache::get_cached_response(path, &settings_data);

    let api_response_result: Result<ApiResponse, String> = if let Some(value) = cached_value {
        info!("scrape cache hit for {}", endpoint);
        serde_json::from_value(value).map_err(|e| format!("Cached scrape deserialize: {e}"))
    } else {
        // Deduplicate in-flight requests for the same key
        if !crate::services::scrape_cache::try_begin_inflight(&cache_key) {
            thread::sleep(Duration::from_millis(150));
            if let Some(value) =
                crate::services::scrape_cache::get_cached_response(path, &settings_data)
            {
                info!("scrape cache hit after wait for {}", endpoint);
                match serde_json::from_value(value) {
                    Ok(r) => Ok(r),
                    Err(e) => Err(format!("Cached scrape deserialize: {e}")),
                }
            } else {
                Err("Duplicate scrape in flight; no cache yet".to_string())
            }
        } else {
            // Light jitter for remote rate limits (was a fixed 2s sleep)
            thread::sleep(Duration::from_millis(250));
            let http_result = client.post(&req_url).body(data_string).send();
            let parsed = match http_result {
                Ok(response) => {
                    if response.status().is_success() {
                        match response.text() {
                            Ok(text) => match serde_json::from_str::<serde_json::Value>(&text) {
                                Ok(value) => {
                                    crate::services::scrape_cache::put_cached_response(
                                        path,
                                        &settings_data,
                                        &value,
                                    );
                                    serde_json::from_value::<ApiResponse>(value)
                                        .map_err(|e| format!("Serialization failed: {e}"))
                                }
                                Err(err) => Err(format!("Serialization failed: {err:?}")),
                            },
                            Err(err) => Err(format!("Read body failed: {err}")),
                        }
                    } else {
                        Err(format!("HTTP {}", response.status()))
                    }
                }
                Err(err) => Err(format!("{err} (url: {req_url})")),
            };
            crate::services::scrape_cache::end_inflight(&cache_key);
            parsed
        }
    };

    match api_response_result {
        Ok(api_response) => {
            info!("Successful scrape response for {}, thread {}", endpoint, i);

            overall_accuracy = {
                let total_q = api_response.result.calls.total_queries.max(1) as f32;
                let ok_q = api_response.result.calls.successful_queries as f32;
                ((ok_q / total_q) * 100.0 * 100.0).round() / 100.0
            };

            PROCESSED_FILES.fetch_add(1, Ordering::Relaxed);
            let _ = match OVERALL_ACCURACY.lock() {
                Ok(mut accuracy_guard) => {
                    *accuracy_guard += overall_accuracy;
                }
                Err(poisoned) => {
                    error!("Mutex poisoned: {:?}", poisoned);
                    let mut accuracy_guard = poisoned.into_inner();
                    *accuracy_guard += overall_accuracy;
                }
            };

            if persist_session {
                if let Some(ref db_conn) = db_conn {
                    let query = format!(
                        "INSERT INTO {} (
                        file_name, 
                        path, 
                        directory,
                        title, 
                        artist, 
                        album, 
                        year, 
                        track, 
                        genre,
                        comment, 
                        album_artist, 
                        composer, 
                        discno, 
                        successfulFieldCalls,
                        successfulMechanismCalls,
                        successfulQueries,
                        totalFieldCalls,
                        totalMechanismCalls,
                        totalSuccessfulQueries,
                        album_art,
                        sessionName
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
                        db::latest_session().unwrap()
                    );

                    match db_conn.execute(
                        &query,
                        params![
                            endpoint,
                            path,
                            directory,
                            api_response.result.title,
                            api_response.result.artist,
                            api_response.result.data.album.value,
                            api_response.result.data.year.value,
                            api_response.result.data.track.value,
                            api_response.result.data.genre.value,
                            api_response.result.data.comments.value,
                            api_response.result.data.album_artist.value,
                            api_response.result.data.composer.value,
                            api_response.result.data.discno.value,
                            api_response.result.calls.successful_mechanism_calls,
                            api_response.result.calls.successful_mechanism_calls,
                            api_response.result.calls.successful_queries,
                            api_response.result.calls.total_mechanism_calls,
                            api_response.result.calls.total_mechanism_calls,
                            api_response.result.calls.total_queries,
                            path,
                            LATEST_SESSION.as_str()
                        ],
                    ) {
                        Ok(_) => {}
                        Err(err) => {
                            error!("Error inserting data into the database: {:?}", err);
                            return;
                        }
                    }
                    info!("Inserted data into the database");
                }
            } else {
                let mut applied = false;
                if apply {
                    let song = models::EditViewSongMetadata {
                        id: id.to_string(),
                        file: endpoint.to_string(),
                        path: path.to_string(),
                        artist: api_response.result.artist.clone(),
                        title: api_response.result.title.clone(),
                        album: api_response.result.data.album.value.clone(),
                        year: api_response.result.data.year.value.max(0) as u32,
                        track: api_response.result.data.track.value.max(0) as u32,
                        genre: api_response.result.data.genre.value.clone(),
                        comments: api_response.result.data.comments.value.clone(),
                        album_artist: api_response.result.data.album_artist.value.clone(),
                        composer: api_response.result.data.composer.value.clone(),
                        discno: api_response.result.data.discno.value.max(0) as u32,
                        image_src: String::new(),
                        percentage: 0,
                        status: "EDIT".to_string(),
                        session_name: "None".to_string(),
                    };
                    match crate::services::edit::edit_song_metadata(song, None) {
                        Ok(_) => {
                            applied = true;
                            if let Err(e) =
                                crate::services::library::refresh_track(path, Some(directory))
                            {
                                error!("library refresh after scrape apply failed: {e}");
                            }
                        }
                        Err(e) => error!("Failed to apply scraped tags: {}", e),
                    }
                }

                let _ = window.emit(
                    "scrape_song_result",
                    models::ScrapeSongResult {
                        path: path.to_string(),
                        file: endpoint.to_string(),
                        title: api_response.result.title.clone(),
                        artist: api_response.result.artist.clone(),
                        album: api_response.result.data.album.value.clone(),
                        year: api_response.result.data.year.value.max(0) as u32,
                        track: api_response.result.data.track.value.max(0) as u32,
                        genre: api_response.result.data.genre.value.clone(),
                        comments: api_response.result.data.comments.value.clone(),
                        album_artist: api_response.result.data.album_artist.value.clone(),
                        composer: api_response.result.data.composer.value.clone(),
                        discno: api_response.result.data.discno.value.max(0) as u32,
                        accuracy: overall_accuracy,
                        applied,
                        success: true,
                        error_message: String::new(),
                    },
                );
            }

            info!("Data Accuracy: {}", overall_accuracy);
            window
                .emit(
                    "progress_end",
                    Packet {
                        id: id.clone(),
                        status: models::Status::SUCCESS,
                        song_name: endpoint,
                        status_code: 200,
                        accuracy: overall_accuracy,
                        error_message: "",
                    },
                )
                .unwrap();
        }
        Err(err) => {
            error!(
                "Error scraping {} ({}), thread{}: {}",
                endpoint, req_url, i, err
            );
            if !persist_session {
                let _ = window.emit(
                    "scrape_song_result",
                    models::ScrapeSongResult {
                        path: path.to_string(),
                        file: endpoint.to_string(),
                        title: String::new(),
                        artist: String::new(),
                        album: String::new(),
                        year: 0,
                        track: 0,
                        genre: String::new(),
                        comments: String::new(),
                        album_artist: String::new(),
                        composer: String::new(),
                        discno: 0,
                        accuracy: 0.0,
                        applied: false,
                        success: false,
                        error_message: err.clone(),
                    },
                );
            }
            window
                .emit(
                    "progress_end",
                    Packet {
                        id: id.clone(),
                        status: models::Status::FAILED,
                        song_name: endpoint,
                        status_code: 500,
                        accuracy: 0.0,
                        error_message: err.as_str(),
                    },
                )
                .unwrap_or(());
        }
    }
}

pub fn threaded_execution<R: Runtime>(
    window: tauri::Window<R>,
    endpoints: Vec<String>,
    paths: Vec<String>,
    num_workers: usize,
    db_path: String,
    settings_data: models::Settings,
    directory: &str,
    persist_session: bool,
) -> Result<u32, ()> {
    let start_time = std::time::Instant::now();
    let apply = !persist_session && settings_data.scrape_mode == "apply";

    // Initialize the database pool only when persisting sessions
    let db_pool = if persist_session {
        let db_manager = SqliteConnectionManager::file(db_path);
        Arc::new(Mutex::new(
            Pool::new(db_manager).expect("Failed to create database connection pool"),
        ))
    } else {
        // Dummy in-memory pool unused when persist_session is false
        let db_manager = SqliteConnectionManager::memory();
        Arc::new(Mutex::new(
            Pool::new(db_manager).expect("Failed to create database connection pool"),
        ))
    };

    let total_tasks = endpoints.len();
    let completed_tasks = Arc::new(AtomicU32::new(0));
    let mut handles = vec![];
    let endpoints_arc = Arc::new(Mutex::new(endpoints));
    let paths_arc = Arc::new(Mutex::new(paths));
    let settings_arc = Arc::new(Mutex::new(settings_data));
    let direcotry_arc = Arc::new(Mutex::new(directory.to_string()));

    for i in 0..num_workers {
        let win = window.clone();
        let endpoints_clone = Arc::clone(&endpoints_arc);
        let paths_clone = Arc::clone(&paths_arc);
        let db_pool_clone = Arc::clone(&db_pool);
        let settings_clone = Arc::clone(&settings_arc);
        let directory_clone = Arc::clone(&direcotry_arc);
        let completed_tasks_clone = Arc::clone(&completed_tasks);

        let handle = thread::spawn(move || loop {
            if SHOULD_STOP.load(Ordering::Relaxed) {
                break;
            }
            let mut endpoints = endpoints_clone.lock().unwrap();
            let mut paths = paths_clone.lock().unwrap();

            if let Some(endpoint) = endpoints.pop() {
                let id = endpoints.len();
                if let Some(path) = paths.pop() {
                    drop(endpoints);
                    drop(paths);

                    let settings = settings_clone.lock().unwrap().clone();
                    let directory = directory_clone.lock().unwrap().clone();

                    make_api_call(
                        &win,
                        &endpoint,
                        &path,
                        i,
                        id.try_into().unwrap(),
                        &db_pool_clone,
                        settings,
                        directory.as_str(),
                        persist_session,
                        apply,
                    );

                    completed_tasks_clone.fetch_add(1, Ordering::Relaxed);
                } else {
                    break;
                }
            } else {
                break;
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        match handle.join() {
            Ok(_) => {
                info!("Thread completed successfully");
            }
            Err(e) => {
                error!("Thread failed with error: {:?}", e);                
            }
        }
    }

    info!("{:?}", completed_tasks.load(Ordering::Relaxed).to_string());

    while completed_tasks.load(Ordering::Relaxed) < total_tasks as u32 {
        thread::sleep(Duration::from_millis(50));
    }

    //Result Summary
    let elapsed_time = start_time.elapsed();
    info!("Threaded Execution Time: {:?}", elapsed_time.clone());
    let total = TOTAL_FILES.load(Ordering::Relaxed).max(1);
    let total_accuracy =
        (*OVERALL_ACCURACY.lock().unwrap() / total as f32) as f32;

    let session_label = if persist_session {
        db::latest_session().unwrap_or_else(|_| "".to_string())
    } else {
        String::new()
    };

    window
        .emit(
            "scrape_result",
            ScrapeResult {
                status: models::Status::SUCCESS,
                status_code: 200,
                error_message: "",
                overall_accuracy: total_accuracy,
                session_name: session_label.as_str(),
                total_files: TOTAL_FILES.load(Ordering::Relaxed),
                processed_files: PROCESSED_FILES.load(Ordering::Relaxed),
                time: &elapsed_time.as_secs_f64().to_string(),
            },
        )
        .unwrap();

    info!("Results emitted to the frontend");
    info!("Accuracy: {}", total_accuracy);

    Ok(elapsed_time.as_secs().try_into().unwrap())
}

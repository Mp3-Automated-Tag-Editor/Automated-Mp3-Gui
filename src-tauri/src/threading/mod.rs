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

/*
TODO:
- Retreive Threads number from settings.json file
- Build out API functionality to retreive Album Art as well for given album (Look into both solutions, either calling endpoint, or modifying current data)
- In place file editing
- Scrape Summary - emit function, then display summary componenets.
*/

use crate::db;
use crate::types::{self, ApiResponse, Packet, ScrapeResult};

static SHOULD_STOP: AtomicBool = AtomicBool::new(false);

// Thread-safe global variables
lazy_static::lazy_static! {
    static ref OVERALL_ACCURACY: Arc<Mutex<f32>> = Arc::new(Mutex::new(0.0));
    static ref TOTAL_FILES: AtomicU32 = AtomicU32::new(0);
    static ref PROCESSED_FILES: AtomicU32 = AtomicU32::new(0);
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
    settings_data: types::Settings,
    directory: &str
) {
    // Perform a POST request using reqwest
    let client = Client::new();
    // let req_url = env::var("DEV_API_ENDPOINT").unwrap().to_string() + endpoint;
    let req_url = match env::var("DEV_API_ENDPOINT") {
        Ok(val) => val + endpoint,
        Err(e) => {
            error!("Error: DEV_API_ENDPOINT environment variable not set.");
            window
                .emit(
                    "error_env",
                    Packet {
                        id: id,
                        status: types::Status::FAILED,
                        songName: endpoint,
                        statusCode: 405,
                        accuracy: 0.0,
                        errorMessage: "Error: DEV_API_ENDPOINT environment variable not set.",
                    },
                )
                .unwrap();
            return;
        }
    };

    window
        .emit(
            "progress_start",
            Packet {
                id: id.clone(),
                status: types::Status::PROCESSING,
                songName: endpoint,
                statusCode: 300,
                accuracy: 0.0,
                errorMessage: "",
            },
        )
        .unwrap();

    TOTAL_FILES.fetch_add(1, Ordering::Relaxed);

    thread::sleep(Duration::from_secs(2));

    // Acquire a database connection from the pool
    let db_conn = db_pool
        .lock()
        .unwrap()
        .get()
        .expect("Failed to get database connection");

    info!("Request from {}, thread {}", endpoint, i);
    let mut overall_accuracy: f32 = 0.0;
    // let mut accuracy_guard = OVERALL_ACCURACY.lock().unwrap();

    let data = json!({
        "searchParams": {
            "spotify": settings_data.spotify,
            "palm": settings_data.palm,
            "ytmusic": settings_data.ytmusic,
            "itunes": settings_data.itunes,
            "genius": settings_data.genius,
            "groq": settings_data.groq,
        },
        "useCache": true,
    });
    let data_string = serde_json::to_string(&data).unwrap();
    match client.post(&req_url).body(data_string).send() {
        Ok(response) => {
            if response.status().is_success() {
                let code: &u16 = &response.status().as_u16() as &u16;
                info!("Successful response from {}, thread {}", endpoint, i);

                let api_response: ApiResponse =
                    match serde_json::from_str(response.text().unwrap().as_str()) {
                        Ok(response) => response,
                        Err(err) => {
                            error!("Unsuccessful Serialization: {:?}", err);
                            window
                                .emit(
                                    "error_env",
                                    Packet {
                                        id: id,
                                        status: types::Status::FAILED,
                                        songName: endpoint,
                                        statusCode: 400,
                                        accuracy: 0.0,
                                        errorMessage: format!("Serialization failed: {:?}", err)
                                            .as_str(),
                                    },
                                )
                                .unwrap();
                            return;
                        }
                    };

                overall_accuracy = format!(
                    "{:.2}",
                    (api_response.result.calls.successfulQueries as f32)
                        / (api_response.result.calls.totalQueries) as f32
                        * 100.0
                )
                .parse()
                .unwrap();

                PROCESSED_FILES.fetch_add(1, Ordering::Relaxed);
                let mut accuracy_guard = match OVERALL_ACCURACY.lock() {
                    Ok(mut accuracy_guard) => {
                        *accuracy_guard += overall_accuracy; // Example modification
                    }
                    Err(poisoned) => {
                        error!("Mutex poisoned: {:?}", poisoned);
                        let mut accuracy_guard = poisoned.into_inner(); // Recover the data
                        *accuracy_guard += overall_accuracy; // Example modification
                    }
                };
                // *accuracy_guard += overall_accuracy;

                let query = format!(
                    "INSERT OR REPLACE INTO {} (
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
                        album_art
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)",
                    db::latest_session().unwrap()
                );

                let _ = db_conn
                    .execute(
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
                            api_response.result.data.albumArtist.value,
                            api_response.result.data.composer.value,
                            api_response.result.data.discno.value,
                            api_response.result.calls.successfulMechanismCalls,
                            api_response.result.calls.successfulMechanismCalls,
                            api_response.result.calls.successfulQueries,
                            api_response.result.calls.totalMechanismCalls,
                            api_response.result.calls.totalMechanismCalls,
                            api_response.result.calls.totalQueries,
                            path
                        ],
                    )
                    .expect("Error Inserting data");
                info!("Inserted data into the database");
                info!("Data Accuracy: {}", overall_accuracy);
                info!(
                    "api_response.result.calls.successfulQueries: {:?}",
                    api_response.result.calls.successfulQueries
                );
                info!(
                    "api_response.result.calls.totalQueries: {:?}",
                    api_response.result.calls.totalQueries
                );
            } else {
                error!(
                    "Unsuccessful response from {}, thread {}: {:?}",
                    endpoint, i, response
                );
            }
            window
                .emit(
                    "progress_end",
                    Packet {
                        id: id.clone(),
                        status: types::Status::SUCCESS,
                        songName: endpoint,
                        statusCode: 200,
                        accuracy: overall_accuracy,
                        errorMessage: "",
                    },
                )
                .unwrap();
        }
        Err(err) => {
            error!(
                "Error making request to {}, thread{}: {:?}",
                endpoint, i, err
            );
        }
    }
}

pub fn threaded_execution<R: Runtime>(
    window: tauri::Window<R>,
    endpoints: Vec<String>,
    paths: Vec<String>,
    num_workers: usize,
    db_path: String,
    settings_data: types::Settings,
    directory: &str
) -> Result<u32, ()> {
    let start_time = std::time::Instant::now();

    // Initialize the database pool
    let db_manager = SqliteConnectionManager::file(db_path);
    let db_pool = Arc::new(Mutex::new(
        Pool::new(db_manager).expect("Failed to create database connection pool"),
    ));

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
                        directory.as_str()
                    );
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

    //Result Summary
    let elapsed_time = start_time.elapsed();
    info!("Threaded Execution Time: {:?}", elapsed_time.clone());
    let total_accuracy =
        (*OVERALL_ACCURACY.lock().unwrap() / TOTAL_FILES.load(Ordering::Relaxed) as f32) as f32;


    window
        .emit(
            "scrape_result",
            ScrapeResult {
                status: types::Status::SUCCESS,
                status_code: 200,
                error_message: "",
                overall_accuracy: total_accuracy,
                session_name: db::latest_session().unwrap().as_str(),
                total_files: TOTAL_FILES.load(Ordering::Relaxed) - 1,
                processed_files: PROCESSED_FILES.load(Ordering::Relaxed) - 1,
                time: &elapsed_time.as_secs_f64().to_string(),
            },
        )
        .unwrap();

    info!("Results emitted to the frontend");
    info!("Accuracy: {}", total_accuracy);

    Ok(elapsed_time.as_secs().try_into().unwrap())
}

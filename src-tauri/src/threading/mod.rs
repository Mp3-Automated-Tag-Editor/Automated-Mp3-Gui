use log::{error, info};
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use reqwest;
use rusqlite::params;
use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
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

use crate::types::{self, ApiResponse, Packet};

static SHOULD_STOP: AtomicBool = AtomicBool::new(false);

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
) {
    // Perform a GET request using reqwest

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
                        accuracy: 0,
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
                accuracy: 0,
                errorMessage: "",
            },
        )
        .unwrap();

    thread::sleep(Duration::from_secs(2));

    // Acquire a database connection from the pool
    let db_conn = db_pool
        .lock()
        .unwrap()
        .get()
        .expect("Failed to get database connection");

    info!("Request from {}, thread {}", endpoint, i);
    let mut overall_accuracy: u32 = 0;
    match reqwest::blocking::get(req_url) {
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
                                        accuracy: 0,
                                        errorMessage: format!("Serialization failed: {:?}", err)
                                            .as_str(),
                                    },
                                )
                                .unwrap();
                            return;
                        }
                    };

                overall_accuracy = api_response.result.calls.successfulQueries / api_response.result.calls.totalQueries;

                let _ = db_conn.execute("INSERT INTO mp3_table_data (
                                file_name, 
                                path, 
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
                            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",params![
                                    endpoint,
                                    path,
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
                                ])
                    .expect("Error Inserting data");
                info!("Inserted data into the database");
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
) {
    // Initialize the database pool
    let db_manager = SqliteConnectionManager::file(db_path);
    let db_pool = Arc::new(Mutex::new(
        Pool::new(db_manager).expect("Failed to create database connection pool"),
    ));

    let mut handles = vec![];
    let endpoints_arc = Arc::new(Mutex::new(endpoints));
    let paths_arc = Arc::new(Mutex::new(paths));

    for i in 0..num_workers {
        let win = window.clone();
        let endpoints_clone = Arc::clone(&endpoints_arc);
        let paths_clone = Arc::clone(&paths_arc);
        let db_pool_clone = Arc::clone(&db_pool);

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
                    make_api_call(
                        &win,
                        &endpoint,
                        &path,
                        i,
                        id.try_into().unwrap(),
                        &db_pool_clone,
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
        handle.join().unwrap();
    }
}


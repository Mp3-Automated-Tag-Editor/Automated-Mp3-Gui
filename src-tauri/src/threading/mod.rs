use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use reqwest;
use rusqlite::{params, Connection};
use std::env;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Manager, Runtime, Window};

use crate::types::ApiResponse;
use crate::types::Window_Emit;

fn make_api_call<R: Runtime>(
    window: &tauri::Window<R>,
    endpoint: &str,
    path: &str,
    i: usize,
    id: u32,
    db_pool: &Arc<Mutex<Pool<SqliteConnectionManager>>>,
) {
    // Perform a GET request using reqwest

    let req_url = env::var("DEV_API_ENDPOINT").unwrap().to_string() + endpoint.clone();

    window
        .emit(
            "progress_start",
            Window_Emit {
                id: id.clone(),
                state: true,
                data: endpoint,
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

    match reqwest::blocking::get(req_url) {
        Ok(response) => {
            if response.status().is_success() {
                // Process the response if needed
                println!(
                    "Successful response from {}, thread {}",
                    endpoint.clone(),
                    i
                );

                let api_response: ApiResponse =
                    serde_json::from_str(response.text().unwrap().as_str())
                        .expect("Failed to deserialize JSON");

                let _ = db_conn
                    .execute(
                        "INSERT INTO mp3_table_data (file_name, path, title, artist, album) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![
                            endpoint,
                            path,
                            api_response.title,
                            api_response.artist,
                            api_response.data.album.value
                        ],
                    )
                    .expect("Error Inserting data");
                println!("Inserted data into the database");
            } else {
                println!(
                    "Unsuccessful response from {}, thread {}: {:?}",
                    endpoint, i, response
                );
            }
            window
                .emit(
                    "progress_end",
                    Window_Emit {
                        id: id.clone(),
                        state: false,
                        data: endpoint,
                    },
                )
                .unwrap();
        }
        Err(err) => {
            println!(
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

// pub fn non_threaded_execution(endpoints: Vec<&str>) {
//     for endpoint in endpoints {
//         make_api_call(endpoint, 1, 1);
//     }
// }

/*
                    ?4,
                    ?5,
                    ?6,
                    ?7,
                    ?8,
                    ?9,
                    ?10,
                    ?11,
                    ?12,
                    ?13,
                    ?14,
                    ?15,
                    ?16,
                    ?17

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
*/

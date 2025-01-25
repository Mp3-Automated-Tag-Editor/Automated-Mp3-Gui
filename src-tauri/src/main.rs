// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenv::dotenv;
use rusqlite::Result;
use std::env;
use std::fs;
use std::fs::{read_dir, File, OpenOptions};
use std::io::{Read, Write};
use std::time::Instant;
use tauri::{Manager, Runtime, Window};

mod db;
mod json;
mod threading;
mod types;
mod edit;

use log::debug;
use log::error;
use log::info;
use log::trace;
use log::warn;

// Main Func
fn main() {
    std::env::set_var("RUST_LOG", "trace");
    env_logger::init();

    dotenv().ok();

    trace!(
        "Environment Successfully Initialized: {}",
        env::var("ENV").unwrap()
    );

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            return_summary,
            get_network_data,
            get_server_health,
            start_scrape_process,
            stop_scrape_process,
            get_settings_data,
            save_settings,
            close_splashscreen,
            initialize_db,
            check_directory,
            read_music_directory,
            read_music_directory_paginated,
            read_music_directory_multithreaded,
            update_music_file,
            long_job,
            retrieve_all_sessions,
            retrieve_sessions_data
            // scan_paths
        ])
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            let splashscreen_window = app.get_window("splashscreen").unwrap();

            json::init();
            trace!("JSON Handlers Successfully Initialized");

            db::init();
            trace!("Database Successfully Initialized");

            // we perform the initialization code on a new task so the app doesn't freeze
            tauri::async_runtime::spawn(async move {
                // initialize your app here instead of sleeping :)
                trace!("Initializing Main Thread");

                std::thread::sleep(std::time::Duration::from_secs(1));
                trace!("Application Startup Successful");

                // After it's done, close the splashscreen and display the main window
                splashscreen_window.close().unwrap();
                main_window.show().unwrap();
            });

            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("failed to launch app");
}

// SplashScreen & Init Functions

#[tauri::command]
async fn close_splashscreen(window: Window) {
    // Close splashscreen
    window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found")
        .close()
        .unwrap();
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

// Save Settings

#[tauri::command]
fn save_settings(data: types::Settings) -> Result<(), ()> {
    let j = serde_json::to_string(&data);
    println!("{:?}", &j);
    let mut f = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(json::get_settings_path())
        .expect("Unable to create file");
    f.write_all(j.unwrap().as_bytes())
        .expect("Unable to write data");
    Ok(())
}

#[tauri::command]
async fn start_scrape_process<R: Runtime>(
    window: tauri::Window<R>,
    path_var: String,
) -> Result<u32, ()> {
    let file_names = db::get_file_names(path_var.clone()).await;
    let file_paths = db::get_file_paths(path_var.clone()).await;

    let settings_data = get_settings_data();

    let _ = db::init_table();

    let num_workers = settings_data.clone().threads as usize;

    threading::prepare_execution();
    let res = threading::threaded_execution(
        window,
        file_names.unwrap(),
        file_paths.unwrap(),
        num_workers,
        db::get_db_path(),
        settings_data,
        path_var.as_str()
    );

    Ok(res.unwrap())
}

#[tauri::command]
async fn stop_scrape_process() -> Result<(), ()> {
    info!("Stop Scrape Process function called");
    threading::stop_execution();
    info!("Stop Scrape Process function Success - Threads Stopped");
    Ok(())
}

#[tauri::command]
async fn return_summary() -> Result<String, ()> {
    Ok("Summary: ".to_string())
}

#[tauri::command]
fn check_directory(var: String) -> Result<(bool, usize), (bool, String)> {
    let paths = fs::read_dir(&var);
    
    match paths {
        Ok(entries) => {
            let mut mp3_count = 0;
            for entry in entries {
                match entry {
                    Ok(path) => {
                        let file_name = path.file_name();
                        if let Some(file_str) = file_name.to_str() {
                            if file_str.ends_with(".mp3") {
                                mp3_count += 1;
                            }
                        }
                    }
                    Err(_) => return Err((false, format!("This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped, Failed to read entry in directory: {}", var))),
                }
            }
            Ok((true, mp3_count))
        }
        Err(_) => Err((false, format!("This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped, Failed to read entry in directory: {}", var))),
    }
}

#[tauri::command]
async fn read_music_directory_multithreaded(directory: String) -> Result<Vec<types::EditViewSongMetadata>, String> {
    let directory_clone = directory.clone();
    let songs = tokio::task::spawn_blocking(move || {
        info!("dir: {}", directory_clone);
        let mut songs: Vec<types::EditViewSongMetadata> = Vec::new();
        let mut id_num = 0;
        let paths = fs::read_dir(directory_clone.clone()).unwrap();
        for path in paths {
            id_num += 1;
            let file_name = path.as_ref().unwrap().file_name();
            if file_name.clone().to_str().unwrap().ends_with(".mp3") {
                let file_path = directory_clone.clone() + "\\" + file_name.to_str().unwrap();
                match edit::get_details_for_song(&file_path, id_num, file_name.to_str().unwrap()) {
                    Ok(single_song) => songs.push(single_song),
                    Err(e) => return Err(e)
                }
            }
        }
        Ok(songs)
    }).await.map_err(|e| format!("Task failed: {:?}", e))??;
    Ok(songs)
}

#[tauri::command]
fn read_music_directory(directory: String) -> Result<Vec<types::EditViewSongMetadata>, String> {
    info!("dir: {}", directory);
    let mut songs: Vec<types::EditViewSongMetadata> = Vec::new();
    let mut id_num = 0;
    let paths: fs::ReadDir = fs::read_dir(directory.clone()).unwrap();
    for path in paths {
        id_num+=1;
        let file_name = path.as_ref().unwrap().file_name();
        if file_name.clone().to_str().unwrap().ends_with(".mp3") {
            let file_path = directory.clone() + "\\" + file_name.to_str().unwrap();
            match edit::get_details_for_song(&file_path, id_num, file_name.to_str().unwrap()) {
                Ok(single_song) => songs.push(single_song),
                Err(e) => return Err(e)
            }
        }
    }
    Ok(songs)
}

#[tauri::command]
fn read_music_directory_paginated(directory: String, page_number: usize, page_size: usize) -> Result<Vec<types::EditViewSongMetadata>, String> {
    info!("dir: {}", directory);
    let mut songs: Vec<types::EditViewSongMetadata> = Vec::new();

    let paths = fs::read_dir(directory.clone()).unwrap();
    let mut mp3_paths: Vec<String> = Vec::new();
    let mut mp3_file_name: Vec<String> = Vec::new();
    
    // Collect all mp3 file paths
    for path in paths {
        let file_name = path.as_ref().unwrap().file_name();
        if file_name.clone().to_str().unwrap().ends_with(".mp3") {
            let file_path = directory.clone() + "\\" + file_name.clone().to_str().unwrap();
            mp3_paths.push(file_path);
            mp3_file_name.push(file_name.to_str().unwrap().to_string());
        }
    }

    // Determine the range of songs for the requested page
    let start_index = page_number * page_size;
    let end_index = std::cmp::min(start_index + page_size, mp3_paths.len());

    if start_index >= mp3_paths.len() {
        return Ok(songs); // Return an empty vector if the start index is out of range
    }

    for i in start_index..end_index {
        match edit::get_details_for_song(&mp3_paths[i], i.try_into().unwrap(), &mp3_file_name[i]) {
            Ok(single_song) => songs.push(single_song),
            Err(e) => return Err(e)
        }
    }

    Ok(songs)
}


#[tauri::command]
fn retrieve_all_sessions() -> Result<Vec<types::Session>, String> {
    info!("Retrieving all sessions");
    let sessions = db::retrieve_all_sessions();
    Ok(sessions.unwrap())
}

#[tauri::command]
fn retrieve_sessions_data(session: String) -> Result<Vec<types::EditViewSongMetadata>, String> {
    info!("Retrieving session metadata for session: {}", session);
    let session_data = db::retrieve_session_data(session.as_str());
    Ok(session_data.unwrap())
}

#[tauri::command]
fn update_music_file(path: String, song: types::EditViewSongMetadata) -> (bool, String) {
    info!("dir: {}", path);
    match edit::edit_song_metadata(song) {
        Ok(_) => (true, "Successfully Saved Song Details".to_owned()),
        Err(message) => (false, message)
    }
}

// #[derive(Serialize, Deserialize, Clone, Debug)]
// struct ScanPathsEvent {
//     paths: Vec<String>,
//     recursive: bool,
// }

// #[derive(Serialize, Deserialize, Clone, Debug)]
// struct ToImportEvent {
//     songs: Vec<Song>,
//     progress: u8,
//     error: Option<String>,
// }

// #[tauri::command]
// async fn scan_paths(event: ScanPathsEvent, app_handle: tauri::AppHandle) -> ToImportEvent {
//     // println!("scan_paths", event);
//     let songs: Arc<std::sync::Mutex<Vec<Song>>> = Arc::new(Mutex::new(Vec::new()));

//     event.paths.par_iter().for_each(|p| {
//         let path = Path::new(p.as_str());
//         // println!("{:?}", path);

//         if path.is_file() {
//             if let Some(song) = crate::metadata::extract_metadata(&path, true) {
//                 songs.lock().unwrap().push(song);
//             }
//         } else if path.is_dir() {
//             if let Some(sub_songs) = process_directory(Path::new(path), &songs, event.recursive) {
//                 songs.lock().unwrap().extend(sub_songs);
//             }
//         }
//     });

//     // Print the collected songs for demonstration purposes
//     // for song in songs.lock().unwrap().clone(){
//     //     println!("{:?}", song);
//     // }

//     let length = songs.lock().unwrap().clone().len();
//     if length > 500 {
//         let songs_clone = songs.lock().unwrap();
//         let enumerator = songs_clone.chunks(200);
//         let chunks = enumerator.len();
//         enumerator.into_iter().enumerate().for_each(|(idx, slice)| {
//             thread::sleep(time::Duration::from_millis(1000));
//             let progress = if idx == chunks - 1 {
//                 100
//             } else {
//                 u8::min(
//                     ((slice.len() * (idx + 1)) as f64 / length as f64).mul(100.0) as u8,
//                     100,
//                 )
//             };
//             println!("{:?}", progress);
//             let _ = app_handle.emit_all(
//                 "import_chunk",
//                 ToImportEvent {
//                     songs: slice.to_vec(),
//                     progress: progress,
//                     error: None,
//                 },
//             );
//         });
//         ToImportEvent {
//             songs: songs.lock().unwrap().clone(),
//             progress: 100,
//             error: None,
//         }
//     } else {
//         let _ = app_handle.emit_all(
//             "import_chunk",
//             ToImportEvent {
//                 songs: songs.lock().unwrap().clone(),
//                 progress: 100,
//                 error: None,
//             },
//         );
//         ToImportEvent {
//             songs: songs.lock().unwrap().clone(),
//             progress: 100,
//             error: None,
//         }
//     }
// }


#[tauri::command(rename_all = "snake_case")]
async fn initialize_db<R: Runtime>(window: tauri::Window<R>, path_var: String) -> Result<u32, ()> {
    println!("Started Build");
    // let _ = db::db_populate(path_var.clone()).await;
    let num_paths: u32 = read_dir(path_var).unwrap().count().try_into().unwrap();
    std::thread::sleep(std::time::Duration::from_secs(2));
    window.emit("db_init_paths", num_paths).unwrap();
    Ok(num_paths)
}

// Old Tauri Functions

#[tauri::command]
fn get_settings_data() -> types::Settings {
    let mut file = File::open(json::get_settings_path()).expect("Unable to open");

    // Read the file content into a String
    let mut content = String::new();
    file.read_to_string(&mut content).expect("Unable to Read");

    // Deserialize the JSON content into your struct
    let parsed_json: types::Settings =
        serde_json::from_str(&content).expect("JSON was not well-formatted");
    parsed_json
}

#[tauri::command]
async fn get_network_data() -> Result<types::Network_Details, String> {
    let check_url = "https://www.google.com/";
    let req_url = format!(
        "{}{}",
        env::var("HEALTH_ENDPOINT").expect("Env Not set"),
        "health"
    );
    // Check if connected to a network
    let if_connected = reqwest::get(check_url).await.is_ok();

    info!("Network Connected: {}", if_connected);
    if !if_connected {
        error!("Network Connected: Failed");
        return Ok(types::Network_Details {
            if_connected: false,
            speed: 0,
            latency: 0,
        });
    }

    let start_time = Instant::now();
    let _ = reqwest::get(req_url).await.is_ok();
    let elapsed_time = start_time.elapsed();

    info!("Completed Network Checks");
    Ok(types::Network_Details {
        if_connected: true,
        speed: 0,
        latency: elapsed_time.as_millis() as u32,
    })
}

#[tauri::command]
async fn get_server_health() -> Result<types::Server_Health, String> {
    let req_url = format!(
        "{}{}",
        env::var("HEALTH_ENDPOINT").expect("Env Not set"),
        "health"
    );

    let response_result = reqwest::get(req_url).await;

    match response_result {
        Ok(response) => {
            if response.status().is_success() {
                let body_bytes_result = response.bytes().await;
                debug!("{:?}", body_bytes_result);

                match body_bytes_result {
                    Ok(body_bytes) => {
                        let data_result: Result<types::Server_Health, _> =
                            serde_json::from_slice(&body_bytes);
                        match data_result {
                            Ok(data) => {
                                info!("Server Health Checks - success");
                                Ok(data)
                            }
                            Err(err) => {
                                info!("Server Health Checks - failed");
                                Ok(types::Server_Health {
                                    status: 400,
                                    message: format!("Failed to deserialize data: {}", err),
                                })
                            }
                        }
                    }
                    Err(err) => {
                        info!("Server Health Checks - failed");
                        Err(format!("Failed to read response body: {}", err))
                    }
                }
            } else {
                info!("Server Health Checks - failed");
                Ok(types::Server_Health {
                    status: 400,
                    message: format!("Request failed with status code: {}", response.status()),
                })
            }
        }
        Err(err) => Err(format!("Failed to fetch data: {}", err)), // Return error if request fails
    }
}

#[tauri::command]
async fn long_job<R: Runtime>(window: tauri::Window<R>) {
    println!("Hello from BE");
    for i in 0..101 {
        // println!("{}", i.clone());
        window.emit("progress", i).unwrap();
        // window.emit("confirmation", i).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
}

// Tests

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use std::fs;
//     use std::io::Write;

//     #[test]
//     fn test_add() {
//         assert_eq!(1 + 1, 2);
//     }

// #[test]
// fn test_save_settings() {
//     let data = types::Settings { /* Initialize settings data for testing */ };
//     // Test saving settings
//     assert!(save_settings(data.clone()).is_ok());

//     // Verify the settings file content
//     let content = fs::read_to_string(json::get_settings_path()).unwrap();
//     let parsed_settings: types::Settings = serde_json::from_str(&content).unwrap();
//     assert_eq!(parsed_settings, data);
// }

// #[test]
// fn test_check_directory() {
//     // Create a temporary directory and write a test file inside it
//     let temp_dir = tempfile::tempdir().unwrap();
//     let test_file_path = temp_dir.path().join("test.mp3");
//     let mut test_file = File::create(&test_file_path).unwrap();
//     test_file.write_all(b"test content").unwrap();

//     // Test checking directory
//     assert!(check_directory(temp_dir.path().to_str().unwrap().to_string()).unwrap());

//     // Clean up: remove the temporary directory
//     temp_dir.close().unwrap();
// }

// #[test]
// fn test_save_settings() {
//     let data = types::Settings { /* Initialize settings data for testing */ };
//     // Test saving settings
//     assert!(save_settings(data.clone()).is_ok());

//     // Verify the settings file content
//     let content = fs::read_to_string(json::get_settings_path()).unwrap();
//     let parsed_settings: types::Settings = serde_json::from_str(&content).unwrap();
//     assert_eq!(parsed_settings, data);
// }

// #[test]
// fn test_initialize_db() {
//     // Test with valid input
//     let window: tauri::Window = /* Initialize window */;
//     let path_var = /* Provide valid path */;
//     assert!(initialize_db(window.clone(), path_var.clone()).is_ok());

//     // Test with invalid input
//     assert!(initialize_db(window.clone(), "".to_string()).is_err());
// }

// #[test]
// fn test_get_settings_data() {
//     // Create a temporary settings file with known content
//     let temp_dir = tempfile::tempdir().unwrap();
//     let settings_path = temp_dir.path().join("settings.json");
//     let mut settings_file = File::create(&settings_path).unwrap();
//     let data = /* Initialize known settings data */;
//     let data_str = serde_json::to_string(&data).unwrap();
//     settings_file.write_all(data_str.as_bytes()).unwrap();

//     // Test getting settings data
//     assert_eq!(get_settings_data(), data);

//     // Clean up: remove the temporary settings file
//     temp_dir.close().unwrap();
// }

// #[test]
// fn test_long_job() {
//     // Test long job (no assertions, just ensure it runs without error)
//     let window: tauri::Window = /* Initialize window */;
//     long_job(window.clone());
// }
// }

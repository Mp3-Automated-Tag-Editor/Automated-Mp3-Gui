// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenv::dotenv;
use rusqlite::Result;
use std::env;
use std::fs;
use std::fs::{read_dir, File, OpenOptions};
use std::io::{Read, Write};
use tauri::{Manager, Runtime, Window};

mod db;
mod json;
mod threading;
mod types;

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
            get_server_health,
            start_scrape_process,
            get_settings_data,
            save_settings,
            close_splashscreen,
            initialize_db,
            check_directory,
            long_job
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
    let file_paths = db::get_file_paths(path_var).await;

    let num_workers = 2;

    let start_time = std::time::Instant::now();
    threading::threaded_execution(
        window,
        file_names.unwrap(),
        file_paths.unwrap(),
        num_workers,
        db::get_db_path(),
    );
    let elapsed_time = start_time.elapsed();

    println!("Threaded Execution Time: {:?}", elapsed_time);
    Ok(elapsed_time.as_secs().try_into().unwrap())
}

#[tauri::command]
fn check_directory(var: String) -> Result<bool, bool> {
    // println!("Started Directory Check @{}", var.clone());
    let paths = fs::read_dir(var.clone()).unwrap();
    for path in paths {
        let file_name = path.as_ref().unwrap().file_name();
        if file_name.clone().to_str().unwrap().ends_with(".mp3") {
            return Ok(true);
        }
    }
    Ok(false)
}

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

// #[tauri::command]
// fn get_network_data() -> types::Network_Details {

// }

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
                            Ok(data) => Ok(data),
                            Err(err) => Err(format!("Failed to deserialize data: {}", err)),
                        }
                    }
                    Err(err) => Err(format!("Failed to read response body: {}", err)),
                }
            } else {
                // Return an error if the response is not successful
                Err(format!(
                    "Request failed with status code: {}",
                    response.status()
                ))
            }
        }
        Err(err) => Err(format!("Failed to fetch data: {}", err)), // Return error if request fails
    }

    //     if response.status().is_success() {
    //         let parsed_json: types::Server_Health = serde_json::from_str(response.js).expect("JSON was not well-formatted");
    //         Ok(parsed_json)
    //     } else {
    //         Err(format!("Server returned non-success status code: {}", response.status()))
    //     }
    // }
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

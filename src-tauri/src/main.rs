// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window, Runtime};
use std::fs;
use std::fs::{read_dir,OpenOptions, File};
use std::io::{Read, Write};
use std::env;
use rusqlite::{Result};
use dotenv::dotenv;

mod types;
mod db;
mod json;
mod threading;

// Main Func

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![start_scrape_process, get_settings_data, save_settings, close_splashscreen, initialize_db, check_directory, long_job])
    .setup(|app| {
      dotenv().ok();

      let main_window = app.get_window("main").unwrap();
      let splashscreen_window = app.get_window("splashscreen").unwrap();

      json::init();
      db::init();

      // we perform the initialization code on a new task so the app doesn't freeze
      tauri::async_runtime::spawn(async move {
        // initialize your app here instead of sleeping :)
        println!("Initializing...");
        std::thread::sleep(std::time::Duration::from_secs(1));
        println!("Done initializing.");

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
  window.get_window("splashscreen").expect("no window labeled 'splashscreen' found").close().unwrap();
  // Show main window
  window.get_window("main").expect("no window labeled 'main' found").show().unwrap();
}

// Save Settings

#[tauri::command]
fn save_settings(data: types::Settings) -> Result<(), ()> {
    let j = serde_json::to_string(&data);
    println!("{:?}", &j);
    let mut f = OpenOptions::new().write(true).truncate(true).open(json::get_settings_path()).expect("Unable to create file");
    f.write_all(j.unwrap().as_bytes()).expect("Unable to write data");
    Ok(())
}

#[tauri::command]
async fn start_scrape_process<R: Runtime>(window: tauri::Window<R>, path_var: String) -> Result<u32, ()> {
    let file_names = db::get_file_names(path_var.clone()).await;
    let file_paths = db::get_file_paths(path_var).await;

    let num_workers = 2;

    let start_time = std::time::Instant::now();
    threading::threaded_execution(window, file_names.unwrap(), file_paths.unwrap(), num_workers, db::get_db_path());
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
            return Ok(true)
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
    let parsed_json: types::Settings = serde_json::from_str(&content).expect("JSON was not well-formatted");
    parsed_json
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
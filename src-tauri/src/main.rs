// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window, Runtime};
use rusqlite::{Connection, Result};
// use std::collections::HashMap;
// use id3::{Tag, TagLike};
use std::error::Error;
use std::fs;
use std::path::Path;
use std::fs::{read_dir,OpenOptions, File, write};
use std::io::{Read, Write};
use std::io;
use serde::{Serialize, Deserialize};

mod json;

#[tauri::command]
async fn close_splashscreen(window: Window) {
  // Close splashscreen
  window.get_window("splashscreen").expect("no window labeled 'splashscreen' found").close().unwrap();
  // Show main window
  window.get_window("main").expect("no window labeled 'main' found").show().unwrap();
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_settings_data, save_settings, close_splashscreen, set_db, check_directory, long_job])
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      let splashscreen_window = app.get_window("splashscreen").unwrap();
    //   json::init();
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

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Settings {
    threads: i32,
    test: String,
    developer_settings: bool
}

// #[derive(Deserialize, Debug)]
// #[serde(tag = "type", rename_all = "camelCase")]
// enum Profile {
//     Personal {
//         id: i32,
//         details: PersonalDetails,
//     },
//     Business {
//         id: i32,
//         details: BusinessDetails,
//     },
// }

#[tauri::command]
fn get_settings_data() -> Settings {

    let mut file = File::open(json::get_settings_path()).expect("Unable to open");

    // Read the file content into a String
    let mut content = String::new();
    file.read_to_string(&mut content).expect("Unable to Read");

    // Deserialize the JSON content into your struct
    let parsed_json: Settings = serde_json::from_str(&content).expect("JSON was not well-formatted");
    parsed_json
}

#[tauri::command]
fn save_settings(data: Settings) -> Result<(), ()> {
    let j = serde_json::to_string(&data);
    println!("{:?}", &j);
    let mut f = OpenOptions::new().write(true).truncate(true).open(json::get_settings_path()).expect("Unable to create file");
    f.write_all(j.unwrap().as_bytes()).expect("Unable to write data");

    Ok(())
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
async fn set_db(path_var: String) -> Result<(), ()> {
    println!("Started Build");
    let num_paths = db_build(path_var.clone()).await;
    let test2_ = db_populate(path_var).await;
    println!("Completed Build {:?} {:?}", num_paths, test2_);
    Ok(())
}

async fn db_populate(path_var: String) -> Result<()> {
    let paths = fs::read_dir(path_var.clone()).unwrap();
    let conn = Connection::open("./.userData/Mp3data.db")?;
    println!("From DB populate");
    for path in paths {
        // let tag = Tag::read_from_path(path.as_ref())?;
        let file_name = path.as_ref().unwrap().file_name();
        let path_value = path.as_ref().unwrap().path();
        
        //Dont send into DB until API request has been made, then send ALL data. After that, send result to frontend - if successfull - begin preview screen, else show error

        let _ = conn.execute("INSERT INTO mp3_table_data (
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
        ) VALUES (
            ?1,
            ?2,
            NULL,
            NULL,
            NULL,
            0,
            0,
            NULL,
            NULL,
            NULL,
            NULL,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            NULL
        )",(file_name.into_string().unwrap(), path_value.to_str().unwrap()));
    }

    println!("Process Completed @: {}", path_var);
    Ok(())
}

async fn db_build(path_var: String) -> Result<u32> {
    // let test = File::create(".userdata/Mp3data.db")?;
    // println!("{:?}", test);
    let conn = Connection::open("./.userData/Mp3data.db")?;
    let _ = conn.execute("drop table if exists mp3_table_data",(),);

    let _ = conn.execute(
        "create table if not exists mp3_table_data (
             id INTEGER PRIMARY KEY, 
             file_name TEXT not null unique, 
             path TEXT not null unique, 
             title TEXT, 
             artist TEXT, 
             album TEXT, 
             year NUMBER, 
             track NUMBER, 
             genre TEXT, 
             comment TEXT, 
             album_artist TEXT, 
             composer TEXT, 
             discno NUMBER, 
             successfulFieldCalls NUMBER,
             successfulMechanismCalls NUMBER,
             successfulQueries NUMBER,
             totalFieldCalls NUMBER,
             totalMechanismCalls NUMBER,
             totalSuccessfulQueries NUMBER,
             album_art TEXT
         )",
        (), // &[&path_var.to_string()]
    );
    let paths = read_dir(path_var).unwrap();
    let num_paths: u32 = paths.count().try_into().unwrap();
    println!("Created Table, Total Files: {}", num_paths.clone());

    Ok(num_paths)
}
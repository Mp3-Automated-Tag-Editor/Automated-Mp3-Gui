// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window};
use rusqlite::{Connection, Result};
// use std::collections::HashMap;
// use id3::{Tag, TagLike};
use std::fs;

#[tauri::command]
async fn close_splashscreen(window: Window) {
  // Close splashscreen
  window.get_window("splashscreen").expect("no window labeled 'splashscreen' found").close().unwrap();
  // Show main window
  window.get_window("main").expect("no window labeled 'main' found").show().unwrap();
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![close_splashscreen, set_db, check_directory])
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      let splashscreen_window = app.get_window("splashscreen").unwrap();
      // we perform the initialization code on a new task so the app doesn't freeze
      tauri::async_runtime::spawn(async move {
        // initialize your app here instead of sleeping :)
        println!("Initializing...");
        std::thread::sleep(std::time::Duration::from_secs(7));
        println!("Done initializing.");

        // After it's done, close the splashscreen and display the main window
        splashscreen_window.close().unwrap();
        main_window.show().unwrap();
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("failed to launch app");
}

// #[derive(Debug)]
// struct Cat {
//     name: String,
//     color: String,
// }

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
    let test = db_build().await;
    let test2_ = db_populate(path_var).await;
    println!("Completed Build {:?} {:?}", test, test2_);
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

    println!("Path Variable: {}", path_var);
    Ok(())
}

async fn db_build() -> Result<()> {
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

    println!("Created Table");

    Ok(())
}
use chrono::Local;
use rusqlite::{Connection, Result};
use std::fs;
use std::path::Path;

use log::info;

pub fn init() {
    if !db_file_exists() {
        let _ = create_db_file();
    }

    match manage_table() {
        Ok(_) => info!("Table management successful"),
        Err(e) => eprintln!("Error managing tables: {}", e),
    }
}

fn create_db_file() -> Result<()> {
    let _ = Connection::open(get_db_path())?;
    info!("Database file created successfully");
    Ok(())
}

fn db_file_exists() -> bool {
    let db_path = get_db_path();
    Path::new(&db_path).exists()
}

pub fn get_db_path() -> String {
    let home_dir = dirs::home_dir().unwrap();
    home_dir.to_str().unwrap().to_string() + r"/.config/auto-mp3/Mp3data.db"
}

pub fn latest_session() -> Result<String> {
    let conn = Connection::open(get_db_path())?;
    let mut latest_table = None;
    let today = Local::now().format("%d_%m_%Y").to_string();

    // Find the latest table (Session) for the day
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ? ORDER BY name DESC LIMIT 1"
    )?;
    let pattern = format!("t_{}_session_%", today); // Add 't_' prefix to the pattern
    let table_iter = stmt.query_map([&pattern], |row| row.get(0))?;

    for table in table_iter {
        let table_name: String = table.unwrap();
        latest_table = Some(table_name);
        break;
    }

    Ok(latest_table.unwrap())
}


fn manage_table() -> Result<()> {
    let conn = Connection::open(get_db_path())?;
    let today = Local::now().format("%d_%m_%Y").to_string();

    let mut session_number = 1;
    let mut latest_table = None;

    // Find the latest table for the day
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ? ORDER BY name DESC LIMIT 1"
    )?;
    let pattern = format!("t_{}_session_%", today); // Add 't_' prefix to the pattern
    let table_iter = stmt.query_map([&pattern], |row| row.get(0))?;

    for table in table_iter {
        let table_name: String = table?;
        latest_table = Some(table_name);
        break;
    }

    if let Some(latest_table) = latest_table {
        // Check if the latest table is from the same date and has data
        let has_data: bool = conn
            .prepare(&format!("SELECT EXISTS(SELECT 1 FROM {} LIMIT 1)", latest_table))?
            .query_row([], |row| row.get(0))?;

        if has_data {
            session_number+=1;
            info!("Creating New Session: {}", session_number);
        } else {
            // Drop the latest table if it's empty and create a new one
            conn.execute(&format!("DROP TABLE {}", latest_table), [])?;
            info!("Dropped empty table: {}", latest_table);
        }
    }

    // Create a new table for the current session
    loop {
        let table_name = format!("t_{}_session_{}", today, session_number); // Add 't_' prefix

        // Check if the table already exists
        let table_exists = conn
            .prepare(&format!(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
            ))?
            .exists(&[&table_name])?;

        if !table_exists {
            // Create the new table
            conn.execute(&format!(
                "CREATE TABLE {} (
                     id INTEGER PRIMARY KEY, 
                     file_name TEXT UNIQUE, 
                     path TEXT UNIQUE, 
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
                table_name
            ), [])?;

            info!("Created new table: {}", table_name);
            return Ok(());
        }

        session_number += 1;
    }
}


// pub async fn db_populate(path_var: String) -> Result<(Vec<String>)> {
//     let paths = fs::read_dir(path_var.clone()).unwrap();
//     let conn = Connection::open(get_db_path())?;

//     let mut file_names: Vec<String> = Vec::new();
//     let mut file_paths: Vec<String> = Vec::new();

//     println!("From DB populate");
//     for path in paths {
//         // let tag = Tag::read_from_path(path.as_ref())?;
//         let file_name = path.as_ref().unwrap().file_name();
//         let path_value = path.as_ref().unwrap().path();

//         file_names.push(file_name.clone().into_string().unwrap());
//         file_paths.push(path_value.clone().into_os_string());

        
//         //Dont send into DB until API request has been made, then send ALL data. After that, send result to frontend - if successfull - begin preview screen, else show error

//         let _ = conn.execute("INSERT INTO mp3_table_data (
//             file_name, 
//             path, 
//             title, 
//             artist, 
//             album, 
//             year, 
//             track, 
//             genre,
//             comment, 
//             album_artist, 
//             composer, 
//             discno, 
//             successfulFieldCalls,
//             successfulMechanismCalls,
//             successfulQueries,
//             totalFieldCalls,
//             totalMechanismCalls,
//             totalSuccessfulQueries,
//             album_art
//         ) VALUES (
//             ?1,
//             ?2,
//             NULL,
//             NULL,
//             NULL,
//             0,
//             0,
//             NULL,
//             NULL,
//             NULL,
//             NULL,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             0,
//             NULL
//         )",(file_name.into_string().unwrap(), path_value.to_str().unwrap()));
//     }

//     println!("Process Completed @: {}", path_var);
//     Ok(file_names)
// }

pub async fn get_file_names(path_var: String) -> Result<Vec<String>> {
    let paths = fs::read_dir(path_var.clone()).unwrap();
    let _conn = Connection::open(get_db_path()).expect("Cannot Connect to DB");

    let mut file_names: Vec<String> = Vec::new();

    for path in paths {
        let file_name = path.as_ref().unwrap().file_name();
        file_names.push(file_name.clone().into_string().unwrap());
    }

    Ok(file_names)
}

pub async fn get_file_paths(path_var: String) -> Result<Vec<String>> {
    let paths = fs::read_dir(path_var.clone()).unwrap();
    let _conn = Connection::open(get_db_path()).expect("Cannot Connect to DB");

    let mut file_paths: Vec<String> = Vec::new();

    for path in paths {
        file_paths.push(path.as_ref().unwrap().path().display().to_string());
    }

    Ok(file_paths)
}
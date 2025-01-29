use chrono::Local;
use rusqlite::{Connection, Result};
use std::fs;
use std::path::Path;
use rand::Rng;
use log::info;

use crate::types;

pub fn init() {
    if !db_file_exists() {
        let _ = create_db_file();
    }
}

pub fn init_table() {
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

pub fn retrieve_session_data(table_name: &str) -> Result<Vec<types::EditViewSongMetadata>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| format!("Failed to open database: {}", e))?;
    let mut metadata_list = Vec::new();

    let query = format!("SELECT id, file_name, artist, title, album, path, year, track, genre, comment, album_artist, composer, discno, album_art, successfulQueries, totalsuccessfulQueries FROM {}", table_name);

    let mut stmt = conn.prepare(&query).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let rows = stmt.query_map([], |row| {
        let successful_calls: u32 = row.get(14)?;
        let total_calls: u32 = row.get(15)?;
        let percentage = if total_calls > 0 {
            (successful_calls * 100) / total_calls
        } else {
            0
        };

        Ok(types::EditViewSongMetadata {
            id: row.get::<_, i32>(0)?.to_string(),
            file: row.get(1)?,
            artist: row.get(2)?,
            title: row.get(3)?,
            album: row.get(4)?,
            path: row.get(5)?,
            year: row.get::<_, Option<u32>>(6)?.unwrap_or(0),
            track: row.get::<_, Option<u32>>(7)?.unwrap_or(0),
            genre: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
            comments: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
            albumArtist: row.get::<_, Option<String>>(10)?.unwrap_or_default(),
            composer: row.get::<_, Option<String>>(11)?.unwrap_or_default(),
            discno: row.get::<_, Option<u32>>(12)?.unwrap_or(0),
            imageSrc: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
            percentage,
            status: "EDIT".to_string(),
            sessionName: table_name.to_string(),
        })
    }).map_err(|e| format!("Failed to query rows: {}", e))?;

    for row in rows {
        metadata_list.push(row.map_err(|e| format!("Failed to process row: {}", e))?);
    }

    info!("Retrieved {} records from table: {}", metadata_list.len(), table_name);

    Ok(metadata_list)
}


pub fn retrieve_all_sessions() -> Result<Vec<types::Session>> {
    info!("Hello");
    let conn = Connection::open(get_db_path())?;
    let mut sessions = Vec::new();
    info!("Hello");
    // Query to find all session tables
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 't_%_session_%' ORDER BY name DESC",
    )?;

    let table_iter = stmt.query_map([], |row| row.get(0))?;

    for table in table_iter {
        let table_name: String = table?;
        // Extract date and session number from the table name
        if let Some((date, session_number)) = parse_table_name(&table_name) {
            // Query to get the total and processed files
            let path = conn.query_row::<String, _, _>(
                &format!("SELECT directory FROM {} LIMIT 1", table_name),
                [],
                |row| row.get(0),
            ).unwrap_or_default();

            let total_files = conn.query_row::<u32, _, _>(
                &format!("SELECT COUNT(*) FROM {}", table_name),
                [],
                |row| row.get(0),
            ).unwrap_or(0);
            let session = types::Session {
                id: generate_random_id(),
                table_name: table_name.clone(),
                date,
                session_number,
                custom_name: "".to_string(),
                path,
                total_files,
                processed_files: total_files, // Assuming processed == total
            };

            info!("Retrieved session: {:?}", session);

            sessions.push(session);
        }
    }

    Ok(sessions)
}

fn parse_table_name(table_name: &str) -> Option<(String, u32)> {
    // Expect table name format: t_<date>_session_<number>
    let parts: Vec<&str> = table_name.split('_').collect();
    if parts.len() >= 4 && parts[0] == "t" && parts[4] == "session" {
        let date = parts[1].to_string() + "-" + parts[2] + "-" + parts[3];
        if let Ok(session_number) = parts[5].parse::<u32>() {
            return Some((date, session_number));
        }
    }
    None
}

fn generate_random_id() -> String {
    let mut rng = rand::thread_rng();
    let id: u128 = rng.gen();
    id.to_string()
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
            .prepare(&format!("SELECT EXISTS(SELECT 1 FROM \"{}\" LIMIT 1)", latest_table))?
            .query_row([], |row| row.get(0))?;
        if has_data {
            // If the latest table has data, create a new table with an incremented session number
            session_number = latest_table
                .rsplit('_')
                .next()
                .and_then(|n| n.parse::<u32>().ok())
                .unwrap_or(0)
                + 1;
        } else {
            let latest_date = latest_table.split('_').take(3).collect::<Vec<_>>().join("_").get(..).map_or(String::new(), |s| s.to_string());
            if latest_date == today {
                // If the latest table is from today and has no data, reuse it
                info!("Reusing existing table without data: {}", latest_table);
                return Ok(());
            } else {
                // If the latest table is from a different day and has no data, drop it
                conn.execute(&format!("DROP TABLE {}", latest_table), [])?;
                info!("Dropped empty table from a different day: {}", latest_table);
            }
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
                     id INTEGER PRIMARY KEY AUTOINCREMENT, 
                     file_name TEXT UNIQUE, 
                     path TEXT UNIQUE, 
                     directory TEXT,
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
                     album_art TEXT,
                     sessionName TEXT
                 )",
                table_name
            ), [])?;

            info!("Created new table: {}", table_name);
            return Ok(());
        }

        session_number += 1;
    }
}

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
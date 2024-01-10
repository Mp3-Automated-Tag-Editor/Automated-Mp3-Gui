use std::fs;
use std::path::Path;
use std::io::Write;
use std::fs::OpenOptions;
use rusqlite::{Connection, Result};

// Check if a database file exists, and create one if it does not.
pub fn init() {
    if !db_file_exists() {
        // Save as a Previous Session - Make it openable in Edit as 'previous session'
    }
    let _ = create_db_file();
}

// Create the database file.
fn create_db_file() -> Result<()> {
    let conn = Connection::open(get_db_path())?;
    let _ = conn.execute("drop table if exists mp3_table_data",(),);

    let _ =  conn.execute(
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
        (), 
    );

    println!("Created Table Successfully");
    Ok(())
}

// Check whether the database file exists.
fn db_file_exists() -> bool {
    let db_path = get_db_path();
    Path::new(&db_path).exists()
}

// Get the path where the database file should be located.
pub fn get_db_path() -> String {
    let home_dir = dirs::home_dir().unwrap();
    // println!("{:?}",home_dir.to_str().unwrap().to_string() + "/.config/auto-mp3/db.json");
    home_dir.to_str().unwrap().to_string() + r"\.config\auto-mp3\Mp3data.db"
}

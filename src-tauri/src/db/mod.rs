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
             file_name TEXT unique, 
             path TEX unique, 
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
    let conn = Connection::open(get_db_path()).expect("Cannot Connect to DB");

    let mut file_names: Vec<String> = Vec::new();

    for path in paths {
        let file_name = path.as_ref().unwrap().file_name();
        file_names.push(file_name.clone().into_string().unwrap());
    }

    Ok(file_names)
}

pub async fn get_file_paths(path_var: String) -> Result<Vec<String>> {
    let paths = fs::read_dir(path_var.clone()).unwrap();
    let conn = Connection::open(get_db_path()).expect("Cannot Connect to DB");

    let mut file_paths: Vec<String> = Vec::new();

    for path in paths {
        file_paths.push(path.as_ref().unwrap().path().display().to_string());
    }

    Ok(file_paths)
}
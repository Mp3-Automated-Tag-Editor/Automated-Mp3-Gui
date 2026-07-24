use crate::models::Settings;
use crate::util::get_settings_path;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};

#[tauri::command]
pub fn save_settings(data: Settings) -> Result<(), ()> {
    let j = serde_json::to_string(&data);
    println!("{:?}", &j);
    let mut f = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(get_settings_path())
        .expect("Unable to create file");
    f.write_all(j.unwrap().as_bytes())
        .expect("Unable to write data");
    Ok(())
}

#[tauri::command]
pub fn get_settings_data() -> Settings {
    let mut file = File::open(get_settings_path()).expect("Unable to open");

    // Read the file content into a String
    let mut content = String::new();
    file.read_to_string(&mut content).expect("Unable to Read");

    // Deserialize the JSON content into your struct
    let parsed_json: Settings =
        serde_json::from_str(&content).expect("JSON was not well-formatted");
    parsed_json
}

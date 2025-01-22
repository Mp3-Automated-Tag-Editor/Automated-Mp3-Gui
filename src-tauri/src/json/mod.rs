use std::fs;
use std::path::Path;
use std::io::Write;
use std::fs::OpenOptions;

// Check if a Settings file exists, and create one if it does not.
pub fn init() {
    if !settings_file_exists() {
        create_settings_file();
    }
}

// Create the Settings file.
fn create_settings_file() {
    let settings_path = get_settings_path();
    let settings_dir = Path::new(&settings_path).parent().unwrap();

    // If the parent directory does not exist, create it.
    if !settings_dir.exists() {
        fs::create_dir_all(settings_dir).unwrap();
    }

    // Create the Settings file.
    fs::File::create(&settings_path).unwrap();

    //Add data to this file
    let data = r#"{"threads":2,"test":"test","developerSettings":true,"spotify":true,"palm":true,"ytmusic":true,"itunes":true,"genius":true,"groq":true}"#;
    let j = serde_json::to_string(&data);
    // println!("{:?} From Initial func", j);
    let mut f = OpenOptions::new().write(true).truncate(true).open(settings_path).expect("Unable to create file");
    f.write_all(j.unwrap().as_bytes()).expect("Unable to write data");
}

// Check whether the database file exists.
fn settings_file_exists() -> bool {
    let settings_path = get_settings_path();
    Path::new(&settings_path).exists()
}

// Get the path where the database file should be located.
pub fn get_settings_path() -> String {
    let home_dir = dirs::home_dir().unwrap();
    // println!("{:?}",&home_dir.to_str().unwrap().to_string() + "/.config/auto-mp3/settings.json");
    home_dir.to_str().unwrap().to_string() + r"\.config\auto-mp3\settings.json"
}

use std::fs;
use std::io::Write;
use std::fs::OpenOptions;
use std::path::Path;

use crate::models::Settings;
use crate::util::get_settings_path;

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

    // Create an instance of the Settings struct
    let settings = Settings {
        threads: 2,
        test: "test".to_string(),
        developer_settings: false,
        use_cache: true,
        spotify: true,
        palm: true,
        ytmusic: true,
        itunes: true,
        genius: true,
        groq: true,
        deepseek_r1: false,
        amazon_music: false,
        apple_music: false, 
        the_audio_db: false,
        deezer: false,      
        music_brainz: false,
        echonest: false,    
        pandora: false,     
        soundcloud: false,  
        tidal: false,       
        napster: false,     
        qobuz: false,       
        qq_music: false,    
        yandex_music: false,
        vk_music: false,    
        anghami: false,     
        zvuk: false,        
        gaana: false,       
        jiosaavn: false,    
        resso: false,       
        boomplay: false,    
        wikipedia: false,   
        google_search: false,
        library_path: String::new(),
        scrape_mode: "review".to_string(),
    };
    

    // Serialize the Settings struct to a JSON string
    let j = serde_json::to_string(&settings).unwrap();

    // Write the serialized JSON string to the file
    let mut f = OpenOptions::new().write(true).truncate(true).open(settings_path).expect("Unable to create file");
    f.write_all(j.as_bytes()).expect("Unable to write data");
}

// Check whether the database file exists.
fn settings_file_exists() -> bool {
    let settings_path = get_settings_path();
    Path::new(&settings_path).exists()
}

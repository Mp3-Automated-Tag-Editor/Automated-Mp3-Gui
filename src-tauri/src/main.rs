// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::trace;
use std::env;
use tauri::Manager;

mod commands;
mod constants;
mod models;
mod repository;
mod services;
mod taskbar;
mod util;

// Main Func
fn main() {
    std::env::set_var("RUST_LOG", "trace");
    env_logger::init();

    #[cfg(debug_assertions)]
    {
        // Look in src-tauri (Cargo cwd) and repo root
        if dotenvy::from_filename(".env.development").is_err() {
            dotenvy::from_filename("../.env.development").ok();
        }
    }

    #[cfg(not(debug_assertions))]
    {
        // Only compiled for release — create src-tauri/.env.production before `tauri build`
        let prod_env: &str = include_str!("../.env.production");
        for item in dotenvy::from_read_iter(prod_env.as_bytes()) {
            let (key, value) = item.expect("Invalid .env.production entry");
            std::env::set_var(key, value);
        }
    }

    trace!(
        "Environment Successfully Initialized: {}",
        env::var("ENV").unwrap_or_else(|_| "unset".into())
    );

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::return_summary,
            commands::get_network_data,
            commands::get_server_health,
            commands::start_scrape_process,
            commands::stop_scrape_process,
            commands::get_settings_data,
            commands::save_settings,
            commands::close_splashscreen,
            commands::initialize_db,
            commands::check_directory,
            commands::read_music_directory,
            commands::read_music_directory_paginated,
            commands::read_music_directory_multithreaded,
            commands::update_music_file,
            commands::set_album_art,
            commands::fetch_album_art_url,
            commands::long_job,
            commands::retrieve_all_sessions,
            commands::retrieve_sessions_data,
            commands::download_music,
            commands::stop_download_music,
            commands::check_download_deps,
            commands::lookup_artist_country,
            commands::resolve_artist_countries,
            commands::compute_library_stats,
            commands::scrape_library_paths,
            taskbar::set_taskbar_playback_state
        ])
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            let splashscreen_window = app.get_window("splashscreen").unwrap();

            services::config::init();
            trace!("JSON Handlers Successfully Initialized");

            repository::init();
            trace!("Database Successfully Initialized");

            // we perform the initialization code on a new task so the app doesn't freeze
            tauri::async_runtime::spawn(async move {
                // initialize your app here instead of sleeping :)
                trace!("Initializing Main Thread");

                std::thread::sleep(std::time::Duration::from_secs(1));
                trace!("Application Startup Successful");

                // After it's done, close the splashscreen and display the main window
                splashscreen_window.close().unwrap();
                main_window.show().unwrap();

                // Thumbnail toolbar must be attached on the UI thread.
                let window = main_window.clone();
                let _ = main_window.run_on_main_thread(move || {
                    if let Err(err) = taskbar::attach(&window) {
                        log::error!("Failed to attach taskbar thumbnail controls: {err}");
                    }
                });
            });

            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("failed to launch app");
}

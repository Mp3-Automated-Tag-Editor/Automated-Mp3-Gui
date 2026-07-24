use crate::repository;
use crate::services::threading;
use log::info;
use tauri::Runtime;

use super::settings::get_settings_data;

#[tauri::command]
pub async fn start_scrape_process<R: Runtime>(
    window: tauri::Window<R>,
    path_var: String,
) -> Result<u32, ()> {
    // Legacy entrypoint — still used by unused /terminal route.
    // Prefer scrape_library_paths for Edit-first scrape (no new sessions).
    let file_names = repository::get_file_names(path_var.clone()).await;
    let file_paths = repository::get_file_paths(path_var.clone()).await;

    let settings_data = get_settings_data();

    let _ = repository::init_table();

    let num_workers = settings_data.clone().threads as usize;

    threading::prepare_execution();
    let res = threading::threaded_execution(
        window,
        file_names.unwrap(),
        file_paths.unwrap(),
        num_workers,
        repository::get_db_path(),
        settings_data,
        path_var.as_str(),
        true,
    );

    Ok(res.unwrap())
}

/// Scrape specific MP3 paths without creating SQLite sessions.
/// When `apply` is true, scraped tags are written to disk immediately.
#[tauri::command]
pub async fn scrape_library_paths<R: Runtime>(
    window: tauri::Window<R>,
    paths: Vec<String>,
    apply: bool,
) -> Result<u32, String> {
    if paths.is_empty() {
        return Err("No paths to scrape".to_string());
    }
    let settings_data = get_settings_data();
    let mut settings_data = settings_data;
    // Override scrape mode from the apply flag for this run
    settings_data.scrape_mode = if apply {
        "apply".to_string()
    } else {
        "review".to_string()
    };
    let num_workers = settings_data.threads.max(1) as usize;

    let mut file_names = Vec::new();
    let mut file_paths = Vec::new();
    for p in paths {
        let path = std::path::Path::new(&p);
        let name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown.mp3")
            .to_string();
        file_names.push(name);
        file_paths.push(p);
    }

    let directory = file_paths
        .first()
        .and_then(|p| {
            std::path::Path::new(p)
                .parent()
                .map(|d| d.to_string_lossy().to_string())
        })
        .unwrap_or_default();

    threading::prepare_execution();
    threading::threaded_execution(
        window,
        file_names,
        file_paths,
        num_workers,
        repository::get_db_path(),
        settings_data,
        directory.as_str(),
        false, // do not persist SQLite session
    )
    .map_err(|_| "Scrape workers failed".to_string())?;

    Ok(0)
}

#[tauri::command]
pub async fn stop_scrape_process() -> Result<(), ()> {
    info!("Stop Scrape Process function called");
    threading::stop_execution();
    info!("Stop Scrape Process function Success - Threads Stopped");
    Ok(())
}

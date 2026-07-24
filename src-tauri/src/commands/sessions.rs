use crate::models::{EditViewSongMetadata, Session};
use crate::repository;
use log::info;

#[tauri::command]
pub fn retrieve_all_sessions() -> Result<Vec<Session>, String> {
    info!("Retrieving all sessions");
    let sessions = repository::retrieve_all_sessions();
    Ok(sessions.unwrap())
}

#[tauri::command]
pub fn retrieve_sessions_data(session: String) -> Result<Vec<EditViewSongMetadata>, String> {
    info!("Retrieving session metadata for session: {}", session);
    let session_data = repository::retrieve_session_data(session.as_str());
    Ok(session_data.unwrap())
}

use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DownloadBackend {
    SpotDl,
    YtDlp,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadFinished {
    pub success: bool,
    pub code: Option<i32>,
    pub backend: String,
    pub message: String,
    pub failed_count: u32,
    pub failure_log_path: Option<String>,
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestJob {
    pub id: String,
    pub collection_id: String,
    pub total_files: usize,
    pub processed_files: usize,
    pub status: String, // running, completed, failed
    pub error: Option<String>,
}

pub struct AppState {
    pub db_path: PathBuf,
    pub indexes_path: PathBuf,
    pub ingest_jobs: Mutex<HashMap<String, IngestJob>>,
}

impl AppState {
    pub fn new() -> Self {
        let data_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("local-rag");

        std::fs::create_dir_all(&data_dir).ok();

        let db_path = data_dir.join("app.db");
        let indexes_path = data_dir.join("indexes");

        std::fs::create_dir_all(&indexes_path).ok();

        Self {
            db_path,
            indexes_path,
            ingest_jobs: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_index_path(&self, collection_id: &str) -> PathBuf {
        self.indexes_path.join(collection_id)
    }
}

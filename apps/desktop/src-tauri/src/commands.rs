use crate::state::{AppState, IngestJob};
use core_lib::{tantivy_index::TantivyRetriever, HybridSearch};
use ingest::{chunk::chunk_text, parse::parse_file, sha256_bytes};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use storage::{
    models::CollectionSettings,
    service::StorageService,
    Db,
};
use tauri::State;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Serialize)]
pub struct CollectionInfo {
    id: String,
    name: String,
    created_at: String,
    doc_count: usize,
}

#[tauri::command]
pub async fn create_collection(
    name: String,
    state: State<'_, Arc<AppState>>,
) -> Result<String, String> {
    tracing::info!("Creating collection: {}", name);

    let db = Db::connect(&format!("sqlite://{}", state.db_path.display()))
        .await
        .map_err(|e| e.to_string())?;

    db.migrate().await.map_err(|e| e.to_string())?;

    let service = StorageService::new(db.pool);
    let settings = CollectionSettings::default();

    let collection = service
        .create_collection(&name, settings)
        .await
        .map_err(|e| e.to_string())?;

    // Create and initialize Tantivy index
    let index_path = state.get_index_path(&collection.id);
    TantivyRetriever::open_or_create(&index_path).map_err(|e| e.to_string())?;

    Ok(collection.id)
}

#[tauri::command]
pub async fn list_collections(
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<CollectionInfo>, String> {
    let db = Db::connect(&format!("sqlite://{}", state.db_path.display()))
        .await
        .map_err(|e| e.to_string())?;

    let service = StorageService::new(db.pool);
    let collections = service.list_collections().await.map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for col in collections {
        let docs = service
            .list_documents(&col.id)
            .await
            .map_err(|e| e.to_string())?;

        tracing::info!("Collection '{}' (id: {}) has {} documents", col.name, col.id, docs.len());

        result.push(CollectionInfo {
            id: col.id,
            name: col.name,
            created_at: col.created_at.to_rfc3339(),
            doc_count: docs.len(),
        });
    }

    Ok(result)
}

#[tauri::command]
pub async fn delete_collection(
    id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    let db = Db::connect(&format!("sqlite://{}", state.db_path.display()))
        .await
        .map_err(|e| e.to_string())?;

    let service = StorageService::new(db.pool);
    service.delete_collection(&id).await.map_err(|e| e.to_string())?;

    // Delete index directory
    let index_path = state.get_index_path(&id);
    std::fs::remove_dir_all(&index_path).ok();

    Ok(())
}

#[derive(Serialize)]
pub struct IngestJobInfo {
    job_id: String,
    status: String,
}

#[tauri::command]
pub async fn ingest_paths(
    collection_id: String,
    paths: Vec<String>,
    state: State<'_, Arc<AppState>>,
) -> Result<IngestJobInfo, String> {
    let job_id = Uuid::new_v4().to_string();

    tracing::info!(
        "Starting ingestion job {} for collection {}",
        job_id,
        collection_id
    );

    let job = IngestJob {
        id: job_id.clone(),
        collection_id: collection_id.clone(),
        total_files: paths.len(),
        processed_files: 0,
        status: "running".to_string(),
        error: None,
    };

    state.ingest_jobs.lock().unwrap().insert(job_id.clone(), job);

    let state_clone = state.inner().clone();
    let job_id_clone = job_id.clone();

    // Run ingestion in background
    tokio::spawn(async move {
        if let Err(e) = run_ingestion(state_clone.clone(), collection_id, paths).await {
            tracing::error!("Ingestion failed: {}", e);
            let mut jobs = state_clone.ingest_jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&job_id_clone) {
                job.status = "failed".to_string();
                job.error = Some(e.to_string());
            }
        } else {
            let mut jobs = state_clone.ingest_jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&job_id_clone) {
                job.status = "completed".to_string();
            }
        }
    });

    Ok(IngestJobInfo {
        job_id,
        status: "running".to_string(),
    })
}

async fn run_ingestion(
    state: Arc<AppState>,
    collection_id: String,
    paths: Vec<String>,
) -> anyhow::Result<()> {
    let db = Db::connect(&format!("sqlite://{}", state.db_path.display())).await?;
    let service = StorageService::new(db.pool);

    // Get collection settings
    let collection = service
        .get_collection(&collection_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Collection not found"))?;

    let settings: CollectionSettings = serde_json::from_str(&collection.settings_json)?;

    // Open Tantivy index
    let index_path = state.get_index_path(&collection_id);
    let retriever = TantivyRetriever::open_or_create(&index_path)?;
    let mut writer = retriever.writer(50_000_000)?;

    // Collect all files to process
    let mut files_to_process = Vec::new();
    for path_str in paths {
        let path = std::path::Path::new(&path_str);
        if path.is_file() {
            files_to_process.push(path.to_path_buf());
        } else if path.is_dir() {
            for entry in WalkDir::new(path)
                .follow_links(true)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.file_type().is_file() {
                    files_to_process.push(entry.path().to_path_buf());
                }
            }
        }
    }

    for file_path in files_to_process {
        // Check if file already exists (dedup by hash)
        let file_bytes = std::fs::read(&file_path)?;
        let file_hash = sha256_bytes(&file_bytes);

        if service
            .find_document_by_hash(&collection_id, &file_hash)
            .await?
            .is_some()
        {
            tracing::debug!("Skipping duplicate file: {}", file_path.display());
            continue;
        }

        // Parse document
        let parsed = match parse_file(&file_path) {
            Ok(p) => p,
            Err(e) => {
                tracing::warn!("Failed to parse {}: {}", file_path.display(), e);
                continue;
            }
        };

        let (title, content) = match parsed {
            ingest::parse::ParsedDoc::Text { title, content } => (title, content),
        };

        // Detect MIME type from file extension
        let mime_type = mime_guess::from_path(&file_path)
            .first_or_octet_stream()
            .to_string();

        // Create document record
        let doc = service
            .create_document(
                &collection_id,
                &file_path.display().to_string(),
                &file_hash,
                Some(&title),
                Some(&mime_type),
                Some(file_bytes.len() as i64),
            )
            .await?;
        
        tracing::info!("Created document {} for collection {}", doc.id, collection_id);

        // Chunk content
        let chunks = chunk_text(&content, settings.chunk_size, settings.chunk_overlap);

        for chunk in chunks {
            // Store chunk in DB
            let chunk_record = service
                .create_chunk(
                    &doc.id,
                    chunk.idx,
                    &chunk.text,
                    chunk.tokens as i32,
                    Some(chunk.start as i32),
                    Some(chunk.end as i32),
                )
                .await?;

            // Index in Tantivy
            retriever.add_chunk(
                &mut writer,
                &chunk_record.id,
                &doc.id,
                &title,
                &chunk.text,
            )?;
        }

        // Update document status
        service.update_document_status(&doc.id, "indexed").await?;

        // Update progress counter
        {
            let mut jobs = state.ingest_jobs.lock().unwrap();
            // Find the job for this collection (most recent running one)
            for job in jobs.values_mut() {
                if job.collection_id == collection_id && job.status == "running" {
                    job.processed_files += 1;
                    break;
                }
            }
        }

        tracing::info!("Indexed document: {}", title);
    }

    // Commit to Tantivy
    retriever.commit(&mut writer)?;

    Ok(())
}

#[tauri::command]
pub async fn get_ingest_status(
    job_id: String,
    state: State<'_, Arc<AppState>>,
) -> Result<IngestJob, String> {
    let jobs = state.ingest_jobs.lock().unwrap();
    jobs.get(&job_id)
        .cloned()
        .ok_or_else(|| "Job not found".to_string())
}

#[derive(Deserialize)]
pub struct SearchRequest {
    collection_id: String,
    query: String,
    top_k: usize,
}

#[derive(Serialize)]
pub struct SearchResult {
    id: String,
    text: String,
    score: f32,
    source: serde_json::Value,
    start_char: Option<i32>,
    end_char: Option<i32>,
}

#[tauri::command]
pub async fn search(
    req: SearchRequest,
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<SearchResult>, String> {
    tracing::info!("Searching collection {} for: {}", req.collection_id, req.query);

    let index_path = state.get_index_path(&req.collection_id);
    let retriever = TantivyRetriever::open_or_create(&index_path).map_err(|e| e.to_string())?;

    let hybrid = HybridSearch::new(&retriever);
    let candidates = hybrid
        .search(&req.query, req.top_k)
        .map_err(|e| e.to_string())?;

    let results = candidates
        .into_iter()
        .map(|c| SearchResult {
            id: c.id,
            text: c.text,
            score: c.score,
            source: serde_json::to_value(c.source).unwrap_or(serde_json::Value::Null),
            start_char: c.start_char,
            end_char: c.end_char,
        })
        .collect();

    Ok(results)
}

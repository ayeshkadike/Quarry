/// Data models matching the SQLite schema

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub settings_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionSettings {
    pub chunk_size: usize,
    pub chunk_overlap: usize,
    pub embedding_model: Option<String>,
}

impl Default for CollectionSettings {
    fn default() -> Self {
        Self {
            chunk_size: 1200,
            chunk_overlap: 200,
            embedding_model: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Document {
    pub id: String,
    pub collection_id: String,
    pub path: String,
    pub sha256: String,
    pub title: Option<String>,
    pub mime: Option<String>,
    pub bytes: Option<i64>,
    pub status: String, // pending, processing, indexed, failed
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Chunk {
    pub id: String,
    pub doc_id: String,
    pub idx: i32,
    pub text: String,
    pub tokens: i32,
    pub start_char: Option<i32>,
    pub end_char: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Conversation {
    pub id: String,
    pub title: Option<String>,
    pub collection_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub settings_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSettings {
    pub temperature: f32,
    pub max_tokens: usize,
    pub use_web_assist: bool,
}

impl Default for ConversationSettings {
    fn default() -> Self {
        Self {
            temperature: 0.7,
            max_tokens: 512,
            use_web_assist: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String, // user, assistant, system
    pub text: String,
    pub created_at: DateTime<Utc>,
    pub tokens_in: Option<i32>,
    pub tokens_out: Option<i32>,
    pub meta_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Citation {
    pub id: String,
    pub message_id: String,
    pub source_kind: String, // local, web
    pub doc_id: Option<String>,
    pub chunk_id: Option<String>,
    pub url: Option<String>,
    pub snapshot_path: Option<String>,
    pub score: Option<f32>,
    pub start_char: Option<i32>,
    pub end_char: Option<i32>,
}

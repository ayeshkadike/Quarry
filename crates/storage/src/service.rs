/// Storage service with CRUD operations

use crate::models::*;
use anyhow::{Context, Result};
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct StorageService {
    pool: SqlitePool,
}

impl StorageService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // ===== Collections =====

    pub async fn create_collection(&self, name: &str, settings: CollectionSettings) -> Result<Collection> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let settings_json = serde_json::to_string(&settings)?;

        sqlx::query(
            "INSERT INTO collections (id, name, created_at, settings_json) VALUES (?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(name)
        .bind(&now)
        .bind(&settings_json)
        .execute(&self.pool)
        .await
        .context("Failed to insert collection")?;

        Ok(Collection {
            id,
            name: name.to_string(),
            created_at: now,
            settings_json,
        })
    }

    pub async fn get_collection(&self, id: &str) -> Result<Option<Collection>> {
        let collection = sqlx::query_as::<_, Collection>(
            "SELECT id, name, created_at, settings_json FROM collections WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(collection)
    }

    pub async fn list_collections(&self) -> Result<Vec<Collection>> {
        let collections = sqlx::query_as::<_, Collection>(
            "SELECT id, name, created_at, settings_json FROM collections ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(collections)
    }

    pub async fn delete_collection(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM collections WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // ===== Documents =====

    pub async fn create_document(
        &self,
        collection_id: &str,
        path: &str,
        sha256: &str,
        title: Option<&str>,
        mime: Option<&str>,
        bytes: Option<i64>,
    ) -> Result<Document> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let status = "pending";

        sqlx::query(
            "INSERT INTO documents (id, collection_id, path, sha256, title, mime, bytes, status, added_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(collection_id)
        .bind(path)
        .bind(sha256)
        .bind(title)
        .bind(mime)
        .bind(bytes)
        .bind(status)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        Ok(Document {
            id,
            collection_id: collection_id.to_string(),
            path: path.to_string(),
            sha256: sha256.to_string(),
            title: title.map(|s| s.to_string()),
            mime: mime.map(|s| s.to_string()),
            bytes,
            status: status.to_string(),
            added_at: now,
        })
    }

    pub async fn update_document_status(&self, id: &str, status: &str) -> Result<()> {
        sqlx::query("UPDATE documents SET status = ? WHERE id = ?")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_document(&self, id: &str) -> Result<Option<Document>> {
        let doc = sqlx::query_as::<_, Document>(
            "SELECT * FROM documents WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(doc)
    }

    pub async fn list_documents(&self, collection_id: &str) -> Result<Vec<Document>> {
        let docs = sqlx::query_as::<_, Document>(
            "SELECT * FROM documents WHERE collection_id = ? ORDER BY added_at DESC"
        )
        .bind(collection_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(docs)
    }

    pub async fn find_document_by_hash(
        &self,
        collection_id: &str,
        sha256: &str,
    ) -> Result<Option<Document>> {
        let doc = sqlx::query_as::<_, Document>(
            "SELECT * FROM documents WHERE collection_id = ? AND sha256 = ? LIMIT 1"
        )
        .bind(collection_id)
        .bind(sha256)
        .fetch_optional(&self.pool)
        .await?;
        Ok(doc)
    }

    // ===== Chunks =====

    pub async fn create_chunk(
        &self,
        doc_id: &str,
        idx: i32,
        text: &str,
        tokens: i32,
        start_char: Option<i32>,
        end_char: Option<i32>,
    ) -> Result<Chunk> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO chunks (id, doc_id, idx, text, tokens, start_char, end_char)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(doc_id)
        .bind(idx)
        .bind(text)
        .bind(tokens)
        .bind(start_char)
        .bind(end_char)
        .execute(&self.pool)
        .await?;

        Ok(Chunk {
            id,
            doc_id: doc_id.to_string(),
            idx,
            text: text.to_string(),
            tokens,
            start_char,
            end_char,
        })
    }

    pub async fn get_chunks_for_document(&self, doc_id: &str) -> Result<Vec<Chunk>> {
        let chunks = sqlx::query_as::<_, Chunk>(
            "SELECT * FROM chunks WHERE doc_id = ? ORDER BY idx"
        )
        .bind(doc_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(chunks)
    }

    // ===== Conversations =====

    pub async fn create_conversation(
        &self,
        title: Option<&str>,
        collection_id: Option<&str>,
        settings: ConversationSettings,
    ) -> Result<Conversation> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let settings_json = serde_json::to_string(&settings)?;

        sqlx::query(
            "INSERT INTO conversations (id, title, collection_id, created_at, updated_at, settings_json)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(title)
        .bind(collection_id)
        .bind(&now)
        .bind(&now)
        .bind(&settings_json)
        .execute(&self.pool)
        .await?;

        Ok(Conversation {
            id,
            title: title.map(|s| s.to_string()),
            collection_id: collection_id.map(|s| s.to_string()),
            created_at: now,
            updated_at: now,
            settings_json,
        })
    }

    pub async fn list_conversations(&self) -> Result<Vec<Conversation>> {
        let convs = sqlx::query_as::<_, Conversation>(
            "SELECT * FROM conversations ORDER BY updated_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(convs)
    }

    // ===== Messages =====

    pub async fn create_message(
        &self,
        conversation_id: &str,
        role: &str,
        text: &str,
        meta_json: Option<&str>,
    ) -> Result<Message> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let meta = meta_json.unwrap_or("{}");

        sqlx::query(
            "INSERT INTO messages (id, conversation_id, role, text, created_at, meta_json)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(conversation_id)
        .bind(role)
        .bind(text)
        .bind(&now)
        .bind(meta)
        .execute(&self.pool)
        .await?;

        // Update conversation updated_at
        sqlx::query("UPDATE conversations SET updated_at = ? WHERE id = ?")
            .bind(&now)
            .bind(conversation_id)
            .execute(&self.pool)
            .await?;

        Ok(Message {
            id,
            conversation_id: conversation_id.to_string(),
            role: role.to_string(),
            text: text.to_string(),
            created_at: now,
            tokens_in: None,
            tokens_out: None,
            meta_json: meta.to_string(),
        })
    }

    pub async fn get_messages(&self, conversation_id: &str) -> Result<Vec<Message>> {
        let messages = sqlx::query_as::<_, Message>(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at"
        )
        .bind(conversation_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(messages)
    }

    // ===== Citations =====

    pub async fn create_citation(
        &self,
        message_id: &str,
        source_kind: &str,
        doc_id: Option<&str>,
        chunk_id: Option<&str>,
        url: Option<&str>,
        score: Option<f32>,
    ) -> Result<Citation> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO citations (id, message_id, source_kind, doc_id, chunk_id, url, score)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(message_id)
        .bind(source_kind)
        .bind(doc_id)
        .bind(chunk_id)
        .bind(url)
        .bind(score)
        .execute(&self.pool)
        .await?;

        Ok(Citation {
            id,
            message_id: message_id.to_string(),
            source_kind: source_kind.to_string(),
            doc_id: doc_id.map(|s| s.to_string()),
            chunk_id: chunk_id.map(|s| s.to_string()),
            url: url.map(|s| s.to_string()),
            snapshot_path: None,
            score,
            start_char: None,
            end_char: None,
        })
    }

    pub async fn get_citations(&self, message_id: &str) -> Result<Vec<Citation>> {
        let citations = sqlx::query_as::<_, Citation>(
            "SELECT * FROM citations WHERE message_id = ? ORDER BY score DESC"
        )
        .bind(message_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(citations)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Db;

    #[tokio::test]
    async fn test_collection_crud() -> Result<()> {
        let db = Db::connect(":memory:").await?;
        db.migrate().await?;
        let service = StorageService::new(db.pool.clone());

        let settings = CollectionSettings::default();
        let collection = service.create_collection("Test Collection", settings).await?;
        assert!(!collection.id.is_empty());
        assert_eq!(collection.name, "Test Collection");

        let found = service.get_collection(&collection.id).await?;
        assert!(found.is_some());

        let all = service.list_collections().await?;
        assert_eq!(all.len(), 1);

        Ok(())
    }
}

/// Tantivy-based BM25 retriever

use crate::api::{Candidate, Retriever, SourceMeta};
use anyhow::{Context, Result};
use std::path::Path;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexReader, IndexWriter, ReloadPolicy, TantivyDocument};
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;

pub struct TantivyRetriever {
    index: Index,
    reader: IndexReader,
    #[allow(dead_code)]
    schema: Schema,
    chunk_id_field: Field,
    doc_id_field: Field,
    title_field: Field,
    text_field: Field,
}

impl TantivyRetriever {
    /// Open existing index or create new one
    pub fn open_or_create(path: &Path) -> Result<Self> {
        let mut schema_builder = Schema::builder();
        
        let chunk_id_field = schema_builder.add_text_field("chunk_id", STRING | STORED);
        let doc_id_field = schema_builder.add_text_field("doc_id", STRING | STORED);
        let title_field = schema_builder.add_text_field("title", TEXT | STORED);
        let text_field = schema_builder.add_text_field("text", TEXT | STORED);
        
        let schema = schema_builder.build();

        let index = if path.exists() && path.join("meta.json").exists() {
            // Index already exists with metadata
            Index::open_in_dir(path).context("Failed to open Tantivy index")?
        } else {
            // Create new index (will overwrite if directory exists but is empty/incomplete)
            std::fs::create_dir_all(path).context("Failed to create index directory")?;
            Index::create_in_dir(path, schema.clone()).context("Failed to create Tantivy index")?
        };

        let reader = index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()
            .context("Failed to create index reader")?;

        Ok(Self {
            index,
            reader,
            schema,
            chunk_id_field,
            doc_id_field,
            title_field,
            text_field,
        })
    }

    /// Get an index writer for adding documents
    pub fn writer(&self, heap_size: usize) -> Result<IndexWriter> {
        self.index
            .writer(heap_size)
            .context("Failed to create index writer")
    }

    /// Add a chunk to the index
    pub fn add_chunk(
        &self,
        writer: &mut IndexWriter,
        chunk_id: &str,
        doc_id: &str,
        title: &str,
        text: &str,
    ) -> Result<()> {
        let doc = doc!(
            self.chunk_id_field => chunk_id,
            self.doc_id_field => doc_id,
            self.title_field => title,
            self.text_field => text,
        );
        writer.add_document(doc)?;
        Ok(())
    }

    /// Commit changes
    pub fn commit(&self, writer: &mut IndexWriter) -> Result<()> {
        writer.commit()?;
        self.reader.reload()?;
        Ok(())
    }
}

impl Retriever for TantivyRetriever {
    fn retrieve(&self, query: &str, k: usize) -> Result<Vec<Candidate>> {
        let searcher = self.reader.searcher();
        
        // Create query parser for text and title fields
        let query_parser = QueryParser::for_index(
            &self.index,
            vec![self.text_field, self.title_field],
        );

        let query = query_parser
            .parse_query(query)
            .context("Failed to parse query")?;

        // Search with BM25
        let top_docs = searcher
            .search(&query, &TopDocs::with_limit(k))
            .context("Search failed")?;

        let mut candidates = Vec::new();

        for (score, doc_address) in top_docs {
            let retrieved_doc: TantivyDocument = searcher
                .doc(doc_address)
                .context("Failed to retrieve document")?;

            let chunk_id = retrieved_doc
                .get_first(self.chunk_id_field)
                .and_then(|f| f.as_str())
                .unwrap_or("")
                .to_string();

            let doc_id = retrieved_doc
                .get_first(self.doc_id_field)
                .and_then(|f| f.as_str())
                .unwrap_or("")
                .to_string();

            let title = retrieved_doc
                .get_first(self.title_field)
                .and_then(|f| f.as_str())
                .unwrap_or("")
                .to_string();

            let text = retrieved_doc
                .get_first(self.text_field)
                .and_then(|f| f.as_str())
                .unwrap_or("")
                .to_string();

            candidates.push(Candidate {
                id: chunk_id.clone(),
                text,
                score,
                source: SourceMeta::Local {
                    doc_id,
                    chunk_id,
                    title,
                },
                start_char: None,
                end_char: None,
            });
        }

        Ok(candidates)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_tantivy_retriever() -> Result<()> {
        let temp_dir = TempDir::new()?;
        let index_path = temp_dir.path();

        let retriever = TantivyRetriever::open_or_create(index_path)?;
        let mut writer = retriever.writer(50_000_000)?;

        // Add some test documents
        retriever.add_chunk(
            &mut writer,
            "chunk_1",
            "doc_1",
            "Test Document",
            "This is a test document about information retrieval",
        )?;

        retriever.add_chunk(
            &mut writer,
            "chunk_2",
            "doc_2",
            "Another Document",
            "This document discusses search engines and ranking",
        )?;

        retriever.commit(&mut writer)?;

        // Search
        let results = retriever.retrieve("information retrieval", 10)?;
        assert!(!results.is_empty());
        assert!(results[0].text.contains("information"));

        Ok(())
    }
}

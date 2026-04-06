/// In-memory vector index for similarity search
/// Uses brute-force cosine similarity (sufficient for < 100k chunks)

use crate::api::{Candidate, Embedder, Retriever, SourceMeta};
use anyhow::Result;
use std::sync::RwLock;

/// A stored vector entry
#[derive(Clone, Debug)]
struct VectorEntry {
    chunk_id: String,
    doc_id: String,
    title: String,
    text: String,
    embedding: Vec<f32>,
    start_char: Option<i32>,
    end_char: Option<i32>,
}

/// Brute-force vector index with cosine similarity search
pub struct VectorIndex {
    entries: RwLock<Vec<VectorEntry>>,
    embedder: Box<dyn Embedder>,
}

impl VectorIndex {
    pub fn new(embedder: Box<dyn Embedder>) -> Self {
        Self {
            entries: RwLock::new(Vec::new()),
            embedder,
        }
    }

    /// Add a pre-computed embedding to the index
    pub fn add(
        &self,
        chunk_id: &str,
        doc_id: &str,
        title: &str,
        text: &str,
        embedding: Vec<f32>,
        start_char: Option<i32>,
        end_char: Option<i32>,
    ) {
        let entry = VectorEntry {
            chunk_id: chunk_id.to_string(),
            doc_id: doc_id.to_string(),
            title: title.to_string(),
            text: text.to_string(),
            embedding,
            start_char,
            end_char,
        };
        self.entries.write().unwrap().push(entry);
    }

    /// Add text and embed it inline
    pub fn add_text(
        &self,
        chunk_id: &str,
        doc_id: &str,
        title: &str,
        text: &str,
        start_char: Option<i32>,
        end_char: Option<i32>,
    ) -> Result<()> {
        let embedding = self.embedder.embed(text)?;
        self.add(chunk_id, doc_id, title, text, embedding, start_char, end_char);
        Ok(())
    }

    /// Get the number of entries in the index
    pub fn len(&self) -> usize {
        self.entries.read().unwrap().len()
    }

    /// Check if the index is empty
    pub fn is_empty(&self) -> bool {
        self.entries.read().unwrap().is_empty()
    }
}

impl Retriever for VectorIndex {
    fn retrieve(&self, query: &str, k: usize) -> Result<Vec<Candidate>> {
        let query_embedding = self.embedder.embed(query)?;
        let entries = self.entries.read().unwrap();

        if entries.is_empty() {
            return Ok(vec![]);
        }

        // Compute cosine similarity with all entries
        let mut scored: Vec<(usize, f32)> = entries
            .iter()
            .enumerate()
            .map(|(idx, entry)| {
                let score = cosine_similarity(&query_embedding, &entry.embedding);
                (idx, score)
            })
            .collect();

        // Sort by score descending
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scored.truncate(k);

        let candidates = scored
            .into_iter()
            .map(|(idx, score)| {
                let entry = &entries[idx];
                Candidate {
                    id: entry.chunk_id.clone(),
                    text: entry.text.clone(),
                    score,
                    source: SourceMeta::Local {
                        doc_id: entry.doc_id.clone(),
                        chunk_id: entry.chunk_id.clone(),
                        title: entry.title.clone(),
                    },
                    start_char: entry.start_char,
                    end_char: entry.end_char,
                }
            })
            .collect();

        Ok(candidates)
    }
}

/// Cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot / (norm_a * norm_b)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::embeddings::StubEmbedder;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim.abs() < 1e-6);
    }

    #[test]
    fn test_vector_index_basic() {
        let embedder = Box::new(StubEmbedder::new(3));
        let index = VectorIndex::new(embedder);

        // With stub embedder all vectors are [0,0,0] so similarity will be 0
        // This just tests the API works
        index.add("c1", "d1", "Title 1", "Hello world", vec![1.0, 0.0, 0.0], None, None);
        index.add("c2", "d1", "Title 1", "Goodbye world", vec![0.0, 1.0, 0.0], None, None);
        index.add("c3", "d2", "Title 2", "Test text", vec![0.8, 0.2, 0.0], None, None);

        assert_eq!(index.len(), 3);

        // Query with a vector close to c1
        let results = index.retrieve("test", 2).unwrap();
        // With stub embedder query produces [0,0,0], so scores will be 0
        // But we still get results
        assert_eq!(results.len(), 2);
    }
}

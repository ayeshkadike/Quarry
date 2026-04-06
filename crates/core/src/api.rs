use chrono::{DateTime, Utc};

/// Source metadata for search results
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type")]
pub enum SourceMeta {
    Local {
        doc_id: String,
        chunk_id: String,
        title: String,
    },
    Web {
        url: String,
        title: String,
        fetched_at: DateTime<Utc>,
    },
}

/// A search result candidate
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct Candidate {
    pub id: String,
    pub text: String,
    pub score: f32,
    pub source: SourceMeta,
    pub start_char: Option<i32>,
    pub end_char: Option<i32>,
}

/// Trait for embedding text into vectors
pub trait Embedder: Send + Sync {
    fn embed(&self, text: &str) -> anyhow::Result<Vec<f32>>;
    fn embed_batch(&self, texts: &[String]) -> anyhow::Result<Vec<Vec<f32>>> {
        texts.iter().map(|t| self.embed(t)).collect()
    }
}

/// Trait for retrieving candidates
pub trait Retriever: Send + Sync {
    fn retrieve(&self, query: &str, k: usize) -> anyhow::Result<Vec<Candidate>>;
}

/// Trait for reranking candidates
pub trait Reranker: Send + Sync {
    fn rerank(&self, query: &str, cands: Vec<Candidate>) -> anyhow::Result<Vec<Candidate>>;
}

/// Hybrid search combining BM25 + vector retrieval with optional reranking
pub struct HybridSearch<'a> {
    pub bm25: &'a dyn Retriever,
    pub vector: Option<&'a dyn Retriever>,
    pub reranker: Option<&'a dyn Reranker>,
    /// Balance between BM25 and vector results (0.0 = BM25 only, 1.0 = vector only)
    pub alpha: f32,
}

impl<'a> HybridSearch<'a> {
    /// Create a BM25-only search (backward compatible)
    pub fn new(local: &'a dyn Retriever) -> Self {
        Self {
            bm25: local,
            vector: None,
            reranker: None,
            alpha: 0.5,
        }
    }

    /// Add a vector retriever for hybrid search
    pub fn with_vector(mut self, vector: &'a dyn Retriever, alpha: f32) -> Self {
        self.vector = Some(vector);
        self.alpha = alpha.clamp(0.0, 1.0);
        self
    }

    pub fn with_reranker(mut self, reranker: &'a dyn Reranker) -> Self {
        self.reranker = Some(reranker);
        self
    }

    pub fn search(&self, query: &str, k: usize) -> anyhow::Result<Vec<Candidate>> {
        // Retrieve more candidates than needed for reranking/fusion
        let retrieve_k = if self.reranker.is_some() || self.vector.is_some() {
            (k * 10).min(100)
        } else {
            k
        };

        let mut candidates = if let Some(vector_retriever) = self.vector {
            // Hybrid mode: retrieve from both and fuse
            let bm25_results = self.bm25.retrieve(query, retrieve_k)?;
            let vector_results = vector_retriever.retrieve(query, retrieve_k)?;

            crate::fusion::linear_fusion(bm25_results, vector_results, 1.0 - self.alpha)?
        } else {
            // BM25-only mode
            self.bm25.retrieve(query, retrieve_k)?
        };

        if let Some(reranker) = self.reranker {
            candidates = reranker.rerank(query, candidates)?;
        }

        candidates.truncate(k);
        Ok(candidates)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct DummyRetriever;
    impl Retriever for DummyRetriever {
        fn retrieve(&self, _query: &str, k: usize) -> anyhow::Result<Vec<Candidate>> {
            Ok((0..k)
                .map(|i| Candidate {
                    id: format!("doc_{}", i),
                    text: format!("Sample text {}", i),
                    score: 1.0 - (i as f32 * 0.1),
                    source: SourceMeta::Local {
                        doc_id: format!("doc_{}", i),
                        chunk_id: format!("chunk_{}", i),
                        title: format!("Document {}", i),
                    },
                    start_char: Some(0),
                    end_char: Some(100),
                })
                .collect())
        }
    }

    #[test]
    fn test_hybrid_search() {
        let retriever = DummyRetriever;
        let search = HybridSearch::new(&retriever);
        let results = search.search("test query", 5).unwrap();
        assert_eq!(results.len(), 5);
        assert!(results[0].score >= results[1].score);
    }
}

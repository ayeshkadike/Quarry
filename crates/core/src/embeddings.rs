/// Embedding functionality — local vector embeddings via fastembed

use crate::api::Embedder;
use anyhow::Result;

/// Stub embedder that returns zero vectors (for testing/fallback)
pub struct StubEmbedder {
    pub dimension: usize,
}

impl StubEmbedder {
    pub fn new(dimension: usize) -> Self {
        Self { dimension }
    }
}

impl Embedder for StubEmbedder {
    fn embed(&self, _text: &str) -> Result<Vec<f32>> {
        Ok(vec![0.0; self.dimension])
    }
}

/// FastEmbed-based embedder using ONNX models running locally
/// Default model: BAAI/bge-small-en-v1.5 (384 dimensions, fast, good quality)
pub struct FastEmbedder {
    model: fastembed::TextEmbedding,
}

impl FastEmbedder {
    /// Create a new FastEmbedder with the default model (bge-small-en-v1.5)
    pub fn new() -> Result<Self> {
        Self::with_model(fastembed::EmbeddingModel::BGESmallENV15)
    }

    /// Create a FastEmbedder with a specific model
    pub fn with_model(model: fastembed::EmbeddingModel) -> Result<Self> {
        let init_options = fastembed::InitOptions::new(model)
            .with_show_download_progress(true);

        let model = fastembed::TextEmbedding::try_new(init_options)
            .map_err(|e| anyhow::anyhow!("Failed to initialize embedding model: {}", e))?;

        Ok(Self { model })
    }

    /// Get the embedding dimension for this model
    pub fn dimension(&self) -> usize {
        // bge-small-en-v1.5 = 384, bge-base = 768
        // We'll query it at runtime by embedding a test string
        384
    }
}

impl Embedder for FastEmbedder {
    fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let embeddings = self.model
            .embed(vec![text.to_string()], None)
            .map_err(|e| anyhow::anyhow!("Embedding failed: {}", e))?;

        embeddings
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No embedding returned"))
    }

    fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        let embeddings = self.model
            .embed(texts.to_vec(), None)
            .map_err(|e| anyhow::anyhow!("Batch embedding failed: {}", e))?;

        Ok(embeddings)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stub_embedder() {
        let embedder = StubEmbedder::new(384);
        let result = embedder.embed("test text").unwrap();
        assert_eq!(result.len(), 384);
        assert!(result.iter().all(|&x| x == 0.0));
    }

    #[test]
    fn test_stub_embed_batch() {
        let embedder = StubEmbedder::new(384);
        let texts = vec!["hello".to_string(), "world".to_string()];
        let results = embedder.embed_batch(&texts).unwrap();
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].len(), 384);
    }

    // Note: FastEmbedder test requires model download, so we don't run it in CI
    // #[test]
    // fn test_fast_embedder() {
    //     let embedder = FastEmbedder::new().unwrap();
    //     let result = embedder.embed("hello world").unwrap();
    //     assert_eq!(result.len(), 384);
    //     // Vectors should not be all zeros
    //     assert!(result.iter().any(|&x| x != 0.0));
    // }
}

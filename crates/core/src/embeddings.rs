/// Placeholder module for embedding functionality
/// Will integrate fastembed in future milestone

use crate::api::Embedder;

/// Stub embedder that returns zero vectors (for MVP)
pub struct StubEmbedder {
    pub dimension: usize,
}

impl StubEmbedder {
    pub fn new(dimension: usize) -> Self {
        Self { dimension }
    }
}

impl Embedder for StubEmbedder {
    fn embed(&self, _text: &str) -> anyhow::Result<Vec<f32>> {
        Ok(vec![0.0; self.dimension])
    }
}

// Future: FastEmbedder wrapper
// pub struct FastEmbedder {
//     inner: fastembed::TextEmbedding,
// }
// impl FastEmbedder {
//     pub fn new(model: &str) -> anyhow::Result<Self> {
//         let inner = fastembed::TextEmbedding::try_new_from(model)?;
//         Ok(Self { inner })
//     }
// }
// impl Embedder for FastEmbedder {
//     fn embed(&self, text: &str) -> anyhow::Result<Vec<f32>> {
//         let v = self.inner.embed(vec![text.to_string()])?;
//         Ok(v[0].clone())
//     }
// }

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
}

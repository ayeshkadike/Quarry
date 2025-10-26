/// Reranking module (placeholder for ONNX cross-encoder)
/// 
/// Future implementation will use ONNX Runtime to run models like:
/// - ms-marco-MiniLM-L-12-v2
/// - bge-reranker-base
/// 
/// For now, this is a stub.

pub struct OnnxReranker;

impl OnnxReranker {
    pub fn new(_model_path: &str) -> anyhow::Result<Self> {
        anyhow::bail!("ONNX reranking not yet implemented")
    }
}

// Future implementation:
// pub struct OnnxReranker {
//     session: ort::Session,
// }
//
// impl core::api::Reranker for OnnxReranker {
//     fn rerank(&self, query: &str, cands: Vec<Candidate>) -> anyhow::Result<Vec<Candidate>> {
//         // Run cross-encoder inference
//         // Return candidates sorted by new scores
//     }
// }

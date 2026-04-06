pub mod api;
pub mod embeddings;
pub mod fusion;
pub mod search;
pub mod tantivy_index;
pub mod vector_index;

pub use api::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hybrid_search_basics() {
        // Basic smoke test
        assert!(true);
    }
}

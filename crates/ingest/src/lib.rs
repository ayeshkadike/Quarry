pub mod chunk;
pub mod parse;

use sha2::{Digest, Sha256};

/// Compute SHA-256 hash of bytes
pub fn sha256_bytes(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// Compute SHA-256 hash of a string
pub fn sha256_string(s: &str) -> String {
    sha256_bytes(s.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256() {
        let hash = sha256_string("hello world");
        assert_eq!(hash.len(), 64); // SHA-256 produces 64 hex characters
        assert_eq!(
            hash,
            "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        );
    }
}

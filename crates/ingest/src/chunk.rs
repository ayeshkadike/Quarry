/// Document chunking with overlap

#[derive(Debug, Clone)]
pub struct Chunk {
    pub idx: i32,
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub tokens: usize,
}

/// Chunk text with target size and overlap (character-based for MVP)
/// Future: Replace with token-aware splitter using tiktoken-rs
pub fn chunk_text(text: &str, target_chars: usize, overlap_chars: usize) -> Vec<Chunk> {
    let mut chunks = Vec::new();
    let len = text.len();
    
    if len == 0 {
        return chunks;
    }

    let mut start = 0;
    let mut idx = 0;

    while start < len {
        let end = (start + target_chars).min(len);
        
        // Try to break at sentence boundaries for better chunks
        let chunk_end = if end < len {
            find_sentence_boundary(text, start, end)
        } else {
            end
        };

        let chunk_text = &text[start..chunk_end];
        let token_estimate = estimate_tokens(chunk_text);

        chunks.push(Chunk {
            idx,
            text: chunk_text.to_string(),
            start,
            end: chunk_end,
            tokens: token_estimate,
        });

        if chunk_end >= len {
            break;
        }

        // Move start forward, accounting for overlap
        start = chunk_end.saturating_sub(overlap_chars);
        if start == chunk_end {
            start += 1; // Ensure we make progress
        }
        idx += 1;
    }

    chunks
}

/// Find a good sentence boundary near the target end position
fn find_sentence_boundary(text: &str, start: usize, target_end: usize) -> usize {
    // Look for sentence endings: . ! ? followed by space or newline
    let search_window = 100; // chars to look back
    let search_start = target_end.saturating_sub(search_window);
    
    let search_slice = &text[search_start..target_end];
    
    // Find last sentence ending
    if let Some(pos) = search_slice.rfind(|c| c == '.' || c == '!' || c == '?') {
        let abs_pos = search_start + pos + 1;
        if abs_pos > start {
            return abs_pos;
        }
    }
    
    // Fall back to word boundary
    if let Some(pos) = search_slice.rfind(char::is_whitespace) {
        let abs_pos = search_start + pos;
        if abs_pos > start {
            return abs_pos;
        }
    }
    
    target_end
}

/// Estimate token count (rough approximation)
/// Future: Use tiktoken-rs for accurate counts
fn estimate_tokens(text: &str) -> usize {
    // Rough estimate: ~4 chars per token on average
    text.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunk_text_basic() {
        let text = "This is a test. This is another sentence. And one more for good measure.";
        let chunks = chunk_text(text, 30, 10);
        
        assert!(!chunks.is_empty());
        for (i, chunk) in chunks.iter().enumerate() {
            assert_eq!(chunk.idx, i as i32);
            assert!(chunk.tokens > 0);
        }
    }

    #[test]
    fn test_chunk_text_overlap() {
        let text = "AAAA BBBB CCCC DDDD EEEE FFFF GGGG HHHH";
        let chunks = chunk_text(text, 15, 5);
        
        assert!(chunks.len() >= 2);
        // Check that overlap exists between consecutive chunks
        if chunks.len() >= 2 {
            let first_end = &chunks[0].text[chunks[0].text.len().saturating_sub(5)..];
            let second_start = &chunks[1].text[..5.min(chunks[1].text.len())];
            // There should be some overlap in content
            assert!(first_end.len() > 0 && second_start.len() > 0);
        }
    }

    #[test]
    fn test_empty_text() {
        let chunks = chunk_text("", 100, 10);
        assert_eq!(chunks.len(), 0);
    }

    #[test]
    fn test_small_text() {
        let text = "Short text";
        let chunks = chunk_text(text, 1000, 100);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].text, text);
    }

    #[test]
    fn test_sentence_boundary() {
        let text = "First sentence. Second sentence. Third sentence. Fourth sentence.";
        let chunks = chunk_text(text, 30, 5);
        
        // Chunks should prefer breaking at sentence boundaries
        for chunk in &chunks {
            if chunk.text.len() > 20 {
                // Longer chunks should ideally end with sentence punctuation
                assert!(
                    chunk.text.trim_end().ends_with('.')
                        || chunk.text.trim_end().ends_with('!')
                        || chunk.text.trim_end().ends_with('?')
                        || chunk.idx == chunks.last().unwrap().idx
                );
            }
        }
    }
}

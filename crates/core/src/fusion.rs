/// Fusion strategies for combining multiple retrieval results
/// Future: Implement RRF (Reciprocal Rank Fusion) for blending BM25 + vector results

use crate::api::Candidate;

/// Reciprocal Rank Fusion algorithm
/// Combines multiple ranked lists with: score = sum(1 / (k + rank_i))
pub fn reciprocal_rank_fusion(
    results_lists: Vec<Vec<Candidate>>,
    k: usize,
) -> anyhow::Result<Vec<Candidate>> {
    if results_lists.is_empty() {
        return Ok(vec![]);
    }

    let k_param = k as f32;
    let mut score_map: std::collections::HashMap<String, (Candidate, f32)> =
        std::collections::HashMap::new();

    for results in results_lists {
        for (rank, candidate) in results.into_iter().enumerate() {
            let rrf_score = 1.0 / (k_param + (rank as f32 + 1.0));
            score_map
                .entry(candidate.id.clone())
                .and_modify(|(_, score)| *score += rrf_score)
                .or_insert((candidate, rrf_score));
        }
    }

    let mut fused: Vec<_> = score_map
        .into_iter()
        .map(|(_, (mut cand, score))| {
            cand.score = score;
            cand
        })
        .collect();

    fused.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    Ok(fused)
}

/// Linear interpolation fusion: alpha * score_a + (1-alpha) * score_b
pub fn linear_fusion(
    list_a: Vec<Candidate>,
    list_b: Vec<Candidate>,
    alpha: f32,
) -> anyhow::Result<Vec<Candidate>> {
    let mut score_map: std::collections::HashMap<String, (Candidate, f32, f32)> =
        std::collections::HashMap::new();

    // Normalize scores to [0, 1]
    let max_a = list_a.iter().map(|c| c.score).fold(0.0f32, f32::max);
    let max_b = list_b.iter().map(|c| c.score).fold(0.0f32, f32::max);

    for cand in list_a {
        let norm_score = if max_a > 0.0 { cand.score / max_a } else { 0.0 };
        score_map.insert(cand.id.clone(), (cand, norm_score, 0.0));
    }

    for cand in list_b {
        let norm_score = if max_b > 0.0 { cand.score / max_b } else { 0.0 };
        score_map
            .entry(cand.id.clone())
            .and_modify(|(_, _, b_score)| *b_score = norm_score)
            .or_insert((cand, 0.0, norm_score));
    }

    let mut fused: Vec<_> = score_map
        .into_iter()
        .map(|(_, (mut cand, a_score, b_score))| {
            cand.score = alpha * a_score + (1.0 - alpha) * b_score;
            cand
        })
        .collect();

    fused.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    Ok(fused)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::SourceMeta;

    fn make_candidate(id: &str, score: f32) -> Candidate {
        Candidate {
            id: id.to_string(),
            text: format!("Text for {}", id),
            score,
            source: SourceMeta::Local {
                doc_id: id.to_string(),
                chunk_id: format!("{}_chunk", id),
                title: id.to_string(),
            },
            start_char: None,
            end_char: None,
        }
    }

    #[test]
    fn test_reciprocal_rank_fusion() {
        let list1 = vec![
            make_candidate("doc1", 10.0),
            make_candidate("doc2", 8.0),
            make_candidate("doc3", 6.0),
        ];
        let list2 = vec![
            make_candidate("doc2", 9.0),
            make_candidate("doc1", 7.0),
            make_candidate("doc4", 5.0),
        ];

        let fused = reciprocal_rank_fusion(vec![list1, list2], 60).unwrap();
        assert!(!fused.is_empty());
        // doc1 and doc2 should rank high as they appear in both lists
        assert!(fused.iter().any(|c| c.id == "doc1"));
        assert!(fused.iter().any(|c| c.id == "doc2"));
    }

    #[test]
    fn test_linear_fusion() {
        let list1 = vec![
            make_candidate("doc1", 10.0),
            make_candidate("doc2", 5.0),
        ];
        let list2 = vec![
            make_candidate("doc2", 8.0),
            make_candidate("doc3", 4.0),
        ];

        let fused = linear_fusion(list1, list2, 0.5).unwrap();
        assert!(!fused.is_empty());
        assert!(fused.iter().any(|c| c.id == "doc2")); // Should be high as it appears in both
    }
}

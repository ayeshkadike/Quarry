use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct WebSearchReq {
    pub query: String,
    pub max_results: Option<usize>,
}

#[derive(Serialize)]
pub struct WebSearchResp {
    pub sources: Vec<WebSource>,
}

#[derive(Serialize)]
pub struct WebSource {
    pub url: String,
    pub title: String,
    pub snippet: String,
    pub fetched_at: String,
}

pub async fn web_search(Json(req): Json<WebSearchReq>) -> Result<Json<WebSearchResp>, StatusCode> {
    tracing::debug!("Web search request: {}", req.query);

    // TODO: Implement real web search
    // 1. Check user quota (rate limit)
    // 2. Call search provider (SerpAPI, Brave, etc.)
    // 3. Parse and return results
    // 4. Update usage counters

    // Stub response for MVP
    let sources = vec![
        WebSource {
            url: "https://example.com/result1".to_string(),
            title: format!("Sample result for: {}", req.query),
            snippet: "This is a placeholder web search result. Real implementation coming soon.".to_string(),
            fetched_at: chrono::Utc::now().to_rfc3339(),
        },
    ];

    Ok(Json(WebSearchResp { sources }))
}

#[derive(Deserialize)]
pub struct GenReq {
    pub question: String,
    pub passages: Vec<String>,
    pub max_tokens: Option<usize>,
}

#[derive(Serialize)]
pub struct GenResp {
    pub answer: String,
    pub tokens_used: u32,
}

pub async fn gen_answer(Json(req): Json<GenReq>) -> Result<Json<GenResp>, StatusCode> {
    tracing::debug!("Generation request: {}", req.question);

    // TODO: Implement real LLM generation
    // 1. Check user quota (token limit)
    // 2. Build prompt with passages
    // 3. Call LLM provider (OpenAI, Anthropic, etc.)
    // 4. Parse response
    // 5. Update usage counters

    // Stub response for MVP
    let answer = format!(
        "Based on {} passages, here's a generated answer: [Not implemented yet]",
        req.passages.len()
    );

    Ok(Json(GenResp {
        answer,
        tokens_used: 0,
    }))
}

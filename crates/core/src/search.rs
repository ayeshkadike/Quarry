/// Search module - placeholder for future search implementations
/// Will contain query parsing, expansion, etc.

pub struct QueryParser;

impl QueryParser {
    pub fn parse(query: &str) -> ParsedQuery {
        ParsedQuery {
            original: query.to_string(),
            terms: query
                .split_whitespace()
                .map(|s| s.to_lowercase())
                .collect(),
        }
    }
}

pub struct ParsedQuery {
    pub original: String,
    pub terms: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_parser() {
        let parsed = QueryParser::parse("Hello World Test");
        assert_eq!(parsed.terms, vec!["hello", "world", "test"]);
    }
}

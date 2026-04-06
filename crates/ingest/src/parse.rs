/// Document parsing for various formats

use anyhow::{Context, Result};
use mime_guess::mime;
use std::path::Path;

#[derive(Debug, Clone)]
pub enum ParsedDoc {
    Text { title: String, content: String },
}

/// Parse a text file
pub fn parse_txt(path: &Path) -> Result<ParsedDoc> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read file: {}", path.display()))?;

    let title = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Untitled")
        .to_string();

    Ok(ParsedDoc::Text { title, content })
}

/// Parse a PDF file
pub fn parse_pdf(path: &Path) -> Result<ParsedDoc> {
    let bytes = std::fs::read(path)
        .with_context(|| format!("Failed to read PDF file: {}", path.display()))?;
    
    let content = pdf_extract::extract_text_from_mem(&bytes)
        .with_context(|| format!("Failed to extract text from PDF: {}", path.display()))?;

    let title = path
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("Untitled")
        .to_string();

    Ok(ParsedDoc::Text { title, content })
}

/// Parse a Markdown file — extract plain text content, use first heading as title
pub fn parse_markdown(path: &Path) -> Result<ParsedDoc> {
    use pulldown_cmark::{Event, Parser, Tag, TagEnd};

    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read Markdown file: {}", path.display()))?;

    // Strip YAML frontmatter (---...---)
    let content_str = if raw.starts_with("---") {
        if let Some(end) = raw[3..].find("---") {
            raw[end + 6..].trim_start().to_string()
        } else {
            raw.clone()
        }
    } else {
        raw.clone()
    };

    let parser = Parser::new(&content_str);
    let mut plain_text = String::new();
    let mut first_heading: Option<String> = None;
    let mut in_heading = false;
    let mut heading_buf = String::new();

    for event in parser {
        match event {
            Event::Start(Tag::Heading { .. }) => {
                in_heading = true;
                heading_buf.clear();
            }
            Event::End(TagEnd::Heading(_)) => {
                in_heading = false;
                if first_heading.is_none() && !heading_buf.trim().is_empty() {
                    first_heading = Some(heading_buf.trim().to_string());
                }
                plain_text.push_str(&heading_buf);
                plain_text.push('\n');
            }
            Event::Text(text) | Event::Code(text) => {
                if in_heading {
                    heading_buf.push_str(&text);
                } else {
                    plain_text.push_str(&text);
                }
            }
            Event::SoftBreak | Event::HardBreak => {
                plain_text.push('\n');
            }
            Event::End(TagEnd::Paragraph) => {
                plain_text.push_str("\n\n");
            }
            _ => {}
        }
    }

    let title = first_heading.unwrap_or_else(|| {
        path.file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled")
            .to_string()
    });

    Ok(ParsedDoc::Text {
        title,
        content: plain_text.trim().to_string(),
    })
}

/// Parse an HTML file — extract readable text from body
pub fn parse_html(path: &Path) -> Result<ParsedDoc> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read HTML file: {}", path.display()))?;

    let document = scraper::Html::parse_document(&raw);

    // Try to get title from <title> tag
    let title_selector = scraper::Selector::parse("title").unwrap();
    let title = document
        .select(&title_selector)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|n| n.to_str())
                .unwrap_or("Untitled")
                .to_string()
        });

    // Extract text from body, skipping script/style tags
    let body_selector = scraper::Selector::parse("body").unwrap();

    let mut content = String::new();
    if let Some(body) = document.select(&body_selector).next() {
        for text_node in body.text() {
            let trimmed = text_node.trim();
            if !trimmed.is_empty() {
                content.push_str(trimmed);
                content.push(' ');
            }
        }
    } else {
        // No body tag, extract all text
        content = document.root_element().text().collect::<Vec<_>>().join(" ");
    }

    // Clean up excessive whitespace
    let content = content
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n");

    Ok(ParsedDoc::Text { title, content })
}

/// Parse a file based on its extension
pub fn parse_file(path: &Path) -> Result<ParsedDoc> {
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "txt" => parse_txt(path),
        "pdf" => parse_pdf(path),
        "md" | "markdown" => parse_markdown(path),
        "html" | "htm" => parse_html(path),
        _ => {
            // Try to parse as text if it looks like a text file
            if is_likely_text_file(path) {
                parse_txt(path)
            } else {
                anyhow::bail!("Unsupported file format: {}", extension)
            }
        }
    }
}

/// Check if a file is likely a text file based on MIME type
fn is_likely_text_file(path: &Path) -> bool {
    let mime = mime_guess::from_path(path).first_or_octet_stream();
    mime.type_() == mime::TEXT
}




#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_parse_txt() -> Result<()> {
        let mut file = NamedTempFile::new()?;
        writeln!(file, "Hello, world!")?;
        writeln!(file, "This is a test document.")?;

        let path = file.path();
        let parsed = parse_txt(path)?;

        match parsed {
            ParsedDoc::Text { title, content } => {
                assert!(!title.is_empty());
                assert!(content.contains("Hello, world!"));
                assert!(content.contains("test document"));
            }
        }

        Ok(())
    }

    #[test]
    fn test_parse_file_txt() -> Result<()> {
        let mut file = NamedTempFile::with_suffix(".txt")?;
        writeln!(file, "Content")?;

        let parsed = parse_file(file.path())?;
        match parsed {
            ParsedDoc::Text { content, .. } => {
                assert!(content.contains("Content"));
            }
        }

        Ok(())
    }

    #[test]
    fn test_parse_unsupported() {
        let path = Path::new("test.xyz");
        let result = parse_file(path);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_markdown() -> Result<()> {
        let mut file = NamedTempFile::with_suffix(".md")?;
        writeln!(file, "---")?;
        writeln!(file, "title: Test")?;
        writeln!(file, "---")?;
        writeln!(file, "# My Document")?;
        writeln!(file, "")?;
        writeln!(file, "Hello **world**, this is a test.")?;
        writeln!(file, "")?;
        writeln!(file, "## Section Two")?;
        writeln!(file, "More content here.")?;

        let parsed = parse_file(file.path())?;
        match parsed {
            ParsedDoc::Text { title, content } => {
                assert_eq!(title, "My Document");
                assert!(content.contains("Hello"));
                assert!(content.contains("world"));
                assert!(content.contains("More content here"));
            }
        }
        Ok(())
    }

    #[test]
    fn test_parse_html() -> Result<()> {
        let mut file = NamedTempFile::with_suffix(".html")?;
        writeln!(file, "<html><head><title>Test Page</title></head>")?;
        writeln!(file, "<body><h1>Hello</h1><p>World</p>")?;
        writeln!(file, "<script>var x = 1;</script></body></html>")?;

        let parsed = parse_file(file.path())?;
        match parsed {
            ParsedDoc::Text { title, content } => {
                assert_eq!(title, "Test Page");
                assert!(content.contains("Hello"));
                assert!(content.contains("World"));
                // Script content should not appear
                assert!(!content.contains("var x"));
            }
        }
        Ok(())
    }
}

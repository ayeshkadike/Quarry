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

/// Parse a file based on its extension
pub fn parse_file(path: &Path) -> Result<ParsedDoc> {
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match extension.as_str() {
        "txt" => parse_txt(path),
        // Future formats:
        // "pdf" => parse_pdf(path),
        // "md" | "markdown" => parse_markdown(path),
        // "html" | "htm" => parse_html(path),
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

// Future: PDF parsing via pdftotext
// pub fn parse_pdf(path: &Path) -> Result<ParsedDoc> {
//     use std::process::Command;
//     
//     let output = Command::new("pdftotext")
//         .arg("-layout")
//         .arg(path)
//         .arg("-")
//         .output()
//         .context("Failed to run pdftotext")?;
//     
//     if !output.status.success() {
//         anyhow::bail!("pdftotext failed");
//     }
//     
//     let content = String::from_utf8_lossy(&output.stdout).to_string();
//     let title = path.file_stem()
//         .and_then(|n| n.to_str())
//         .unwrap_or("Untitled")
//         .to_string();
//     
//     Ok(ParsedDoc::Text { title, content })
// }

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
}

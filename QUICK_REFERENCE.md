# Quick Reference - Local RAG Desktop

## Quick Start (30 seconds)
```bash
./setup.sh              # Install dependencies
cd apps/desktop
pnpm tauri dev          # Launch app
```

## Common Commands

### Development
```bash
make desktop            # Run Tauri app
make gateway            # Run gateway service
make test               # Run all tests
make fmt                # Format code
make clippy             # Lint code
```

### Database
```bash
make migrate-sqlite     # Run SQLite migrations
make migrate-gateway    # Run Postgres migrations
```

### Build
```bash
cd apps/desktop && pnpm tauri build    # Build desktop app
cargo build --release -p gateway       # Build gateway
```

## Architecture at a Glance

```
┌─────────────────────────────────────────┐
│         Tauri Desktop App               │
│  ┌─────────────┐  ┌──────────────────┐ │
│  │   React UI  │  │  Rust Backend    │ │
│  │  (Search)   │→ │  (Commands)      │ │
│  └─────────────┘  └──────────────────┘ │
└───────────────────────┬─────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌──────────┐   ┌──────────┐
   │ Storage │    │   Core   │   │  Ingest  │
   │ SQLite  │    │ Tantivy  │   │  Parsers │
   └─────────┘    └──────────┘   └──────────┘
```

## Key Files

### Configuration
- `Cargo.toml` - Rust workspace
- `apps/desktop/package.json` - Frontend deps
- `apps/desktop/src-tauri/tauri.conf.json` - Tauri config
- `migrations/sqlite/*.sql` - Database schema

### Core Logic
- `crates/core/src/tantivy_index.rs` - BM25 search
- `crates/ingest/src/chunk.rs` - Document chunking
- `crates/storage/src/service.rs` - Database CRUD
- `apps/desktop/src-tauri/commands.rs` - Tauri backend

### UI
- `apps/desktop/src/App.tsx` - Main React component
- `apps/desktop/src/index.css` - Tailwind styles

## Data Flow

### Ingestion
```
User selects folder
→ walkdir finds files
→ parse_file() extracts text
→ chunk_text() splits into chunks
→ store in SQLite
→ index in Tantivy
→ commit
```

### Search
```
User enters query
→ Tantivy BM25 search
→ HybridSearch orchestrator
→ (optional) rerank
→ return top-K candidates
→ display in UI
```

## API Reference

### Tauri Commands
```rust
create_collection(name: String) -> Result<String>
list_collections() -> Result<Vec<CollectionInfo>>
delete_collection(id: String) -> Result<()>
ingest_paths(collection_id: String, paths: Vec<String>) -> Result<IngestJobInfo>
search(req: SearchRequest) -> Result<Vec<SearchResult>>
get_ingest_status(job_id: String) -> Result<IngestJob>
```

### Gateway Endpoints
```
POST /v1/search/web
  Body: { query, max_results }
  Returns: { sources: [...] }

POST /v1/gen
  Body: { question, passages, max_tokens }
  Returns: { answer, tokens_used }
```

## Configuration Options

### Collection Settings
```json
{
  "chunk_size": 1200,        // Characters per chunk
  "chunk_overlap": 200,      // Overlap between chunks
  "embedding_model": null    // Future: fastembed model
}
```

### Conversation Settings
```json
{
  "temperature": 0.7,
  "max_tokens": 512,
  "use_web_assist": false
}
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Cannot find module 'react'" | Run `cd apps/desktop && pnpm install` |
| "Database locked" | Close other app instances |
| "Tantivy error" | Delete `~/.local-rag/indexes/` and re-ingest |
| "No results" | Check document status in DB is "indexed" |
| WebView2 error (Windows) | Install WebView2 Runtime |
| OpenSSL error (Linux) | `sudo apt install pkg-config libssl-dev` |

## Performance Tips

- **Slow ingestion?** Check file sizes, enable logging
- **Slow search?** First search loads index (cold), subsequent searches are fast
- **High memory?** Reduce chunk_size in collection settings
- **Large index?** Check number of chunks: `SELECT COUNT(*) FROM chunks`

## Testing Checklist

- [ ] Create collection
- [ ] Ingest sample corpus (e2e/sample_corpus/)
- [ ] Search for "information retrieval"
- [ ] Search for "machine learning"
- [ ] Search for "Rust ownership"
- [ ] Check scores are reasonable (> 0.5 for good matches)
- [ ] Delete collection
- [ ] Restart app, data persists

## Useful SQL Queries

```sql
-- Collection stats
SELECT c.name, COUNT(d.id) as docs, COUNT(ch.id) as chunks
FROM collections c
LEFT JOIN documents d ON c.id = d.collection_id
LEFT JOIN chunks ch ON d.id = ch.doc_id
GROUP BY c.id, c.name;

-- Find large chunks
SELECT doc_id, idx, tokens, LENGTH(text) as chars
FROM chunks
WHERE tokens > 500
ORDER BY tokens DESC;

-- Check ingestion status
SELECT status, COUNT(*) as count
FROM documents
GROUP BY status;
```

## Environment Variables

### Desktop App
- `RUST_LOG=debug` - Enable debug logging
- `RUST_BACKTRACE=1` - Show full backtraces

### Gateway
- `DATABASE_URL` - Postgres connection
- `OPENAI_API_KEY` - OpenAI key
- `SERPAPI_KEY` - SerpAPI key
- `JWT_SIGNING_KEY` - JWT secret

## File Locations

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\local-rag\` |
| macOS | `~/Library/Application Support/local-rag/` |
| Linux | `~/.local/share/local-rag/` |

## Resources

- [Tauri Docs](https://tauri.app/v1/guides/)
- [Tantivy Guide](https://github.com/quickwit-oss/tantivy)
- [SQLx Documentation](https://docs.rs/sqlx/)
- [React Documentation](https://react.dev/)

## Support

For issues or questions:
1. Check `PROJECT_STATUS.md` for known issues
2. Review `SETUP_GUIDE.md` for detailed setup
3. Enable debug logging: `RUST_LOG=debug`
4. Check the database and Tantivy index
5. File an issue with logs and steps to reproduce

---
**Need more help?** See SETUP_GUIDE.md or README.md

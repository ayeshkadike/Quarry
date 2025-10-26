# Local-First RAG Desktop - Project Setup

This guide will help you set up and run the complete project.

## Prerequisites

### Required
- **Rust** 1.75+ - [Install from rustup.rs](https://rustup.rs)
- **Node.js** 18+ - [Download](https://nodejs.org)
- **pnpm** - Install with: `npm install -g pnpm`

### Platform-Specific
- **Windows**: WebView2 (usually pre-installed on Windows 11)
- **macOS**: Xcode Command Line Tools
- **Linux**: See [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd rust-local-ai-search-server
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd apps/desktop
pnpm install
cd ../..

# Build Rust workspace (this will download and compile all Rust dependencies)
cargo build
```

### 3. Set Up Database

```bash
# Create SQLite database and run migrations
# Note: The Makefile commands use Unix-style, you may need to adjust for Windows

# On Windows with SQLx CLI installed:
sqlx database create --database-url sqlite://app.db
sqlx migrate run --source migrations/sqlite --database-url sqlite://app.db

# Or the app will auto-migrate on first run
```

### 4. Run the Desktop App

```bash
# From project root
cd apps/desktop
pnpm tauri dev
```

Or use the Makefile (adjust for Windows if needed):
```bash
make desktop
```

## First Time Usage

1. **Create a Collection**
   - Click "New Collection" button
   - Enter a name (e.g., "My Documents")
   - Click "Create"

2. **Add Documents**
   - Click "Add Documents" button
   - Select a folder containing `.txt` files
   - Wait for ingestion to complete (check console for progress)

3. **Search**
   - Type your query in the search box
   - Press Enter or click "Search"
   - View results with relevance scores

## Project Structure

```
rust-local-ai-search-server/
├── crates/              # Rust libraries
│   ├── core/           # Search engine, BM25, traits
│   ├── ingest/         # Parsing, chunking
│   ├── storage/        # SQLite models & service
│   ├── rerank/         # Placeholder for reranking
│   └── server/         # Placeholder for headless mode
├── apps/
│   ├── desktop/        # Tauri + React app
│   │   ├── src/        # React frontend
│   │   └── src-tauri/  # Rust backend
│   └── gateway/        # Axum service (optional)
└── migrations/
    ├── sqlite/         # App database
    └── gateway_postgres/  # Gateway quotas
```

## Development

### Run Tests

```bash
cargo test --workspace
```

### Run Gateway Service (Optional)

```bash
# Set up environment
cp apps/gateway/.env.example apps/gateway/.env
# Edit .env with your API keys

# Run service
cargo run -p gateway
```

### Format Code

```bash
cargo fmt --all
```

### Lint

```bash
cargo clippy --workspace --all-targets
```

## Building for Production

```bash
cd apps/desktop
pnpm tauri build
```

Binaries will be in `apps/desktop/src-tauri/target/release/bundle/`

## Troubleshooting

### Compilation Errors

1. **Tantivy or SQLx errors**: Make sure you have the latest Rust version
2. **OpenSSL errors (Linux)**: Install `pkg-config` and `libssl-dev`
3. **WebView2 errors (Windows)**: Install WebView2 Runtime

### Runtime Errors

1. **Database locked**: Close other instances of the app
2. **Index not found**: Delete `~/.local-rag/indexes/` and re-ingest
3. **No results**: Check that documents were successfully indexed (look for "indexed" status in database)

### Performance Issues

1. **Slow ingestion**: Large files take time; check console for progress
2. **Slow search**: First search is slower (index load); subsequent searches are fast
3. **High memory**: Reduce `chunk_size` in collection settings

## Data Location

- **Windows**: `%APPDATA%\local-rag\`
- **macOS**: `~/Library/Application Support/local-rag/`
- **Linux**: `~/.local/share/local-rag/`

Contains:
- `app.db` - SQLite database
- `indexes/` - Tantivy indexes (one per collection)

## Next Steps

- [ ] Add PDF support (requires pdftotext)
- [ ] Enable vector embeddings (fastembed)
- [ ] Add reranking (ONNX)
- [ ] Connect to gateway for web assist
- [ ] Integrate local LLM (Ollama)

## Support

For issues, check:
- [Tauri Documentation](https://tauri.app)
- [Tantivy Guide](https://github.com/quickwit-oss/tantivy)
- Project README.md

## License

MIT OR Apache-2.0

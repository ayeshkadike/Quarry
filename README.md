# Local-First RAG Desktop

A privacy-first desktop application for indexing and searching local documents with hybrid retrieval (BM25 + vectors) and optional cloud-assisted features.

## Features

- **Fully Offline by Default**: All indexing and search happens locally with no internet required
- **Hybrid Search**: BM25 keyword search with optional vector similarity (coming soon)
- **Multiple Document Formats**: TXT support (PDF, HTML, MD coming soon)
- **Smart Chunking**: Intelligent document chunking with overlap for better retrieval
- **Conversations**: Save Q&A sessions with source citations
- **Optional Cloud Assist**: Rate-limited web search and LLM generation via gateway service (optional)

## Architecture

### Monorepo Structure

```
local-rag/
  /crates
    /core       - Retrieval engine (BM25, vectors, fusion)
    /ingest     - Document parsers, chunker, deduplication
    /storage    - SQLite models and migrations
    /rerank     - Optional ONNX cross-encoder (future)
    /server     - Headless API mode (future)
  /apps
    /desktop    - Tauri + React UI
    /gateway    - Axum web service (web search + LLM proxy)
  /migrations
    /sqlite            - App database schema
    /gateway_postgres  - Gateway quotas & auth
```

### Tech Stack

- **Desktop**: Tauri, React, Vite, Tailwind CSS
- **Search Engine**: Tantivy (BM25 + HNSW vectors)
- **Embeddings**: fastembed (coming soon)
- **Storage**: SQLite with sqlx
- **Gateway**: Axum, Postgres
- **Reranking**: ONNX Runtime (coming soon)

## Quick Start

### Prerequisites

- Rust 1.75+ ([rustup.rs](https://rustup.rs))
- Node.js 18+ and pnpm
- (Optional) Postgres for gateway service

### 1. Clone and Install

```bash
git clone <repo-url>
cd rust-local-ai-search-server
```

### 2. Run Desktop App (Development)

```bash
make desktop
# Or manually:
# cd apps/desktop && pnpm install && pnpm tauri dev
```

### 3. Create Collection & Ingest Documents

1. Launch the app
2. Click "New Collection" and give it a name
3. Click "Add Documents" and select a folder with `.txt` files
4. Wait for ingestion to complete
5. Search your documents!

### 4. (Optional) Run Gateway Service

```bash
# Set up Postgres and environment
cp apps/gateway/.env.example apps/gateway/.env
# Edit .env with your DATABASE_URL, API keys, etc.

make migrate-gateway
make gateway
```

## Usage

### Desktop App

The desktop app provides:

- **Collections**: Organize documents into separate collections
- **Ingestion**: Parse, chunk, and index documents from folders
- **Search**: Hybrid BM25 search with relevance scoring
- **Conversations**: Save Q&A sessions with automatic citations
- **Settings**: Toggle cloud features, adjust search parameters

### Search Parameters

- **Top K**: Number of results to return (default: 10)
- **Alpha**: Balance between BM25 and vector search (0.0 = BM25 only, 1.0 = vectors only)
- **Rerank**: Apply cross-encoder reranking for better precision

### Web Assist (Optional)

Enable in Settings to:

- Supplement local results with web search
- Use cloud LLM for answer generation
- Rate-limited by tier (Free: 10 queries/day, Pro: 500/day)

## Development

### Run Tests

```bash
cargo test --workspace
```

### Build Desktop App

```bash
cd apps/desktop
pnpm tauri build
```

### Run SQLite Migrations

```bash
make migrate-sqlite
```

### Project Commands

See `Makefile` for all available commands:

- `make dev` - Run desktop app in dev mode
- `make gateway` - Run gateway service
- `make test` - Run all tests
- `make migrate-sqlite` - Apply SQLite migrations
- `make migrate-gateway` - Apply Postgres migrations

## Roadmap

### MVP (Current)
- [x] TXT file parsing
- [x] BM25 search via Tantivy
- [x] Basic Tauri UI
- [x] SQLite storage
- [ ] Background ingestion jobs
- [ ] Progress tracking

### Next Milestone
- [ ] Vector embeddings (fastembed)
- [ ] Hybrid BM25 + vector fusion
- [ ] ONNX cross-encoder reranking
- [ ] PDF parsing (via pdftotext)
- [ ] HTML/Markdown support
- [ ] Real Web Assist implementation
- [ ] Local LLM integration (Ollama)
- [ ] Answer generation with citations

### Future
- [ ] Multi-language support
- [ ] Advanced chunking strategies
- [ ] Incremental indexing
- [ ] Export conversations
- [ ] Teams/collaboration features
- [ ] Mobile apps (Tauri mobile)

## Privacy & Data

- **Local-First**: All documents and indexes stay on your machine
- **Optional Cloud**: Web search and LLM features are opt-in only
- **No Tracking**: Zero analytics or telemetry
- **Data Control**: Export or delete collections anytime

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `cargo test` and `cargo clippy` pass
5. Submit a PR

## License

MIT OR Apache-2.0

## Acknowledgments

- [Tantivy](https://github.com/quickwit-oss/tantivy) - Full-text search engine
- [Tauri](https://tauri.app) - Desktop app framework
- [fastembed](https://github.com/Anush008/fastembed-rs) - Fast embeddings

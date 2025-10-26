# E2E Test Fixtures and Sample Data

This directory contains sample documents and test fixtures for the Local RAG application.

## Sample Corpus

The `sample_corpus/` directory contains example text documents you can use to test the application:

- `information_retrieval.txt` - Overview of IR concepts and history
- `machine_learning.txt` - Introduction to ML types and algorithms
- `rust_programming.txt` - Overview of the Rust language

## Usage

### Testing the Desktop App

1. Start the desktop app
2. Create a new collection (e.g., "Test Collection")
3. Click "Add Documents" and select the `sample_corpus/` directory
4. Wait for ingestion to complete
5. Try these search queries:
   - "What is information retrieval?"
   - "Types of machine learning"
   - "Rust memory safety"
   - "neural networks applications"
   - "BM25 ranking"

### Expected Results

Good queries should return relevant chunks with high scores:
- Queries about "retrieval" should surface the information_retrieval.txt document
- Queries about "learning" or "neural" should surface machine_learning.txt
- Queries about "Rust" or "ownership" should surface rust_programming.txt

### Adding Your Own Test Data

To add more test documents:

1. Create `.txt` files in this directory
2. Use clear, descriptive content
3. Include section headings for better chunk boundaries
4. Keep documents focused on specific topics
5. Test with various query types

## Integration Tests

Future: This directory will also contain integration test scripts that:
- Automatically ingest documents
- Run predefined queries
- Verify expected results
- Measure recall@k and precision@k

## Performance Benchmarks

Track these metrics with the sample corpus:
- Ingestion time for all 3 documents
- Index size on disk
- First search latency (cold)
- Subsequent search latency (warm)
- Memory usage during search

Baseline expectations (on modern hardware):
- Ingest: < 1 second
- Index size: < 1 MB
- Cold search: < 100ms
- Warm search: < 10ms

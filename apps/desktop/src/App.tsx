import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

interface Collection {
  id: string;
  name: string;
  created_at: string;
  doc_count: number;
}

interface SearchResult {
  id: string;
  text: string;
  score: number;
  source: {
    type: string;
    title?: string;
    doc_id?: string;
    chunk_id?: string;
  };
}

function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      const cols = await invoke<Collection[]>("list_collections");
      setCollections(cols);
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0].id);
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }

  async function createCollection() {
    if (!newCollectionName.trim()) return;
    try {
      const id = await invoke<string>("create_collection", {
        name: newCollectionName,
      });
      setNewCollectionName("");
      setShowCreateDialog(false);
      await loadCollections();
      setSelectedCollection(id);
    } catch (err) {
      console.error("Failed to create collection:", err);
      alert(`Error: ${err}`);
    }
  }

  async function selectFiles() {
    if (!selectedCollection) {
      alert("Please select a collection first");
      return;
    }

    try {
      const selected = await open({
        multiple: true,
        directory: false,
        filters: [{
          name: 'Documents',
          extensions: ['txt', 'md', 'pdf', 'html', 'htm']
        }]
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];

      setLoading(true);
      const jobInfo = await invoke("ingest_paths", {
        collectionId: selectedCollection,
        paths,
      });
      console.log("Ingestion started:", jobInfo);
      
      // Reload collections to update doc count
      setTimeout(() => {
        loadCollections();
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to ingest files:", err);
      alert(`Error: ${err}`);
      setLoading(false);
    }
  }

  async function performSearch() {
    if (!selectedCollection || !query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await invoke<SearchResult[]>("search", {
        req: {
          collection_id: selectedCollection,
          query,
          top_k: 10,
        },
      });
      setResults(searchResults);
    } catch (err) {
      console.error("Search failed:", err);
      alert(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Local RAG</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              New Collection
            </button>
            <button
              onClick={selectFiles}
              disabled={!selectedCollection || loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Add Documents
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Collections Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection
          </label>
          <select
            value={selectedCollection || ""}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.doc_count} documents)
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && performSearch()}
              placeholder="Search your documents..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={performSearch}
              disabled={loading || !selectedCollection}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 && query && !loading && (
            <div className="text-center py-12 text-gray-500">
              No results found
            </div>
          )}
          {results.map((result, idx) => (
            <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {result.source.title || "Untitled"}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Score: {result.score.toFixed(3)}
                </span>
              </div>
              <p className="text-gray-800 leading-relaxed">{result.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Collection Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Collection</h2>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewCollectionName("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createCollection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

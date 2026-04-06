import { useState, useEffect } from 'react';
import { Message, Source, Collection, QuotaInfo } from '@/types';
import { AppHeader } from '../components/layout/AppHeader';
import { IngestDrawer } from '../components/layout/IngestDrawer';
import { CreateCollectionModal } from '../components/layout/CreateCollectionModal';
import { ChatMessage } from '../components/chat/ChatMessage';
import { Composer } from '../components/chat/Composer';
import { SourcesPanel } from '../components/chat/SourcesPanel';
import { Button } from '../components/ui/Button';
import { PanelRightClose, PanelRightOpen, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';

const MOCK_QUOTA: QuotaInfo = {
  webSearchUsed: 45,
  webSearchLimit: 100,
  generationTokensUsed: 125000,
  generationTokensLimit: 1000000,
};

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showSourcesPanel, setShowSourcesPanel] = useState(true);
  const [showIngestDrawer, setShowIngestDrawer] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cols = await invoke<Collection[]>('list_collections');
      setCollections(cols);
      
      // Auto-select first collection if available
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0].id);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError('Failed to load collections. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedCollection) {
      setError('Please select a collection first');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      // Call search API - use snake_case for the nested req object
      const results = await invoke<any[]>('search', { 
        req: {
          collection_id: selectedCollection,
          query: content,
          top_k: 10,
        }
      });
      const endTime = Date.now();
      const timeMs = endTime - startTime;

      // Convert search results to sources
      const newSources: Source[] = results.map((result, idx) => ({
        id: result.id,
        kind: 'local' as const,
        title: result.source?.title || `Document ${idx + 1}`,
        docId: result.source?.doc_id || result.id,
        score: result.score,
        preview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
        updatedAt: new Date().toISOString(),
      }));

      setSources(newSources);

      // Generate assistant response from search results
      const responseContent = formatSearchResults(results);
      const citations = results.slice(0, 5).map((result, idx) => ({
        id: `cite-${result.id}`,
        kind: 'local' as const,
        label: `L${idx + 1}`,
        title: result.source?.title || `Document ${idx + 1}`,
        docId: result.source?.doc_id || result.id,
        chunkId: result.id,
        score: result.score,
      }));

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseContent,
        citations,
        timestamp: new Date(),
        meta: {
          model: 'Local',
          tokens: Math.floor(responseContent.length / 4), // rough estimate
          timeMs,
          tokensPerSecond: Math.floor((responseContent.length / 4) / (timeMs / 1000)),
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Search failed:', err);
      setError(`Search failed: ${err}`);
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, I encountered an error while searching: ${err}`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSearchResults = (results: any[]): string => {
    if (results.length === 0) {
      return "I couldn't find any relevant information in the selected collection. Try rephrasing your query or selecting a different collection.";
    }

    let content = "Based on the documents in your collection, here's what I found:\n\n";
    
    results.slice(0, 3).forEach((result, idx) => {
      content += `**Source ${idx + 1}** (score: ${result.score.toFixed(2)}):\n`;
      content += `${result.text}\n\n`;
    });

    if (results.length > 3) {
      content += `\n_Found ${results.length - 3} more relevant sources. Check the Sources panel for details._`;
    }

    return content;
  };

  const handleCitationClick = (citationId: string) => {
    // Find the source that matches this citation
    const citation = messages
      .flatMap(m => m.citations || [])
      .find(c => c.id === citationId);
    if (citation) {
      setHighlightedSourceId(citation.chunkId || citation.docId || null);
      setShowSourcesPanel(true);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedSourceId(null), 3000);
    }
  };

  const handleSourceClick = (sourceId: string) => {
    console.log('Source clicked:', sourceId);
    // In real implementation: open document viewer or external link
  };

  const handleIngest = () => {
    setShowIngestDrawer(true);
  };

  const handleIngestClose = () => {
    setShowIngestDrawer(false);
    // Reload collections to update doc counts (with small delay to ensure DB commit)
    setTimeout(() => {
      loadCollections();
    }, 500);
  };

  const handleCreateCollection = () => {
    setShowCreateCollectionModal(true);
  };

  const handleCreateCollectionSuccess = (collectionId: string) => {
    setShowCreateCollectionModal(false);
    // Reload collections and auto-select the new one
    loadCollections();
    setSelectedCollection(collectionId);
  };

  const handleSettings = () => {
    console.log('Open settings');
    // In real implementation: open SettingsModal component
  };

  return (
    <div className="flex flex-col h-screen bg-app">
      {/* Header */}
      <AppHeader
        collections={collections}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        onCreateCollection={handleCreateCollection}
        quota={MOCK_QUOTA}
        model="Local"
        onSettingsClick={handleSettings}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Loading & Error States */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
                <p className="text-fg-muted">Loading collections...</p>
              </div>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-md text-center space-y-3 p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <span className="text-red-500 text-2xl">⚠</span>
                </div>
                <p className="text-fg-strong font-medium">Error</p>
                <p className="text-fg-muted text-sm">{error}</p>
                <Button onClick={loadCollections} variant="secondary" className="mt-4">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          {!isLoading && !error && (
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <EmptyState onIngest={handleIngest} onSend={handleSendMessage} hasCollections={collections.length > 0} />
              ) : (
                <div className="max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onCitationClick={handleCitationClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Composer */}
          {!isLoading && !error && (
            <Composer
              onSend={handleSendMessage}
              onAttach={handleIngest}
              disabled={isGenerating || !selectedCollection}
              model="Local"
            />
          )}
        </div>

        {/* Sources Panel */}
        <AnimatePresence>
          {showSourcesPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="border-l border-stroke bg-elev-1 overflow-hidden"
            >
              <div className="w-96 h-full flex flex-col">
                {/* Panel Header */}
                <div className="h-14 border-b border-stroke flex items-center justify-between px-4 shrink-0">
                  <h2 className="text-sm font-semibold text-fg-strong">Sources</h2>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowSourcesPanel(false)}
                  >
                    <PanelRightClose size={16} />
                  </Button>
                </div>

                {/* Sources List */}
                <SourcesPanel sources={sources} onSourceClick={handleSourceClick} highlightedSourceId={highlightedSourceId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Sources Panel Button */}
        {!showSourcesPanel && (
          <div className="absolute top-16 right-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowSourcesPanel(true)}
              className="shadow-lg"
            >
              <PanelRightOpen size={18} />
            </Button>
          </div>
        )}
      </div>

      {/* Ingest Drawer */}
      {showIngestDrawer && selectedCollection && (
        <IngestDrawer
          isOpen={showIngestDrawer}
          onClose={handleIngestClose}
          collectionId={selectedCollection}
          collectionName={collections.find(c => c.id === selectedCollection)?.name || 'Collection'}
        />
      )}

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
        onSuccess={handleCreateCollectionSuccess}
      />
    </div>
  );
}

function EmptyState({ onIngest, onSend, hasCollections }: { onIngest: () => void; onSend: (content: string) => void; hasCollections: boolean }) {
  const samplePrompts = [
    'Explain the difference between async/await and threads',
    'How does the borrow checker work in Rust?',
    'What are the best practices for error handling?',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <FileUp size={28} className="text-accent" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-fg-strong">
            {hasCollections ? 'Start a conversation' : 'Welcome to Quarry'}
          </h2>
          <p className="text-fg-muted">
            {hasCollections 
              ? 'Ask questions about your documents or try one of these examples'
              : 'Create a collection and ingest documents to get started'}
          </p>
        </div>

        {/* Sample Prompts - only show if has collections */}
        {hasCollections && (
          <div className="grid gap-3">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onSend(prompt)}
                className="p-4 rounded-xl border border-stroke bg-elev-1 hover:border-accent/40 hover:bg-accent/5 transition-all text-left group"
              >
                <p className="text-sm text-fg-default group-hover:text-accent transition-colors">
                  {prompt}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="pt-4">
          <Button onClick={onIngest} size="lg" className="gap-2">
            <FileUp size={18} />
            {hasCollections ? 'Add More Documents' : 'Get Started - Ingest Documents'}
          </Button>
        </div>
      </div>
    </div>
  );
}

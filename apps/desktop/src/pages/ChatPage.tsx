import { useState } from 'react';
import { Message, Source, Collection, QuotaInfo } from '@/types';
import { AppHeader } from '../components/layout/AppHeader';
import { ChatMessage } from '../components/chat/ChatMessage';
import { Composer } from '../components/chat/Composer';
import { SourcesPanel } from '../components/chat/SourcesPanel';
import { Button } from '../components/ui/Button';
import { PanelRightClose, PanelRightOpen, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data
const MOCK_COLLECTIONS: Collection[] = [
  { id: '1', name: 'Tech Docs', created_at: '2024-01-01T00:00:00Z', doc_count: 42 },
  { id: '2', name: 'Research Papers', created_at: '2024-01-02T00:00:00Z', doc_count: 18 },
  { id: '3', name: 'Project Notes', created_at: '2024-01-03T00:00:00Z', doc_count: 127 },
];

const MOCK_QUOTA: QuotaInfo = {
  webSearchUsed: 45,
  webSearchLimit: 100,
  generationTokensUsed: 125000,
  generationTokensLimit: 1000000,
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'What are the key differences between Rust and C++ in terms of memory safety?',
    timestamp: new Date('2024-10-26T10:00:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content: `Rust and C++ take fundamentally different approaches to memory safety:

## Ownership System
Rust enforces memory safety at **compile time** through its ownership system. Every value has a single owner, and when the owner goes out of scope, the value is automatically dropped. This prevents:
- Use-after-free bugs
- Double-free errors  
- Memory leaks (in most cases)

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is moved to s2
    // println!("{}", s1); // This won't compile!
}
\`\`\`

## Borrowing & References
Rust's borrow checker ensures that you can have either:
- **One mutable reference** OR
- **Multiple immutable references**

This prevents data races at compile time.

## C++ Approach
C++ provides tools like smart pointers (\`unique_ptr\`, \`shared_ptr\`) but doesn't enforce their use. Memory safety is the programmer's responsibility, making it more flexible but error-prone.

The key advantage of Rust is that memory safety bugs are caught at compile time rather than runtime, leading to more reliable software.`,
    citations: [
      {
        id: 'c1',
        kind: 'local',
        label: 'L1',
        title: 'The Rust Programming Language - Chapter 4',
        docId: 'rust-book-ch4',
        chunkId: 'ownership',
        score: 0.92,
      },
      {
        id: 'c2',
        kind: 'local',
        label: 'L2',
        title: 'Rust vs C++ Memory Management',
        docId: 'rust-vs-cpp',
        chunkId: 'memory',
        score: 0.88,
      },
      {
        id: 'c3',
        kind: 'web',
        label: 'W1',
        title: 'Memory Safety in Systems Programming',
        url: 'https://blog.rust-lang.org/2024/05/01/memory-safety.html',
        score: 0.85,
        freshness: 'new',
      },
    ],
    meta: {
      model: 'Local',
      tokens: 342,
      timeMs: 1580,
      tokensPerSecond: 216.5,
    },
    timestamp: new Date('2024-10-26T10:00:15'),
  },
];

const MOCK_SOURCES: Source[] = [
  {
    id: 's1',
    kind: 'local',
    title: 'The Rust Programming Language - Chapter 4: Ownership',
    docId: 'rust-book-ch4',
    score: 0.92,
    preview: 'Ownership is Rust\'s most unique feature and has deep implications for the rest of the language. It enables Rust to make memory safety guarantees without needing a garbage collector...',
    updatedAt: '2024-10-20T14:30:00Z',
  },
  {
    id: 's2',
    kind: 'local',
    title: 'Rust vs C++ Memory Management Comparison',
    docId: 'rust-vs-cpp',
    score: 0.88,
    preview: 'Both Rust and C++ are systems programming languages, but they take very different approaches to memory management. Rust enforces memory safety at compile time through its ownership system...',
    updatedAt: '2024-10-18T09:15:00Z',
  },
  {
    id: 's3',
    kind: 'web',
    title: 'Memory Safety in Systems Programming Languages',
    url: 'https://blog.rust-lang.org/2024/05/01/memory-safety.html',
    score: 0.85,
    preview: 'Memory safety vulnerabilities remain one of the most common sources of security issues. This article explores how modern languages like Rust address these challenges...',
    updatedAt: '2024-05-01T08:00:00Z',
    domain: 'blog.rust-lang.org',
  },
  {
    id: 's4',
    kind: 'web',
    title: 'Smart Pointers in C++ and Rust',
    url: 'https://www.modernescpp.com/articles/smart-pointers',
    score: 0.78,
    preview: 'Smart pointers provide automatic memory management in C++. Rust takes this concept further by making ownership and borrowing first-class language features...',
    updatedAt: '2024-09-15T12:00:00Z',
    domain: 'modernescpp.com',
  },
];

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [sources, setSources] = useState<Source[]>(MOCK_SOURCES);
  const [selectedCollection, setSelectedCollection] = useState<string>('1');
  const [showSourcesPanel, setShowSourcesPanel] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: 'This is a mock response. In a real implementation, this would call your search and generation API.',
        isStreaming: true,
        timestamp: new Date(),
        meta: {
          model: 'Local',
          tokens: 45,
          timeMs: 850,
          tokensPerSecond: 52.9,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Simulate streaming complete
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
          )
        );
        setIsGenerating(false);
      }, 1500);
    }, 500);
  };

  const handleCitationClick = (citationId: string) => {
    console.log('Citation clicked:', citationId);
    // In real implementation: scroll to source in panel
  };

  const handleSourceClick = (sourceId: string) => {
    console.log('Source clicked:', sourceId);
    // In real implementation: open document viewer or external link
  };

  const handleIngest = () => {
    console.log('Open ingest drawer');
    // In real implementation: open IngestDrawer component
  };

  const handleSettings = () => {
    console.log('Open settings');
    // In real implementation: open SettingsModal component
  };

  return (
    <div className="flex flex-col h-screen bg-app">
      {/* Header */}
      <AppHeader
        collections={MOCK_COLLECTIONS}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        quota={MOCK_QUOTA}
        model="Local"
        onSettingsClick={handleSettings}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <EmptyState onIngest={handleIngest} />
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

          {/* Composer */}
          <Composer
            onSend={handleSendMessage}
            onAttach={handleIngest}
            disabled={isGenerating}
            model="Local"
          />
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
                <SourcesPanel sources={sources} onSourceClick={handleSourceClick} />
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
    </div>
  );
}

function EmptyState({ onIngest }: { onIngest: () => void }) {
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
            Start a conversation
          </h2>
          <p className="text-fg-muted">
            Ask questions about your documents or try one of these examples
          </p>
        </div>

        {/* Sample Prompts */}
        <div className="grid gap-3">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                // In real implementation: pre-fill composer with prompt
                console.log('Sample prompt:', prompt);
              }}
              className="p-4 rounded-xl border border-stroke bg-elev-1 hover:border-accent/40 hover:bg-accent/5 transition-all text-left group"
            >
              <p className="text-sm text-fg-default group-hover:text-accent transition-colors">
                {prompt}
              </p>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Button onClick={onIngest} size="lg" className="gap-2">
            <FileUp size={18} />
            Ingest Documents
          </Button>
        </div>
      </div>
    </div>
  );
}

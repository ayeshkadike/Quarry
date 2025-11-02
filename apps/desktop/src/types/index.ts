export type MessageRole = 'user' | 'assistant';
export type SourceKind = 'local' | 'web';
export type CitationKind = 'local' | 'web';
export type ModelType = 'Local' | 'OpenAI' | 'Claude';
export type Freshness = 'new' | 'stale';

export interface Citation {
  id: string;
  kind: CitationKind;
  label: string;
  title: string;
  url?: string;
  docId?: string;
  chunkId?: string;
  freshness?: Freshness;
  score: number;
}

export interface MessageMeta {
  model?: ModelType;
  tokens?: number;
  timeMs?: number;
  tokensPerSecond?: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  meta?: MessageMeta;
  isStreaming?: boolean;
  timestamp: Date;
}

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  url?: string;
  docId?: string;
  score: number;
  preview: string;
  updatedAt: string;
  domain?: string;
}

export interface Collection {
  id: string;
  name: string;
  created_at: string;
  doc_count: number;
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  source: any;
  start_char?: number;
  end_char?: number;
}

export interface SearchRequest {
  collection_id: string;
  query: string;
  top_k: number;
}

export interface QuotaInfo {
  webSearchUsed: number;
  webSearchLimit: number;
  generationTokensUsed: number;
  generationTokensLimit: number;
}

export interface IngestFile {
  id: string;
  name: string;
  path: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
  eta?: number; // seconds
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  accent: 'teal' | 'violet' | 'amber';
  density: 'cozy' | 'compact';
  fontScale: number;
  enableWebAssist: boolean;
  enableCloudGen: boolean;
  defaultModel: ModelType;
}

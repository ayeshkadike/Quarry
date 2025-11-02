import { Message } from '@/types';
import { cn, formatLatency, formatTokens } from '@/lib/utils';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CitationChip } from './CitationChip';
import { Button } from '../ui/Button';

interface ChatMessageProps {
  message: Message;
  onCitationClick?: (citationId: string) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'group relative flex gap-4 px-4 py-6',
        isUser ? 'bg-transparent' : 'bg-elev-1'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-accent text-white'
            : 'bg-gradient-to-br from-accent/20 to-accent/5 text-accent border border-accent/20'
        )}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return inline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <div className="relative group/code">
                    <pre className="relative">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                );
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover underline decoration-accent/30 hover:decoration-accent/60 transition-colors"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {message.isStreaming && (
            <motion.span
              className="inline-block w-2 h-4 ml-1 bg-accent rounded-sm"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {message.citations.map((citation) => (
              <CitationChip
                key={citation.id}
                citation={citation}
                onClick={() => onCitationClick?.(citation.id)}
              />
            ))}
          </div>
        )}

        {/* Meta info */}
        {message.meta && !isUser && (
          <div className="flex items-center gap-3 text-2xs text-fg-muted pt-1">
            {message.meta.model && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {message.meta.model}
              </span>
            )}
            {message.meta.tokens && (
              <span>{formatTokens(message.meta.tokens)} tokens</span>
            )}
            {message.meta.timeMs && (
              <span>{formatLatency(message.meta.timeMs)}</span>
            )}
            {message.meta.tokensPerSecond && (
              <span>{message.meta.tokensPerSecond.toFixed(1)} tok/s</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="h-7 w-7"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </Button>
      </div>
    </motion.div>
  );
}

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Send, Paperclip, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComposerProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  model?: string;
}

const SLASH_COMMANDS = [
  { command: '/search', description: 'Search the knowledge base' },
  { command: '/summarize', description: 'Summarize selected content' },
  { command: '/explain', description: 'Explain a concept in detail' },
];

export function Composer({
  onSend,
  onAttach,
  placeholder = 'Ask anything...',
  disabled = false,
  model = 'Local',
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [message]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
    setShowCommands(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Show slash commands
    if (e.key === '/' && message.trim() === '') {
      setShowCommands(true);
      setCommandFilter('');
    }

    // Hide commands on Escape
    if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Filter slash commands
    if (value.startsWith('/')) {
      setShowCommands(true);
      setCommandFilter(value);
    } else {
      setShowCommands(false);
    }
  };

  const selectCommand = (command: string) => {
    setMessage(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.startsWith(commandFilter)
  );

  return (
    <div className="relative border-t border-stroke bg-elev-1/80 backdrop-blur-sm">
      {/* Slash commands menu */}
      <AnimatePresence>
        {showCommands && filteredCommands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-stroke bg-elev-1 shadow-xl overflow-hidden z-10"
          >
            {filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.command}
                onClick={() => selectCommand(cmd.command)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors',
                  'hover:bg-hover',
                  idx > 0 && 'border-t border-stroke'
                )}
              >
                <div className="flex items-start gap-3">
                  <Sparkles size={16} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-fg-strong font-mono">
                      {cmd.command}
                    </div>
                    <div className="text-xs text-fg-muted mt-0.5">
                      {cmd.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-3">
          {/* Attach button */}
          {onAttach && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAttach}
              disabled={disabled}
              className="shrink-0"
            >
              <Paperclip size={18} />
            </Button>
          )}

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full resize-none rounded-lg border border-stroke bg-elev-2 px-4 py-3 text-sm text-fg-strong placeholder:text-fg-muted',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-150'
              )}
              style={{ maxHeight: '200px' }}
            />
            
            {/* Model indicator */}
            <div className="absolute right-3 bottom-3 text-2xs text-fg-subtle font-medium">
              {model}
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>

        {/* Hints */}
        <div className="mt-2 flex items-center justify-between text-2xs text-fg-subtle">
          <div className="flex items-center gap-3">
            <kbd className="px-1.5 py-0.5 rounded bg-elev-2 border border-stroke font-mono">
              Enter
            </kbd>
            <span>to send</span>
            <kbd className="px-1.5 py-0.5 rounded bg-elev-2 border border-stroke font-mono">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 rounded bg-elev-2 border border-stroke font-mono">
              /
            </kbd>
            <span className="ml-1">for commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Citation } from '@/types';
import { cn, getDomainFromUrl, getDomainInitial } from '@/lib/utils';
import { motion } from 'framer-motion';
import * as HoverCard from '@radix-ui/react-hover-card';
import { FileText, Globe } from 'lucide-react';

interface CitationChipProps {
  citation: Citation;
  onClick?: () => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  const isWeb = citation.kind === 'web';
  const domain = citation.url ? getDomainFromUrl(citation.url) : '';
  const initial = domain ? getDomainInitial(domain) : citation.label.charAt(0);

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onClick}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            'border transition-all duration-150',
            'hover:shadow-sm',
            isWeb
              ? 'bg-info-muted/30 text-info border-info/20 hover:border-info/40'
              : 'bg-accent-muted/30 text-accent border-accent/20 hover:border-accent/40'
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold',
              isWeb ? 'bg-info/20 text-info' : 'bg-accent/20 text-accent'
            )}
          >
            {initial}
          </span>
          <span className="font-mono">[{citation.label}]</span>
        </motion.button>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={8}
          className={cn(
            'z-50 w-80 rounded-xl border border-stroke bg-elev-1 shadow-xl',
            'animate-scale-in origin-bottom'
          )}
        >
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isWeb
                    ? 'bg-info/10 text-info'
                    : 'bg-accent/10 text-accent'
                )}
              >
                {isWeb ? <Globe size={16} /> : <FileText size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-fg-strong truncate">
                  {citation.title}
                </h4>
                {domain && (
                  <p className="text-xs text-fg-muted mt-0.5 truncate">{domain}</p>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-elev-2 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isWeb ? 'bg-info' : 'bg-accent'
                  )}
                  style={{ width: `${citation.score * 100}%` }}
                />
              </div>
              <span className="text-xs text-fg-muted font-mono">
                {(citation.score * 100).toFixed(0)}%
              </span>
            </div>

            {/* Freshness badge */}
            {citation.freshness && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    citation.freshness === 'new'
                      ? 'bg-success-muted text-success'
                      : 'bg-warning-muted text-warning'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {citation.freshness === 'new' ? 'Recent' : 'Older'}
                </span>
              </div>
            )}

            {/* Action hint */}
            <p className="text-2xs text-fg-subtle pt-1">
              Click to scroll to source
            </p>
          </div>
          <HoverCard.Arrow className="fill-stroke" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

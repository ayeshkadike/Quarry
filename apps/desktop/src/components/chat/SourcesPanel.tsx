import { Source } from '@/types';
import { cn, getDomainFromUrl, getDomainInitial, formatDate } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileText, Globe, ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SourcesPanelProps {
  sources: Source[];
  onSourceClick?: (sourceId: string) => void;
  className?: string;
}

export function SourcesPanel({ sources, onSourceClick, className }: SourcesPanelProps) {
  const localSources = sources.filter((s) => s.kind === 'local');
  const webSources = sources.filter((s) => s.kind === 'web');

  const SourceItem = ({ source, index }: { source: Source; index: number }) => {
    const isWeb = source.kind === 'web';
    const domain = source.url ? getDomainFromUrl(source.url) : '';
    const initial = domain ? getDomainInitial(domain) : 'L';

    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        onClick={() => onSourceClick?.(source.id)}
        className="w-full text-left group"
      >
        <Card className="hover:border-stroke-hover hover:shadow-md transition-all duration-150 overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              {/* Avatar/Icon */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-semibold text-sm',
                  isWeb
                    ? 'bg-info/10 text-info'
                    : 'bg-accent/10 text-accent'
                )}
              >
                {isWeb ? (
                  domain.includes('.') ? (
                    initial
                  ) : (
                    <Globe size={16} />
                  )
                ) : (
                  <FileText size={16} />
                )}
              </div>

              {/* Title & Domain */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-fg-strong line-clamp-2 group-hover:text-accent transition-colors">
                  {source.title}
                </h4>
                {domain && (
                  <p className="text-xs text-fg-muted mt-1 truncate">{domain}</p>
                )}
              </div>

              {/* External link icon for web sources */}
              {isWeb && source.url && (
                <ExternalLink size={14} className="text-fg-muted group-hover:text-accent transition-colors shrink-0" />
              )}
            </div>

            {/* Preview */}
            <p className="text-sm text-fg-muted line-clamp-3 leading-relaxed">
              {source.preview}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              {/* Score */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 max-w-[100px] h-1.5 bg-elev-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isWeb ? 'bg-info' : 'bg-accent'
                    )}
                    style={{ width: `${source.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-fg-muted font-mono">
                  {(source.score * 100).toFixed(0)}%
                </span>
              </div>

              {/* Date */}
              <Badge variant="ghost" className="text-2xs">
                {formatDate(source.updatedAt)}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.button>
    );
  };

  if (sources.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full px-6', className)}>
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-elev-2 flex items-center justify-center">
            <FileText size={20} className="text-fg-muted" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-fg-strong">No sources yet</h3>
            <p className="text-xs text-fg-muted mt-1">
              Sources from your search will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      <div className="p-4 space-y-6">
        {/* Local Sources */}
        {localSources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="flex items-center gap-2 flex-1">
                <FileText size={14} className="text-accent" />
                <h3 className="text-xs font-semibold text-fg-strong uppercase tracking-wide gradient-underline">
                  Local Sources
                </h3>
              </div>
              <Badge variant="accent" className="text-2xs">
                {localSources.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {localSources.map((source, idx) => (
                <SourceItem key={source.id} source={source} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Web Sources */}
        {webSources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="flex items-center gap-2 flex-1">
                <Globe size={14} className="text-info" />
                <h3 className="text-xs font-semibold text-fg-strong uppercase tracking-wide gradient-underline">
                  Web Sources
                </h3>
              </div>
              <Badge variant="info" className="text-2xs">
                {webSources.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {webSources.map((source, idx) => (
                <SourceItem key={source.id} source={source} index={idx + localSources.length} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

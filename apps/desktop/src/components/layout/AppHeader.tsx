import { Collection, QuotaInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Settings, Moon, Sun, Monitor, ChevronDown, Sparkles } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTheme } from '@/lib/useTheme';
import { motion } from 'framer-motion';

interface AppHeaderProps {
  collections: Collection[];
  selectedCollection: string | null;
  onCollectionChange: (id: string) => void;
  quota?: QuotaInfo;
  model?: string;
  onSettingsClick: () => void;
}

export function AppHeader({
  collections,
  selectedCollection,
  onCollectionChange,
  quota,
  model = 'Local',
  onSettingsClick,
}: AppHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const selectedCol = collections.find((c) => c.id === selectedCollection);

  const quotaPercent = quota
    ? (quota.webSearchUsed / quota.webSearchLimit) * 100
    : 0;

  return (
    <header className="h-14 border-b border-stroke bg-elev-1/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      {/* Left: Logo/Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-fg-strong">AI Search</h1>
        </div>
      </div>

      {/* Center: Collection Selector */}
      <div className="flex-1 flex justify-center">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" className="min-w-[200px] justify-between">
              <span className="truncate">
                {selectedCol ? selectedCol.name : 'Select Collection'}
              </span>
              <ChevronDown size={16} />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="center"
              sideOffset={8}
              className={cn(
                'z-50 min-w-[240px] rounded-xl border border-stroke bg-elev-1 shadow-xl overflow-hidden',
                'animate-scale-in'
              )}
            >
              {collections.map((col) => (
                <DropdownMenu.Item
                  key={col.id}
                  onClick={() => onCollectionChange(col.id)}
                  className={cn(
                    'px-4 py-3 text-sm outline-none cursor-pointer transition-colors',
                    'hover:bg-hover',
                    'focus:bg-hover',
                    selectedCollection === col.id && 'bg-accent/5 text-accent font-medium'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{col.name}</span>
                    <Badge variant="ghost" className="text-2xs">
                      {col.doc_count}
                    </Badge>
                  </div>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Right: Model, Quota, Theme, Settings */}
      <div className="flex items-center gap-3">
        {/* Model badge */}
        <Badge variant="accent" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
          {model}
        </Badge>

        {/* Quota meter */}
        {quota && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stroke hover:border-stroke-hover hover:bg-hover transition-all">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="rgb(var(--stroke))"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="rgb(var(--accent))"
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 14 * (1 - quotaPercent / 100),
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xs font-semibold text-fg-strong">
                    {Math.round(quotaPercent)}
                  </span>
                </div>
                <span className="text-xs text-fg-muted group-hover:text-fg-default transition-colors">
                  Quota
                </span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-64 rounded-xl border border-stroke bg-elev-1 shadow-xl p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-fg-strong">Usage</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-fg-muted">Web Searches</span>
                    <span className="text-fg-strong font-medium">
                      {quota.webSearchUsed} / {quota.webSearchLimit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-elev-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-info rounded-full transition-all"
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-fg-muted">Generation Tokens</span>
                    <span className="text-fg-strong font-medium">
                      {quota.generationTokensUsed.toLocaleString()} /{' '}
                      {quota.generationTokensLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-elev-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{
                        width: `${
                          (quota.generationTokensUsed / quota.generationTokensLimit) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        {/* Theme toggle */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon">
              {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[160px] rounded-xl border border-stroke bg-elev-1 shadow-xl overflow-hidden"
            >
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <DropdownMenu.Item
                  key={value}
                  onClick={() => setTheme(value as any)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm outline-none cursor-pointer transition-colors',
                    'hover:bg-hover focus:bg-hover',
                    theme === value && 'bg-accent/5 text-accent font-medium'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={onSettingsClick}>
          <Settings size={18} />
        </Button>
      </div>
    </header>
  );
}

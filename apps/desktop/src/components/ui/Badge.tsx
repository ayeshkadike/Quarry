import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-elev-2 text-fg-default border border-stroke',
        accent: 'bg-accent-muted text-accent-fg border border-accent/20',
        success: 'bg-success-muted text-success border border-success/20',
        warning: 'bg-warning-muted text-warning border border-warning/20',
        error: 'bg-error-muted text-error border border-error/20',
        info: 'bg-info-muted text-info border border-info/20',
        ghost: 'text-fg-muted hover:bg-hover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const Badge = ({ className, ...p }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium', className)} {...p} />
);

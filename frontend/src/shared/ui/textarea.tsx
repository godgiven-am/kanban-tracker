import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn('flex min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50', className)} {...p} />
));

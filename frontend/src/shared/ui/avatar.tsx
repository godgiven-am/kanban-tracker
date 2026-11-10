import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as A from '@radix-ui/react-avatar';
import { cn } from '../lib/cn';

export const Avatar = forwardRef<ElementRef<typeof A.Root>, ComponentPropsWithoutRef<typeof A.Root>>(({ className, ...p }, ref) => (
  <A.Root ref={ref} className={cn('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full', className)} {...p} />
));
export const AvatarImage = A.Image;
export const AvatarFallback = forwardRef<ElementRef<typeof A.Fallback>, ComponentPropsWithoutRef<typeof A.Fallback>>(({ className, ...p }, ref) => (
  <A.Fallback ref={ref} className={cn('flex h-full w-full items-center justify-center bg-secondary text-xs font-medium', className)} {...p} />
));

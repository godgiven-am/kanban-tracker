import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as D from '@radix-ui/react-dialog';
import { cn } from '../lib/cn';

export const Dialog = D.Root;

export const DialogContent = forwardRef<ElementRef<typeof D.Content>, ComponentPropsWithoutRef<typeof D.Content>>(({ className, children, ...p }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <D.Content ref={ref} className={cn('ui fixed left-1/2 top-1/2 z-50 grid w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 gap-3 rounded-lg border bg-background p-5 shadow-lg', className)} {...p}>
      {children}
    </D.Content>
  </D.Portal>
));
export const DialogHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('grid gap-1', className)} {...p} />;
export const DialogFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn('flex justify-end gap-2', className)} {...p} />;
export const DialogTitle = forwardRef<ElementRef<typeof D.Title>, ComponentPropsWithoutRef<typeof D.Title>>(({ className, ...p }, ref) => (
  <D.Title ref={ref} className={cn('text-lg font-semibold', className)} {...p} />
));
export const DialogDescription = forwardRef<ElementRef<typeof D.Description>, ComponentPropsWithoutRef<typeof D.Description>>(({ className, ...p }, ref) => (
  <D.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...p} />
));

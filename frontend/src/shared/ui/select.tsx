import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as S from '@radix-ui/react-select';
import { cn } from '../lib/cn';

export const Select = S.Root;
export const SelectValue = S.Value;

export const SelectTrigger = forwardRef<ElementRef<typeof S.Trigger>, ComponentPropsWithoutRef<typeof S.Trigger>>(({ className, children, ...p }, ref) => (
  <S.Trigger ref={ref} className={cn('flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm data-[placeholder]:text-muted-foreground', className)} {...p}>
    {children}
    <S.Icon aria-hidden>▾</S.Icon>
  </S.Trigger>
));

export const SelectContent = forwardRef<ElementRef<typeof S.Content>, ComponentPropsWithoutRef<typeof S.Content>>(({ className, children, ...p }, ref) => (
  <S.Portal>
    <S.Content ref={ref} position="popper" sideOffset={4} className={cn('ui z-[60] min-w-[var(--radix-select-trigger-width)] rounded-md border bg-background p-1 shadow-md', className)} {...p}>
      <S.Viewport>{children}</S.Viewport>
    </S.Content>
  </S.Portal>
));

export const SelectItem = forwardRef<ElementRef<typeof S.Item>, ComponentPropsWithoutRef<typeof S.Item>>(({ className, children, ...p }, ref) => (
  <S.Item ref={ref} className={cn('cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-secondary', className)} {...p}>
    <S.ItemText>{children}</S.ItemText>
  </S.Item>
));

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as A from '@radix-ui/react-accordion';
import { cn } from '../lib/cn';

export const Accordion = A.Root;

export const AccordionItem = forwardRef<ElementRef<typeof A.Item>, ComponentPropsWithoutRef<typeof A.Item>>(({ className, ...p }, ref) => (
  <A.Item ref={ref} className={cn('border-b', className)} {...p} />
));

export const AccordionTrigger = forwardRef<ElementRef<typeof A.Trigger>, ComponentPropsWithoutRef<typeof A.Trigger>>(({ className, children, ...p }, ref) => (
  <A.Header className="flex">
    <A.Trigger ref={ref} className={cn('flex flex-1 items-center justify-between py-3 text-left text-sm font-medium hover:underline', className)} {...p}>
      {children}
      <span aria-hidden>▾</span>
    </A.Trigger>
  </A.Header>
));

export const AccordionContent = forwardRef<ElementRef<typeof A.Content>, ComponentPropsWithoutRef<typeof A.Content>>(({ className, children, ...p }, ref) => (
  <A.Content ref={ref} className="overflow-hidden text-sm" {...p}>
    <div className={cn('pb-3 text-muted-foreground', className)}>{children}</div>
  </A.Content>
));

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as T from '@radix-ui/react-tooltip';
import { cn } from '../lib/cn';

export const TooltipProvider = T.Provider;
export const Tooltip = T.Root;
export const TooltipTrigger = T.Trigger;

export const TooltipContent = forwardRef<ElementRef<typeof T.Content>, ComponentPropsWithoutRef<typeof T.Content>>(({ className, sideOffset = 4, ...p }, ref) => (
  <T.Portal>
    <T.Content ref={ref} sideOffset={sideOffset} className={cn('ui z-[70] max-w-[16rem] rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground', className)} {...p} />
  </T.Portal>
));

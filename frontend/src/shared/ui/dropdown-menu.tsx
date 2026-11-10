import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as D from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/cn';

export const DropdownMenu = D.Root;
export const DropdownMenuTrigger = D.Trigger;

export const DropdownMenuContent = forwardRef<ElementRef<typeof D.Content>, ComponentPropsWithoutRef<typeof D.Content>>(({ className, sideOffset = 4, ...p }, ref) => (
  <D.Portal>
    {/* Portals render outside the `.ui` wrapper, so the border reset is repeated here */}
    <D.Content ref={ref} sideOffset={sideOffset} className={cn('ui z-50 min-w-[10rem] rounded-md border bg-background p-1 shadow-md', className)} {...p} />
  </D.Portal>
));

export const DropdownMenuItem = forwardRef<ElementRef<typeof D.Item>, ComponentPropsWithoutRef<typeof D.Item>>(({ className, ...p }, ref) => (
  <D.Item ref={ref} className={cn('flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-secondary data-[disabled]:opacity-50', className)} {...p} />
));

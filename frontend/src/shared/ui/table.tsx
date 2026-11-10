import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export const Table = ({ className, ...p }: HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto"><table className={cn('w-full border-collapse text-sm', className)} {...p} /></div>
);
export const TableHeader = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const TableBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export const TableRow = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b', className)} {...p} />;
export const TableHead = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('h-10 whitespace-nowrap border-b px-3 text-left align-middle font-medium text-muted-foreground', className)} {...p} />
);
export const TableCell = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('px-3 py-2 align-top', className)} {...p} />;

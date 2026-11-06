import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Div = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...p }: Div) => <div className={cn('rounded-lg border bg-background shadow-sm', className)} {...p} />;
export const CardHeader = ({ className, ...p }: Div) => <div className={cn('p-6 pb-3', className)} {...p} />;
export const CardTitle = ({ className, ...p }: Div) => <h2 className={cn('text-xl font-semibold', className)} {...p} />;
export const CardContent = ({ className, ...p }: Div) => <div className={cn('p-6 pt-3', className)} {...p} />;

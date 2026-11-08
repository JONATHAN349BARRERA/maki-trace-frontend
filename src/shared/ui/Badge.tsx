import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

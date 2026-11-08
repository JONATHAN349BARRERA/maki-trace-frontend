import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const tones = {
  info: 'bg-blue-50 text-blue-900 ring-blue-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  danger: 'bg-red-50 text-red-900 ring-red-200',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
};

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-lg p-3 text-sm ring-1', tones[tone])}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-1')}>{children}</div>}
    </div>
  );
}

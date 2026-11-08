import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/shared/lib/cn';

const control =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100';

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
}

function Wrapper({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  FieldProps & InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-error` : undefined}
        className={control}
        {...rest}
      />
    </Wrapper>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  FieldProps &
    SelectHTMLAttributes<HTMLSelectElement> & {
      options: { value: string; label: string }[];
      placeholder?: string;
    }
>(function Select({ label, error, hint, className, id, options, placeholder, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} error={error} hint={hint} className={className}>
      <select ref={ref} id={fid} aria-invalid={!!error} className={control} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} error={error} hint={hint} className={className}>
      <textarea
        ref={ref}
        id={fid}
        rows={3}
        aria-invalid={!!error}
        className={cn(control, 'resize-y')}
        {...rest}
      />
    </Wrapper>
  );
});

export function Checkbox({
  label,
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600"
        {...rest}
      />
      {label}
    </label>
  );
}

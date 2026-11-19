import { cn } from '@/lib/utils';

export function Progress({ value, className, indicatorClassName }: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width] duration-500 ease-out', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

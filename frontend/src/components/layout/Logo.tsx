import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!compact && <span className="text-lg font-bold tracking-tight">YouDemy</span>}
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Library,
  Settings,
  X,
} from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/playlists', label: 'My Playlists', icon: Library, end: false },
  { to: '/recently-watched', label: 'Recently Watched', icon: Clock3, end: false },
  { to: '/completed', label: 'Completed', icon: CheckCircle2, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <NavLink to="/" onClick={onClose}><Logo /></NavLink>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Keep learning</p>
              <p className="truncate text-xs text-muted-foreground">One video at a time.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

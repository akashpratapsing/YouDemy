import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Plus, Search, Settings, Sun, UserRound } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/theme/ThemeProvider';
import { initials } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/playlists': 'My Playlists',
  '/recently-watched': 'Recently Watched',
  '/completed': 'Completed',
  '/settings': 'Settings',
};

function titleFor(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/playlists/')) return 'Learning Playlist';
  return 'YouDemy';
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/playlists?search=${encodeURIComponent(query)}` : '/playlists');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold sm:text-lg">{titleFor(location.pathname)}</h1>
      </div>

      <form onSubmit={handleSearch} className="ml-auto hidden w-full max-w-xs md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search playlists..."
            aria-label="Search playlists"
            className="h-9 bg-muted/50 pl-9"
          />
        </div>
      </form>

      <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/playlists?import=true')}>
        <Plus className="h-4 w-4" />
        Import
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <p className="px-2 py-3 text-xs text-muted-foreground">You're all caught up.</p>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
            <Avatar>
              <AvatarFallback>{user ? initials(user.email) : 'YD'}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="normal-case text-foreground">
            <span className="block truncate text-sm font-medium">{user?.email ?? 'Account'}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <UserRound className="h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings className="h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onSelect={logout}>
            <LogOut className="h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

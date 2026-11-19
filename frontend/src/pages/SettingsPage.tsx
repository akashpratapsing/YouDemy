import { KeyRound, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDateTime, initials } from '@/lib/utils';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and appearance preferences.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your YouDemy account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12"><AvatarFallback className="text-sm">{user ? initials(user.email) : 'YD'}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Member since {formatDateTime(user?.createdAt)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Account ID</p>
              <p className="mt-1 truncate font-mono text-xs">{user?.id}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Authentication</p>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium"><ShieldCheck className="h-4 w-4 text-emerald-600" /> JWT secured</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose the theme that feels right for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${theme === 'light' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}
            >
              <Sun className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Light</p>
                <p className="text-xs text-muted-foreground">Clean and bright</p>
              </div>
              {theme === 'light' && <Badge className="ml-auto">Active</Badge>}
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${theme === 'dark' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}
            >
              <Moon className="h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium">Dark</p>
                <p className="text-xs text-muted-foreground">Easy on the eyes</p>
              </div>
              {theme === 'dark' && <Badge className="ml-auto">Active</Badge>}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Password changes are managed by your authentication provider.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <KeyRound className="h-4 w-4" /> Change password (coming soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

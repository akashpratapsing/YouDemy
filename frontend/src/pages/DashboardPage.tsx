import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FolderOpen,
  Import,
  PlayCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { ImportPlaylistDialog } from '@/components/playlists/ImportPlaylistDialog';
import { PlaylistCard, PlaylistCardSkeleton } from '@/components/playlists/PlaylistCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useApi';
import { formatRelative } from '@/lib/utils';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();
  const [importOpen, setImportOpen] = useState(false);

  const stats = data?.stats;
  const cards = [
    { label: 'Playlists', value: stats?.totalPlaylists ?? 0, icon: FolderOpen, hint: 'in your library', tone: 'text-primary' },
    { label: 'Videos tracked', value: stats?.totalVideos ?? 0, icon: PlayCircle, hint: 'ready to learn', tone: 'text-sky-600' },
    { label: 'Completed', value: stats?.completedVideos ?? 0, icon: CheckCircle2, hint: 'videos finished', tone: 'text-emerald-600' },
    { label: 'Overall progress', value: `${stats?.overallProgress ?? 0}%`, icon: TrendingUp, hint: 'across all playlists', tone: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Your learning space
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {user?.email.split('@')[0] || 'learner'}.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats && stats.remainingVideos > 0
              ? `You have ${stats.remainingVideos} video${stats.remainingVideos === 1 ? '' : 's'} left. Pick up where you stopped.`
              : 'Your learning library is ready. Import a playlist to get started.'}
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)}><Import className="h-4 w-4" /> Import playlist</Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? [0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-28 rounded-xl" />)
          : cards.map((card) => (
              <Card key={card.label} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{card.value}</p>
                    </div>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${card.tone}`}>
                      <card.icon className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Continue learning</CardTitle>
              <p className="text-sm text-muted-foreground">Jump back into your last watched videos.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/playlists">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && [0, 1, 2].map((key) => <Skeleton key={key} className="h-20 rounded-lg" />)}
            {!isLoading && data?.continueLearning.length === 0 && (
              <EmptyState
                icon={<PlayCircle className="h-5 w-5" />}
                title="Nothing in progress yet"
                description="Import a playlist and start watching a video to see it here."
                action={<Button size="sm" onClick={() => setImportOpen(true)}>Import a playlist</Button>}
              />
            )}
            {!isLoading && data?.continueLearning.map((item) => (
              <Link
                key={`${item.playlistId}-${item.videoId}`}
                to={`/playlists/${item.playlistId}?video=${item.videoId}`}
                className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/60"
              >
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.videoThumbnailUrl && (
                    <img src={item.videoThumbnailUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.videoTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.playlistTitle}</p>
                  <Progress value={item.progress} className="mt-2 h-1" />
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium text-primary">{item.progress}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.completedVideos}/{item.totalVideos}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Continue learning">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-muted-foreground">Videos you've completed lately.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && [0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-12 rounded-lg" />)}
            {!isLoading && data?.recentActivity.length === 0 && (
              <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                No completed videos yet. Your achievements will show up here.
              </p>
            )}
            {!isLoading && data?.recentActivity.map((activity) => (
              <Link key={activity.videoId} to={`/playlists/${activity.playlistId}?video=${activity.videoId}`} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <BookOpenCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{activity.videoTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{activity.playlistTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Completed {formatRelative(activity.completedAt).toLowerCase()}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Recently accessed</h3>
            <p className="text-sm text-muted-foreground">Your most recent playlists.</p>
          </div>
          <Link to="/playlists" className="text-xs font-medium text-primary hover:underline">See library</Link>
        </div>
        {isError ? (
          <EmptyState title="Couldn't load your dashboard" description="Please try again." action={<Button onClick={() => void refetch()}>Retry</Button>} />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => <PlaylistCardSkeleton key={key} />)}
          </div>
        ) : data?.recentPlaylists.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.recentPlaylists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}
          </div>
        ) : (
          <EmptyState
            icon={<Clock3 className="h-5 w-5" />}
            title="No playlists yet"
            description="Import your first YouTube playlist and start tracking progress in seconds."
            action={<Button onClick={() => setImportOpen(true)}>Import your first playlist</Button>}
          />
        )}
      </section>

      <ImportPlaylistDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

import { Clock3, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlaylistCard, PlaylistCardSkeleton } from '@/components/playlists/PlaylistCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { useRecentlyWatched } from '@/hooks/useApi';
import { formatRelative } from '@/lib/utils';

export function RecentlyWatchedPage() {
  const { data: playlists = [], isLoading, isError, refetch } = useRecentlyWatched();

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Recently Watched</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get back to the playlists you were working on.</p>
      </section>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => <PlaylistCardSkeleton key={key} />)}
        </div>
      ) : isError ? (
        <EmptyState title="Couldn't load recently watched" action={<Button onClick={() => void refetch()}>Retry</Button>} />
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={<Clock3 className="h-5 w-5" />}
          title="Nothing here yet"
          description="Watch a video in any playlist and it will appear here."
          action={<Button asChild><Link to="/playlists">Browse playlists</Link></Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {playlists.slice(0, 6).map((playlist) => (
              <Link key={playlist.id} to={`/playlists/${playlist.id}?video=${playlist.lastWatchedVideoId ?? ''}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PlayCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{playlist.title}</p>
                      <p className="text-xs text-muted-foreground">Opened {formatRelative(playlist.lastAccessedAt).toLowerCase()}</p>
                    </div>
                    <div className="w-20">
                      <Progress value={playlist.completionPercentage} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

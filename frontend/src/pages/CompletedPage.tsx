import { Link } from 'react-router-dom';
import { CheckCircle2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompletedVideos } from '@/hooks/useApi';
import { formatRelative } from '@/lib/utils';

export function CompletedPage() {
  const { data: activities = [], isLoading, isError, refetch } = useCompletedVideos();

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Completed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {activities.length} video{activities.length === 1 ? '' : 's'} finished across your playlists.
        </p>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-20 rounded-xl" />)}
        </div>
      ) : isError ? (
        <EmptyState title="Couldn't load completed videos" action={<Button onClick={() => void refetch()}>Retry</Button>} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="No completions yet"
          description="Mark a video as complete and it will show up here."
          action={<Button asChild><Link to="/playlists"><Library className="h-4 w-4" /> Go to playlists</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link key={activity.videoId} to={`/playlists/${activity.playlistId}?video=${activity.videoId}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                    {activity.thumbnailUrl && <img src={activity.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.videoTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">{activity.playlistTitle}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 text-xs text-emerald-600 sm:flex">
                    <CheckCircle2 className="h-4 w-4" /> Completed {formatRelative(activity.completedAt).toLowerCase()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

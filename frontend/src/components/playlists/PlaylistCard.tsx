import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MoreVertical, PlayCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { formatRelative } from '@/lib/utils';
import type { PlaylistSummary } from '@/types/api';

export function PlaylistCard({ playlist, onRemove, onResync }: {
  playlist: PlaylistSummary;
  onRemove?: (playlist: PlaylistSummary) => void;
  onResync?: (playlist: PlaylistSummary) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <Link to={`/playlists/${playlist.id}`} className="block" aria-label={`Open ${playlist.title}`}>
          <div className="relative aspect-video overflow-hidden bg-muted">
            {playlist.thumbnailUrl ? (
              <img
                src={playlist.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <PlayCircle className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <span className="absolute bottom-2 right-2 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-medium text-white">
              {playlist.completedVideos}/{playlist.totalVideos} videos
            </span>
            {playlist.completed && (
              <span className="absolute left-2 top-2">
                <Badge variant="success" className="bg-white/90 text-emerald-700">Completed</Badge>
              </span>
            )}
          </div>
        </Link>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/playlists/${playlist.id}`} className="block truncate font-semibold hover:text-primary">
                {playlist.title}
              </Link>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {playlist.channelTitle || 'YouTube playlist'}
              </p>
            </div>
            {onRemove && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Playlist actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/playlists/${playlist.id}`}><PlayCircle className="h-4 w-4" /> Open playlist</Link>
                  </DropdownMenuItem>
                  {onResync && (
                    <DropdownMenuItem onSelect={() => onResync(playlist)}>
                      <RefreshCw className="h-4 w-4" /> Sync with YouTube
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive" onSelect={() => setConfirmOpen(true)}>
                    <Trash2 className="h-4 w-4" /> Remove from library
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{playlist.completionPercentage}%</span>
          </div>
          <Progress value={playlist.completionPercentage} className="mt-2 h-1.5" />

          <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Opened {formatRelative(playlist.lastAccessedAt).toLowerCase()}</span>
            <Link to={`/playlists/${playlist.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this playlist?</DialogTitle>
            <DialogDescription>
              “{playlist.title}” will be removed from your library. Your progress and notes are kept if you import it again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmOpen(false); onRemove?.(playlist); }}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video animate-pulse bg-muted" />
      <CardContent className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function CompletedBadge() {
  return <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ListVideo,
  PlayCircle,
  RotateCcw,
  Search,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import { NotesEditor } from '@/components/notes/NotesEditor';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/video/YouTubePlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlaylist, useProgress, useSetCompletion, useUpdateLastWatched, useVideos } from '@/hooks/useApi';
import { cn, formatDuration } from '@/lib/utils';
import type { Video } from '@/types/api';

type VideoFilter = 'all' | 'completed' | 'incomplete';

export function LearningPage() {
  const { playlistId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: playlist, isLoading: playlistLoading, isError: playlistError } = usePlaylist(playlistId);
  const { data: videoPage, isLoading: videosLoading } = useVideos(playlistId, 0, 200);
  const { data: progress } = useProgress(playlistId);
  const videos = videoPage?.content ?? [];
  const playerRef = useRef<YouTubePlayerHandle>(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VideoFilter>('all');

  const requestedVideoId = searchParams.get('video');
  const currentVideo = useMemo(() => {
    if (!videos.length) return undefined;
    if (requestedVideoId) {
      const found = videos.find((video) => video.id === requestedVideoId);
      if (found) return found;
    }
    const resume = videos.find((video) => video.id === playlist?.lastWatchedVideoId);
    return resume ?? videos.find((video) => !video.completed) ?? videos[0];
  }, [videos, requestedVideoId, playlist?.lastWatchedVideoId]);

  const currentIndex = currentVideo ? videos.findIndex((video) => video.id === currentVideo.id) : -1;
  const previousVideo = currentIndex > 0 ? videos[currentIndex - 1] : undefined;
  const nextVideo = currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : undefined;

  const setCompletion = useSetCompletion();
  const updateLastWatched = useUpdateLastWatched();

  useEffect(() => {
    if (!currentVideo || currentVideo.id === requestedVideoId) return;
    const next = new URLSearchParams(searchParams);
    next.set('video', currentVideo.id);
    setSearchParams(next, { replace: true });
  }, [currentVideo, requestedVideoId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!currentVideo || !playlistId) return;
    updateLastWatched.mutate({ playlistId, videoId: currentVideo.id });
    // Only run when the selected video changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo?.id, playlistId]);

  const selectVideo = (video: Video) => {
    const next = new URLSearchParams(searchParams);
    next.set('video', video.id);
    setSearchParams(next);
  };

  const toggleCompletion = (video: Video) => {
    const completed = !video.completed;
    setCompletion.mutate(
      { videoId: video.id, playlistId, completed },
      {
        onSuccess: () => toast.success(completed ? 'Video completed' : 'Marked as incomplete', {
          description: video.title,
        }),
        onError: () => toast.error('Could not update progress. Please try again.'),
      },
    );
  };

  const handleEnded = () => {
    if (!currentVideo) return;
    if (!currentVideo.completed) {
      setCompletion.mutate(
        { videoId: currentVideo.id, playlistId, completed: true },
        { onSuccess: () => toast.success('Video completed') },
      );
    }
    if (nextVideo) selectVideo(nextVideo);
  };

  const filteredVideos = videos.filter((video) => {
    const term = query.trim().toLowerCase();
    const matchesTerm = !term || video.title.toLowerCase().includes(term);
    const matchesFilter = filter === 'all'
      || (filter === 'completed' && video.completed)
      || (filter === 'incomplete' && !video.completed);
    return matchesTerm && matchesFilter;
  });

  if (playlistLoading || videosLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-24" /></div>
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Skeleton className="h-[70vh] rounded-xl" />
          <div className="space-y-4"><Skeleton className="aspect-video rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (playlistError || !playlist) {
    return (
      <EmptyState
        icon={<ListVideo className="h-5 w-5" />}
        title="Playlist not found"
        description="It may have been removed from your library."
        action={<Button asChild><Link to="/playlists">Back to playlists</Link></Button>}
      />
    );
  }

  const stats = progress ?? {
    totalVideos: playlist.totalVideos,
    completedVideos: playlist.completedVideos,
    remainingVideos: playlist.totalVideos - playlist.completedVideos,
    completionPercentage: playlist.completionPercentage,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/playlists"><ArrowLeft className="h-4 w-4" /> Playlists</Link>
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{playlist.title}</h2>
        <Badge variant="outline">{stats.completedVideos}/{stats.totalVideos} complete</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <Card className="flex max-h-[calc(100vh-11rem)] flex-col overflow-hidden">
          <div className="border-b p-4">
            <div className="flex gap-3">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {playlist.thumbnailUrl && <img src={playlist.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">{playlist.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{playlist.channelTitle || 'YouTube playlist'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{playlist.totalVideos} videos</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Your progress</span>
              <span className="font-semibold text-primary">{stats.completionPercentage}%</span>
            </div>
            <Progress value={stats.completionPercentage} className="mt-2 h-1.5" />

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search videos..."
                aria-label="Search videos"
                className="h-9 pl-8 text-xs"
              />
            </div>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as VideoFilter)} className="mt-3">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="incomplete" className="flex-1">To watch</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2" data-testid="video-list">
            {filteredVideos.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">No videos match this filter.</p>
            )}
            {filteredVideos.map((video, index) => {
              const active = video.id === currentVideo?.id;
              return (
                <div
                  key={video.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectVideo(video)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') selectVideo(video); }}
                  data-testid={`video-item-${index}`}
                  className={cn(
                    'group flex cursor-pointer gap-3 rounded-lg border p-2.5 transition-colors',
                    active ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-accent/60',
                  )}
                >
                  <button
                    type="button"
                    aria-label={video.completed ? `Mark ${video.title} as incomplete` : `Mark ${video.title} as completed`}
                    onClick={(event) => { event.stopPropagation(); toggleCompletion(video); }}
                    className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  >
                    {video.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 group-hover:text-primary" />
                    )}
                  </button>
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-muted">
                    {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-slate-950/80 px-1 text-[9px] text-white">
                      {formatDuration(video.durationSeconds)}
                    </span>
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                        <PlayCircle className="h-5 w-5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('line-clamp-2 text-xs font-medium', active && 'text-primary')}>
                      <span className="mr-1 text-muted-foreground">{video.position + 1}.</span>
                      {video.title}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {video.completed ? 'Completed' : `Video ${video.position + 1}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden">
            {currentVideo ? (
              <>
                <div className="p-3 sm:p-4">
                  <YouTubePlayer
                    key={currentVideo.youtubeVideoId}
                    ref={playerRef}
                    videoId={currentVideo.youtubeVideoId}
                    onEnded={handleEnded}
                  />
                </div>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Video {currentVideo.position + 1} of {videos.length}</Badge>
                        {currentVideo.completed && <Badge variant="success"><Check className="mr-1 h-3 w-3" /> Completed</Badge>}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold leading-snug">{currentVideo.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDuration(currentVideo.durationSeconds)} · {playlist.channelTitle || 'YouTube'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!previousVideo}
                        aria-label="Previous video"
                        onClick={() => previousVideo && selectVideo(previousVideo)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!nextVideo}
                        aria-label="Next video"
                        onClick={() => nextVideo && selectVideo(nextVideo)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={currentVideo.completed ? 'outline' : 'default'}
                        onClick={() => toggleCompletion(currentVideo)}
                      >
                        {currentVideo.completed ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        <span className="hidden sm:inline">{currentVideo.completed ? 'Mark incomplete' : 'Mark complete'}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">My notes</h4>
                        <p className="text-xs text-muted-foreground">Only you can see these notes. They save automatically.</p>
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${currentVideo.youtubeVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden items-center gap-1.5 text-xs font-medium text-primary hover:underline sm:flex"
                      >
                        <Youtube className="h-3.5 w-3.5" /> Open on YouTube
                      </a>
                    </div>
                    <NotesEditor key={currentVideo.id} videoId={currentVideo.id} />
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="py-16">
                <EmptyState
                  icon={<ListVideo className="h-5 w-5" />}
                  title="This playlist has no videos"
                  description="Try syncing with YouTube in case videos were added recently."
                  action={<Button asChild variant="outline"><Link to="/playlists"><ArrowRight className="h-4 w-4" /> Back to library</Link></Button>}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

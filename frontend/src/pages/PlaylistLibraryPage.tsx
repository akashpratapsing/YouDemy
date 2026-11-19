import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Import, Library, Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImportPlaylistDialog } from '@/components/playlists/ImportPlaylistDialog';
import { PlaylistCard, PlaylistCardSkeleton } from '@/components/playlists/PlaylistCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlaylists, useRemovePlaylist, useResyncPlaylist } from '@/hooks/useApi';
import { getErrorMessage } from '@/lib/api';
import type { PlaylistSummary } from '@/types/api';

type FilterValue = 'all' | 'in-progress' | 'completed';
type SortValue = 'recent' | 'progress' | 'added' | 'title';

export function PlaylistLibraryPage() {
  const { data: playlists = [], isLoading, isError, refetch } = usePlaylists();
  const removeMutation = useRemovePlaylist();
  const resyncMutation = useResyncPlaylist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [sort, setSort] = useState<SortValue>('recent');
  const [importOpen, setImportOpen] = useState(searchParams.get('import') === 'true');

  useEffect(() => {
    const search = searchParams.get('search');
    if (search !== null) setQuery(search);
    if (searchParams.get('import') === 'true') {
      setImportOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('import');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = playlists.filter((playlist) => {
      const matchesTerm = !term
        || playlist.title.toLowerCase().includes(term)
        || (playlist.channelTitle ?? '').toLowerCase().includes(term);
      const matchesFilter = filter === 'all'
        || (filter === 'completed' && playlist.completed)
        || (filter === 'in-progress' && playlist.inProgress);
      return matchesTerm && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'progress') return b.completionPercentage - a.completionPercentage;
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'added') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const aTime = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const bTime = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [playlists, query, filter, sort]);

  const handleRemove = async (playlist: PlaylistSummary) => {
    try {
      await removeMutation.mutateAsync(playlist.id);
      toast.success('Playlist removed from your library.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResync = async (playlist: PlaylistSummary) => {
    try {
      await resyncMutation.mutateAsync(playlist.id);
      toast.success('Playlist synchronized with YouTube.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const counts = {
    all: playlists.length,
    inProgress: playlists.filter((playlist) => playlist.inProgress).length,
    completed: playlists.filter((playlist) => playlist.completed).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Playlists</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {playlists.length} playlist{playlists.length === 1 ? '' : 's'} in your learning library.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)}><Import className="h-4 w-4" /> Import playlist</Button>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by playlist or channel..."
            aria-label="Search playlists"
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
          <TabsList>
            <TabsTrigger value="all">All <span className="ml-1 text-muted-foreground">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="in-progress">In progress <span className="ml-1 text-muted-foreground">{counts.inProgress}</span></TabsTrigger>
            <TabsTrigger value="completed">Completed <span className="ml-1 text-muted-foreground">{counts.completed}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select
            aria-label="Sort playlists"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortValue)}
            options={[
              { value: 'recent', label: 'Recently accessed' },
              { value: 'added', label: 'Recently added' },
              { value: 'progress', label: 'Highest progress' },
              { value: 'title', label: 'Title A–Z' },
            ]}
          />
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((key) => <PlaylistCardSkeleton key={key} />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Library className="h-5 w-5" />}
          title="Couldn't load your playlists"
          description="Check your connection and try again."
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={query || filter !== 'all' ? <Filter className="h-5 w-5" /> : <Library className="h-5 w-5" />}
          title={query || filter !== 'all' ? 'No playlists match your filters' : 'Your library is empty'}
          description={query || filter !== 'all'
            ? 'Try a different search term or filter.'
            : 'Import a YouTube playlist to start tracking your learning.'}
          action={query || filter !== 'all'
            ? <Button variant="outline" onClick={() => { setQuery(''); setFilter('all'); }}><X className="h-4 w-4" /> Clear filters</Button>
            : <Button onClick={() => setImportOpen(true)}><Import className="h-4 w-4" /> Import playlist</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onRemove={handleRemove}
              onResync={handleResync}
            />
          ))}
        </div>
      )}

      <ImportPlaylistDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

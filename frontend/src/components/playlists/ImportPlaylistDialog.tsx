import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Loader2, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImportPlaylist } from '@/hooks/useApi';
import { getErrorMessage, getFieldErrors } from '@/lib/api';
import { looksLikePlaylistUrl } from '@/lib/utils';

export function ImportPlaylistDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const importMutation = useImportPlaylist();

  useEffect(() => {
    if (open) {
      setUrl('');
      setLocalError('');
      importMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError('');
    const value = url.trim();
    if (!looksLikePlaylistUrl(value)) {
      setLocalError('Enter a valid YouTube playlist URL containing a list= parameter.');
      return;
    }
    try {
      const response = await importMutation.mutateAsync(value);
      toast.success(response.alreadyImported ? 'Already in your library' : 'Playlist imported', {
        description: response.alreadyImported
          ? 'Opening your saved playlist.'
          : `${response.playlist.totalVideos} videos are ready to study.`,
      });
      onOpenChange(false);
      navigate(`/playlists/${response.playlist.id}`);
    } catch (error) {
      const fields = getFieldErrors(error);
      setLocalError(fields.url ?? getErrorMessage(error, 'Import failed.'));
    }
  };

  const busy = importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <Youtube className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle>Import a YouTube playlist</DialogTitle>
          <DialogDescription>
            Paste a playlist URL. We fetch the metadata and videos once, then keep them in your library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url">Playlist URL</Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="playlist-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PLxxxxxxxx"
                disabled={busy}
                className="h-11 pl-9"
                aria-invalid={Boolean(localError)}
              />
            </div>
            {localError && <p role="alert" className="text-xs text-destructive">{localError}</p>}
          </div>

          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            Supported: <code className="font-mono">youtube.com/playlist?list=…</code>, watch URLs with <code className="font-mono">&amp;list=…</code>, and youtu.be links with a playlist ID.
          </div>

          {importMutation.isPending && (
            <div role="status" className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching playlist and videos from YouTube…
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !url.trim()}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Import playlist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

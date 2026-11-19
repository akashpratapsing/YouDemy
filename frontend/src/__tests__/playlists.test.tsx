import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ImportPlaylistDialog } from '@/components/playlists/ImportPlaylistDialog';
import { PlaylistLibraryPage } from '@/pages/PlaylistLibraryPage';
import { api } from '@/lib/api';
import type { PlaylistSummary } from '@/types/api';
import { envelope, renderRoute } from '@/test/utils';

function playlist(overrides: Partial<PlaylistSummary> & Pick<PlaylistSummary, 'id' | 'title'>): PlaylistSummary {
  return {
    userPlaylistId: `up-${overrides.id}`,
    youtubePlaylistId: `yt-${overrides.id}`,
    description: null,
    thumbnailUrl: null,
    channelTitle: 'Code Academy',
    totalVideos: 10,
    completedVideos: 4,
    completionPercentage: 40,
    lastAccessedAt: '2026-11-01T10:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
    lastWatchedVideoId: null,
    completed: false,
    inProgress: true,
    ...overrides,
  };
}

const playlists: PlaylistSummary[] = [
  playlist({ id: 'react', title: 'React Deep Dive', completionPercentage: 40 }),
  playlist({
    id: 'java',
    title: 'Java Masterclass',
    completedVideos: 10,
    completionPercentage: 100,
    completed: true,
    inProgress: false,
    lastAccessedAt: '2026-11-10T10:00:00.000Z',
  }),
  playlist({ id: 'ts', title: 'TypeScript Basics', lastAccessedAt: '2026-10-20T10:00:00.000Z' }),
];

describe('playlist library', () => {
  it('renders playlists and supports search and status filters', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: envelope(playlists) } as never);
    renderRoute(<PlaylistLibraryPage />, { route: '/playlists', path: '/playlists' });
    const userEventSetup = userEvent.setup();

    expect(await screen.findByText('React Deep Dive')).toBeInTheDocument();
    expect(screen.getByText('Java Masterclass')).toBeInTheDocument();
    expect(screen.getByText('TypeScript Basics')).toBeInTheDocument();

    await userEventSetup.type(screen.getByLabelText(/search playlists/i), 'java');
    expect(screen.getByText('Java Masterclass')).toBeInTheDocument();
    expect(screen.queryByText('React Deep Dive')).not.toBeInTheDocument();
    expect(screen.queryByText('TypeScript Basics')).not.toBeInTheDocument();

    await userEventSetup.clear(screen.getByLabelText(/search playlists/i));
    await userEventSetup.click(screen.getByRole('tab', { name: /completed/i }));
    expect(screen.getByText('Java Masterclass')).toBeInTheDocument();
    expect(screen.queryByText('React Deep Dive')).not.toBeInTheDocument();
  });

  it('shows a loading skeleton while playlists are being fetched', async () => {
    let resolveRequest!: (value: unknown) => void;
    vi.spyOn(api, 'get').mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }) as never);

    const { container } = renderRoute(<PlaylistLibraryPage />, { route: '/playlists', path: '/playlists' });

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('React Deep Dive')).not.toBeInTheDocument();

    resolveRequest({ data: envelope(playlists) });
    expect(await screen.findByText('React Deep Dive')).toBeInTheDocument();
  });

  it('shows an error state and can retry', async () => {
    const get = vi.spyOn(api, 'get')
      .mockRejectedValueOnce(new AxiosError('Network Error'))
      .mockResolvedValueOnce({ data: envelope(playlists) } as never);

    renderRoute(<PlaylistLibraryPage />, { route: '/playlists', path: '/playlists' });
    const userEventSetup = userEvent.setup();

    expect(await screen.findByText("Couldn't load your playlists")).toBeInTheDocument();
    await userEventSetup.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('React Deep Dive')).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('validates an import URL, imports, and opens the new playlist', async () => {
    const imported = playlist({ id: 'new-playlist', title: 'Imported Course' });
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: envelope({ playlist: imported, alreadyImported: false }),
    } as never);
    const onOpenChange = vi.fn();

    renderRoute(
      <ImportPlaylistDialog open onOpenChange={onOpenChange} />,
      {
        route: '/playlists',
        path: '/playlists',
        routes: [{ path: '/playlists/:playlistId', element: <div>Opened imported playlist</div> }],
      },
    );
    const userEventSetup = userEvent.setup();
    const input = await screen.findByLabelText(/playlist url/i);

    await userEventSetup.type(input, 'https://example.com/not-youtube');
    await userEventSetup.click(screen.getByRole('button', { name: /^import playlist$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid youtube playlist url/i);
    expect(post).not.toHaveBeenCalled();

    await userEventSetup.clear(input);
    const url = 'https://www.youtube.com/playlist?list=PL1234567890abcdef';
    await userEventSetup.type(input, url);
    await userEventSetup.click(screen.getByRole('button', { name: /^import playlist$/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/playlists/import', { url });
    });
    expect(await screen.findByText('Opened imported playlist')).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

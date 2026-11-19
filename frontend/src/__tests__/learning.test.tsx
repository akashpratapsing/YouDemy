import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LearningPage } from '@/pages/LearningPage';
import { api } from '@/lib/api';
import type { PagedResponse, PlaylistSummary, Progress, Video } from '@/types/api';
import { envelope, renderRoute } from '@/test/utils';

vi.mock('@/components/video/YouTubePlayer', async () => {
  const React = await import('react');
  return {
    YouTubePlayer: React.forwardRef<unknown, { onEnded?: () => void }>(({ onEnded }, _ref) => (
      <div data-testid="mock-player">
        <button type="button" onClick={onEnded}>Finish video</button>
      </div>
    )),
  };
});

vi.mock('@/components/notes/NotesEditor', () => ({
  NotesEditor: ({ videoId }: { videoId: string }) => (
    <div data-testid="mock-notes">Notes for {videoId}</div>
  ),
}));

const PLAYLIST_ID = 'playlist-1';

const playlist: PlaylistSummary = {
  userPlaylistId: 'up-1',
  id: PLAYLIST_ID,
  youtubePlaylistId: 'PL1234567890',
  title: 'Learn Spring Boot',
  description: null,
  thumbnailUrl: null,
  channelTitle: 'Code Academy',
  totalVideos: 3,
  completedVideos: 1,
  completionPercentage: 33,
  lastAccessedAt: '2026-11-01T10:00:00.000Z',
  createdAt: '2026-10-01T10:00:00.000Z',
  lastWatchedVideoId: 'v2',
  completed: false,
  inProgress: true,
};

const videoList: Video[] = [
  {
    id: 'v1', youtubeVideoId: 'yt-v1', title: 'Introduction', description: null,
    thumbnailUrl: null, duration: 'PT5M', durationSeconds: 300, position: 0, completed: true,
  },
  {
    id: 'v2', youtubeVideoId: 'yt-v2', title: 'Dependency Injection', description: null,
    thumbnailUrl: null, duration: 'PT12M', durationSeconds: 720, position: 1, completed: false,
  },
  {
    id: 'v3', youtubeVideoId: 'yt-v3', title: 'Spring Data JPA', description: null,
    thumbnailUrl: null, duration: 'PT18M', durationSeconds: 1080, position: 2, completed: false,
  },
];

const progress: Progress = {
  totalVideos: 3,
  completedVideos: 1,
  remainingVideos: 2,
  completionPercentage: 33,
};

function mockLearningApi() {
  const page: PagedResponse<Video> = {
    content: videoList,
    page: 0,
    size: 200,
    totalElements: 3,
    totalPages: 1,
  };
  vi.spyOn(api, 'get').mockImplementation((url: string) => {
    if (url === `/playlists/${PLAYLIST_ID}`) {
      return Promise.resolve({ data: envelope(playlist) } as never);
    }
    if (url.startsWith(`/playlists/${PLAYLIST_ID}/videos`)) {
      return Promise.resolve({ data: envelope(page) } as never);
    }
    if (url === `/playlists/${PLAYLIST_ID}/progress`) {
      return Promise.resolve({ data: envelope(progress) } as never);
    }
    return Promise.resolve({ data: envelope(null) } as never);
  });
  vi.spyOn(api, 'put').mockResolvedValue({ data: envelope(null) } as never);
  return vi.spyOn(api, 'post').mockResolvedValue({ data: envelope(null) } as never);
}

function renderLearningPage() {
  return renderRoute(<LearningPage />, {
    route: `/playlists/${PLAYLIST_ID}`,
    path: '/playlists/:playlistId',
  });
}

describe('learning page', () => {
  it('resumes the last watched video and navigates between videos', async () => {
    mockLearningApi();
    renderLearningPage();
    const userEventSetup = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent('Dependency Injection');
    expect(screen.getByText('Video 2 of 3')).toBeInTheDocument();
    expect(screen.getByTestId('mock-notes')).toHaveTextContent('Notes for v2');

    await userEventSetup.click(screen.getByRole('button', { name: /next video/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Spring Data JPA');
    });
    expect(screen.getByText('Video 3 of 3')).toBeInTheDocument();
  });

  it('marks the active video complete with an optimistic update', async () => {
    const post = mockLearningApi();
    renderLearningPage();
    const userEventSetup = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent('Dependency Injection');
    await userEventSetup.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/videos/v2/complete');
    });
    expect(await screen.findByText('Completed')).toBeInTheDocument();
  });

  it('completes a video when playback ends and advances to the next one', async () => {
    const post = mockLearningApi();
    renderLearningPage();
    const userEventSetup = userEvent.setup();

    expect(await screen.findByTestId('mock-player')).toBeInTheDocument();
    await userEventSetup.click(screen.getByRole('button', { name: /finish video/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/videos/v2/complete');
    });
    expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent('Spring Data JPA');
  });

  it('supports filtering videos by search term and status', async () => {
    mockLearningApi();
    renderLearningPage();
    const userEventSetup = userEvent.setup();

    expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent('Dependency Injection');
    await userEventSetup.type(screen.getByLabelText(/search videos/i), 'data');
    expect(screen.getByText('Spring Data JPA')).toBeInTheDocument();
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });

  it('shows a loading state while the playlist loads', () => {
    vi.spyOn(api, 'get').mockReturnValue(new Promise(() => {}) as never);
    const { container } = renderLearningPage();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows a not-found state when the playlist cannot be loaded', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Not found'));
    renderLearningPage();
    expect(await screen.findByText('Playlist not found')).toBeInTheDocument();
  });
});

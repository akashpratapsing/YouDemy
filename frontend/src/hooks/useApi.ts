import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type {
  ApiEnvelope,
  ContinueLearning,
  Dashboard,
  ImportPlaylistResponse,
  LearningActivity,
  Note,
  PagedResponse,
  PlaylistSummary,
  Progress,
  Video,
} from '@/types/api';

export const queryKeys = {
  playlists: ['playlists'] as const,
  playlist: (id?: string) => ['playlist', id] as const,
  videos: (id: string, page: number, size: number) => ['videos', id, page, size] as const,
  progress: (id?: string) => ['progress', id] as const,
  note: (id?: string) => ['note', id] as const,
  dashboard: ['dashboard'] as const,
  recentlyWatched: ['recentlyWatched'] as const,
  completedVideos: ['completedVideos'] as const,
};

function useInvalidateLearningData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.recentlyWatched });
    void queryClient.invalidateQueries({ queryKey: queryKeys.completedVideos });
  };
}

export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: async () => unwrap(await api.get<ApiEnvelope<PlaylistSummary[]>>('/user/playlists')),
  });
}

export function usePlaylist(playlistId?: string) {
  return useQuery({
    queryKey: queryKeys.playlist(playlistId),
    enabled: Boolean(playlistId),
    queryFn: async () => unwrap(await api.get<ApiEnvelope<PlaylistSummary>>(`/playlists/${playlistId}`)),
  });
}

export function useVideos(playlistId: string, page = 0, size = 200) {
  return useQuery({
    queryKey: queryKeys.videos(playlistId, page, size),
    enabled: Boolean(playlistId),
    queryFn: async () =>
      unwrap(await api.get<ApiEnvelope<PagedResponse<Video>>>(`/playlists/${playlistId}/videos`, {
        params: { page, size },
      })),
  });
}

export function useProgress(playlistId?: string) {
  return useQuery({
    queryKey: queryKeys.progress(playlistId),
    enabled: Boolean(playlistId),
    queryFn: async () => unwrap(await api.get<ApiEnvelope<Progress>>(`/playlists/${playlistId}/progress`)),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => unwrap(await api.get<ApiEnvelope<Dashboard>>('/user/dashboard')),
  });
}

export function useRecentlyWatched() {
  return useQuery({
    queryKey: queryKeys.recentlyWatched,
    queryFn: async () =>
      unwrap(await api.get<ApiEnvelope<PlaylistSummary[]>>('/user/recently-watched')),
  });
}

export function useCompletedVideos() {
  return useQuery({
    queryKey: queryKeys.completedVideos,
    queryFn: async () =>
      unwrap(await api.get<ApiEnvelope<LearningActivity[]>>('/user/completed-videos')),
  });
}

export function useContinueLearning() {
  const dashboard = useDashboard();
  const data: ContinueLearning[] = dashboard.data?.continueLearning ?? [];
  return { ...dashboard, data };
}

export function useNote(videoId?: string) {
  return useQuery({
    queryKey: queryKeys.note(videoId),
    enabled: Boolean(videoId),
    queryFn: async () => unwrap(await api.get<ApiEnvelope<Note>>(`/videos/${videoId}/notes`)),
  });
}

export function useImportPlaylist() {
  const invalidate = useInvalidateLearningData();
  return useMutation({
    mutationFn: async (url: string) =>
      unwrap(await api.post<ApiEnvelope<ImportPlaylistResponse>>('/playlists/import', { url })),
    onSuccess: invalidate,
  });
}

export function useRemovePlaylist() {
  const invalidate = useInvalidateLearningData();
  return useMutation({
    mutationFn: async (playlistId: string) => {
      await api.delete(`/playlists/${playlistId}/remove`);
    },
    onSuccess: invalidate,
  });
}

export function useResyncPlaylist() {
  const invalidate = useInvalidateLearningData();
  return useMutation({
    mutationFn: async (playlistId: string) => {
      await api.post(`/playlists/${playlistId}/resync`);
    },
    onSuccess: invalidate,
  });
}

interface CompletionVariables {
  videoId: string;
  playlistId: string;
  completed: boolean;
}

export function useSetCompletion() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLearningData();
  return useMutation({
    mutationFn: async ({ videoId, completed }: CompletionVariables) => {
      const path = completed ? 'complete' : 'uncomplete';
      await api.post(`/videos/${videoId}/${path}`);
    },
    onMutate: async ({ videoId, playlistId, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.videos(playlistId, 0, 200) });
      const previous = queryClient.getQueryData<PagedResponse<Video>>(queryKeys.videos(playlistId, 0, 200));
      queryClient.setQueryData<PagedResponse<Video>>(queryKeys.videos(playlistId, 0, 200), (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((video) =>
            video.id === videoId ? { ...video, completed } : video),
        };
      });
      queryClient.setQueryData<Progress>(queryKeys.progress(playlistId), (old) => {
        if (!old) return old;
        const delta = completed ? 1 : -1;
        const completedVideos = Math.max(0, Math.min(old.totalVideos, old.completedVideos + delta));
        return {
          ...old,
          completedVideos,
          remainingVideos: old.totalVideos - completedVideos,
          completionPercentage: old.totalVideos === 0 ? 0 : Math.round((completedVideos / old.totalVideos) * 100),
        };
      });
      return { previous };
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(queryKeys.videos(variables.playlistId, 0, 200), context?.previous);
      invalidate();
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.videos(variables.playlistId, 0, 200) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress(variables.playlistId) });
      invalidate();
    },
  });
}

export function useUpdateLastWatched() {
  return useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      await api.put(`/playlists/${playlistId}/last-watched`, { videoId });
    },
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, content, version }: { videoId: string; content: string; version: number }) => {
      return unwrap(await api.put<ApiEnvelope<Note>>(`/videos/${videoId}/notes`, { content, version }));
    },
    onSuccess: (note, variables) => {
      queryClient.setQueryData(queryKeys.note(variables.videoId), note);
    },
  });
}

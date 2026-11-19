export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
}

export interface ApiErrorPayload {
  success: false;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  timestamp: string;
  path: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface PlaylistSummary {
  userPlaylistId: string;
  id: string;
  youtubePlaylistId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  totalVideos: number;
  completedVideos: number;
  completionPercentage: number;
  lastAccessedAt: string | null;
  createdAt: string;
  lastWatchedVideoId: string | null;
  completed: boolean;
  inProgress: boolean;
}

export interface ImportPlaylistResponse {
  playlist: PlaylistSummary;
  alreadyImported: boolean;
}

export interface Progress {
  totalVideos: number;
  completedVideos: number;
  remainingVideos: number;
  completionPercentage: number;
}

export interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  durationSeconds: number;
  position: number;
  completed: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Note {
  content: string;
  version: number;
  updatedAt: string | null;
}

export interface DashboardStats {
  totalPlaylists: number;
  totalVideos: number;
  completedVideos: number;
  remainingVideos: number;
  overallProgress: number;
}

export interface ContinueLearning {
  playlistId: string;
  playlistTitle: string;
  playlistThumbnailUrl: string | null;
  videoId: string;
  videoTitle: string;
  videoThumbnailUrl: string | null;
  completedVideos: number;
  totalVideos: number;
  progress: number;
}

export interface LearningActivity {
  videoId: string;
  videoTitle: string;
  playlistId: string;
  playlistTitle: string;
  thumbnailUrl: string | null;
  completedAt: string;
}

export interface Dashboard {
  stats: DashboardStats;
  recentPlaylists: PlaylistSummary[];
  continueLearning: ContinueLearning[];
  recentActivity: LearningActivity[];
}

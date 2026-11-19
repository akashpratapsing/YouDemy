import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNowStrict } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Not opened yet';
  try {
    return `${formatDistanceToNowStrict(new Date(iso))} ago`;
  } catch {
    return 'Unknown';
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return 'Unknown';
  }
}

export function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

/** Mirrors backend URL validation to give instant feedback before an API call. */
export function looksLikePlaylistUrl(value: string): boolean {
  const input = value.trim();
  if (!input) return false;
  if (/^[A-Za-z0-9_-]{10,128}$/.test(input) && !input.includes('://')) return true;
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const host = url.hostname.toLowerCase().replace(/^(www\.|m\.|music\.)/, '');
    const list = url.searchParams.get('list');
    if (!list || !/^[A-Za-z0-9_-]{10,128}$/.test(list)) return false;
    return host === 'youtube.com' || host === 'youtu.be';
  } catch {
    return false;
  }
}

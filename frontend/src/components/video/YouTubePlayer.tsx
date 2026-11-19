import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
}

interface YouTubePlayerProps {
  videoId: string;
  onEnded?: () => void;
  onReady?: () => void;
}

interface YTPlayer {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error('YouTube player API did not initialize.'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Could not load the YouTube player API.'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onEnded, onReady }, ref) => {
    const containerId = useId().replace(/:/g, '');
    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const onEndedRef = useRef(onEnded);
    const onReadyRef = useRef(onReady);
    onEndedRef.current = onEnded;
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
    }), []);

    useEffect(() => {
      let cancelled = false;
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled || !containerRef.current) return;
          playerRef.current = new YT.Player(containerRef.current, {
            videoId,
            playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
            events: {
              onReady: () => {
                if (cancelled) return;
                setStatus('ready');
                onReadyRef.current?.();
              },
              onStateChange: (event: { data: number }) => {
                if (event.data === YT.PlayerState.ENDED) onEndedRef.current?.();
              },
              onError: () => setStatus('error'),
            },
          });
        })
        .catch(() => {
          if (!cancelled) setStatus('error');
        });

      return () => {
        cancelled = true;
        try {
          playerRef.current?.destroy();
        } catch {
          // The IFrame API may already have removed the node during StrictMode remounts.
        }
        playerRef.current = null;
      };
      // Player is created once; video changes are handled by the effect below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (playerRef.current && status === 'ready') {
        playerRef.current.loadVideoById(videoId);
      }
    }, [videoId, status]);

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-950">
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Loading player…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950 px-6 text-center text-slate-200">
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <p className="text-sm font-medium">The video player could not be loaded.</p>
            <p className="text-xs text-slate-400">Check your connection or open the video on YouTube.</p>
          </div>
        )}
        <div ref={containerRef} id={containerId} className="h-full w-full" aria-label="YouTube video player" />
        {status === 'loading' && <Skeleton className="absolute inset-0 opacity-10" />}
      </div>
    );
  },
);
YouTubePlayer.displayName = 'YouTubePlayer';

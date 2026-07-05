import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, VideoOff, Settings } from 'lucide-react';

const HLSPlayer = ({ streamPath, hlsBaseUrl, isMuted = true, onStatusChange }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'playing' | 'error' | 'no-url'

  const updateStatus = (s) => {
    setStatus(s);
    onStatusChange?.(s);
  };

  useEffect(() => {
    // Empty hlsBaseUrl = relative path (vite proxy). Only block on null/false.
    if (hlsBaseUrl === null || hlsBaseUrl === false) {
      updateStatus('no-url');
      return;
    }

    if (!streamPath) {
      updateStatus('error');
      return;
    }

    const src = `${hlsBaseUrl.replace(/\/$/, '')}/${streamPath}/index.m3u8`;
    const video = videoRef.current;
    if (!video) return;

    updateStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: false,
        enableWorker: true,
        liveDurationInfinity: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) updateStatus('error');
      });

      video.onplaying = () => updateStatus('playing');

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
      video.onplaying = () => updateStatus('playing');
      video.onerror = () => updateStatus('error');
      video.play().catch(() => {});
      return () => {
        video.src = '';
      };
    } else {
      updateStatus('error');
    }
  }, [streamPath, hlsBaseUrl]);

  if (status === 'no-url') {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2 p-2">
        <Settings size={20} className="text-slate-500" />
        <p className="text-slate-500 text-xs text-center">Set HLS URL in Settings</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          status === 'playing' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 p-2 text-center">
          <VideoOff className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-xs text-slate-400">Stream unavailable</p>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;

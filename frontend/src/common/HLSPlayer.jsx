import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, VideoOff, Settings } from 'lucide-react';

const BBOX_CAMERAS = ['cam_06'];

const HLSPlayer = ({ streamPath, hlsBaseUrl, isMuted = true, onStatusChange }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'playing' | 'error' | 'no-url'
  
  // Track current playing path and whether we are trying bbox stream
  const [currentPath, setCurrentPath] = useState(streamPath);
  const [tryBbox, setTryBbox] = useState(BBOX_CAMERAS.includes(streamPath));

  const updateStatus = (s) => {
    setStatus(s);
    onStatusChange?.(s);
  };

  // Reset states when base streamPath changes
  useEffect(() => {
    const isBbox = BBOX_CAMERAS.includes(streamPath);
    setCurrentPath(isBbox ? `${streamPath}_bbox` : streamPath);
    setTryBbox(isBbox);
  }, [streamPath]);

  useEffect(() => {
    if (!hlsBaseUrl) {
      updateStatus('no-url');
      return;
    }

    if (!currentPath) {
      updateStatus('error');
      return;
    }

    const src = `${hlsBaseUrl.replace(/\/$/, '')}/${currentPath}/index.m3u8`;
    const video = videoRef.current;
    if (!video) return;

    updateStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveDurationInfinity: true,
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
        manifestLoadingTimeOut: 3000,
        manifestLoadingMaxRetry: 1,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (tryBbox) {
            console.warn(`[HLSPlayer] Failed to load bbox stream at ${currentPath}, falling back to raw ${streamPath}`);
            setTryBbox(false);
            setCurrentPath(streamPath);
          } else {
            updateStatus('error');
          }
        }
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
      video.onerror = () => {
        if (tryBbox) {
          console.warn(`[HLSPlayer Safari] Failed to load bbox stream at ${currentPath}, falling back to raw ${streamPath}`);
          setTryBbox(false);
          setCurrentPath(streamPath);
        } else {
          updateStatus('error');
        }
      };
      video.play().catch(() => {});
      return () => {
        video.src = '';
      };
    } else {
      updateStatus('error');
    }
  }, [currentPath, hlsBaseUrl]);

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

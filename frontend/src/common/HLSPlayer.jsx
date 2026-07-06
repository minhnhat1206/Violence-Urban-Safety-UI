import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, VideoOff, Settings } from 'lucide-react';

// Stream priority per camera:
//   Normal state  → <streamPath>       (raw camera stream - zero latency)
//   Violence ≥65% → <streamPath>_bbox  (bboxAPI — shows bounding boxes)
//   Fallback      → <streamPath>

const BBOX_CAMERAS   = ['cam_01', 'cam_02', 'cam_03', 'cam_04', 'cam_05'];

const HLSPlayer = ({ streamPath, hlsBaseUrl, isMuted = true, alertStatus, onStatusChange }) => {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'playing' | 'error' | 'no-url'

  const isViolent         = alertStatus === 'VIOLENCE_DETECTED';
  const hasBbox           = BBOX_CAMERAS.includes(streamPath);
  const shouldShowBbox    = hasBbox && isViolent;

  // Determine desired path based on alert state
  const desiredPath = shouldShowBbox ? `${streamPath}_bbox` : streamPath;

  const [currentPath, setCurrentPath] = useState(desiredPath);
  const [fallbackLevel, setFallbackLevel] = useState(0); // 0=desired, 1=raw fallback

  const updateStatus = (s) => {
    setStatus(s);
    onStatusChange?.(s);
  };

  // Reset when desired path changes (stream switch on alert toggle)
  useEffect(() => {
    setCurrentPath(desiredPath);
    setFallbackLevel(0);
  }, [desiredPath]);

  useEffect(() => {
    if (!hlsBaseUrl) { updateStatus('no-url'); return; }
    if (!currentPath) { updateStatus('error'); return; }

    const src   = `${hlsBaseUrl.replace(/\/$/, '')}/${currentPath}/index.m3u8`;
    const video = videoRef.current;
    if (!video) return;

    updateStatus('loading');

    const handleFatalError = () => {
      if (fallbackLevel === 0 && currentPath !== streamPath) {
        // First fallback: try raw stream
        console.warn(`[HLSPlayer] "${currentPath}" failed — falling back to raw "${streamPath}"`);
        setFallbackLevel(1);
        setCurrentPath(streamPath);
      } else {
        updateStatus('error');
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,        // Enable low-latency for real-time sync with API scores
        liveDurationInfinity: true,
        maxBufferLength: 2,          // Buffer only 2 seconds to match real-time API
        maxMaxBufferLength: 4,       // Max buffer up to 4 seconds
        manifestLoadingTimeOut: 3000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 3000,
        levelLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handleFatalError(); });
      video.onplaying = () => updateStatus('playing');

      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
      video.onplaying = () => updateStatus('playing');
      video.onerror   = handleFatalError;
      video.play().catch(() => {});
      return () => { video.src = ''; };
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

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, VideoOff, Settings } from 'lucide-react';

// Stream priority per camera:
//   Normal state  → <streamPath>       (raw camera stream - zero latency)
//   Violence ≥65% → <streamPath>_bbox  (bboxAPI — shows bounding boxes)

const BBOX_CAMERAS = ['cam_01', 'cam_02', 'cam_03', 'cam_04', 'cam_05'];

const HLSPlayer = ({ streamPath, hlsBaseUrl, isMuted = true, alertStatus, onStatusChange }) => {
  const rawVideoRef  = useRef(null);
  const bboxVideoRef = useRef(null);
  const rawHlsRef    = useRef(null);
  const bboxHlsRef   = useRef(null);

  const [rawStatus, setRawStatus] = useState('loading');
  const [bboxStatus, setBboxStatus] = useState('loading');

  const isViolent      = alertStatus === 'VIOLENCE_DETECTED';
  const hasBbox        = BBOX_CAMERAS.includes(streamPath);
  const shouldShowBbox = hasBbox && isViolent;

  // Sync overall status back to parent
  useEffect(() => {
    const currentStatus = shouldShowBbox ? bboxStatus : rawStatus;
    onStatusChange?.(currentStatus);
  }, [shouldShowBbox, rawStatus, bboxStatus]);

  const hlsConfig = {
    lowLatencyMode: true,
    liveDurationInfinity: true,
    maxBufferLength: 3,         // Low buffer for real-time sync with API status
    maxMaxBufferLength: 6,
    manifestLoadingTimeOut: 3000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 3000,
    levelLoadingMaxRetry: 3,
  };

  // 1. Raw Stream Player Lifecycle
  useEffect(() => {
    if (!hlsBaseUrl || !streamPath) {
      setRawStatus('error');
      return;
    }

    const src = `${hlsBaseUrl.replace(/\/$/, '')}/${streamPath}/index.m3u8`;
    const video = rawVideoRef.current;
    if (!video) return;

    setRawStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls(hlsConfig);
      rawHlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setRawStatus('error'); });
      video.onplaying = () => setRawStatus('playing');

      return () => {
        hls.destroy();
        rawHlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.onplaying = () => setRawStatus('playing');
      video.onerror   = () => setRawStatus('error');
      video.play().catch(() => {});
      return () => { video.src = ''; };
    } else {
      setRawStatus('error');
    }
  }, [streamPath, hlsBaseUrl]);

  // 2. Bbox Stream Player Lifecycle (only instantiated for configured cameras)
  useEffect(() => {
    if (!hlsBaseUrl || !streamPath || !hasBbox) {
      setBboxStatus('error');
      return;
    }

    const src = `${hlsBaseUrl.replace(/\/$/, '')}/${streamPath}_bbox/index.m3u8`;
    const video = bboxVideoRef.current;
    if (!video) return;

    setBboxStatus('loading');

    if (Hls.isSupported()) {
      const hls = new Hls(hlsConfig);
      bboxHlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setBboxStatus('error'); });
      video.onplaying = () => setBboxStatus('playing');

      return () => {
        hls.destroy();
        bboxHlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.onplaying = () => setBboxStatus('playing');
      video.onerror   = () => setBboxStatus('error');
      video.play().catch(() => {});
      return () => { video.src = ''; };
    } else {
      setBboxStatus('error');
    }
  }, [streamPath, hlsBaseUrl, hasBbox]);

  if (!hlsBaseUrl) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2 p-2">
        <Settings size={20} className="text-slate-500" />
        <p className="text-slate-500 text-xs text-center">Set HLS URL in Settings</p>
      </div>
    );
  }

  const isCurrentPlayerError = shouldShowBbox ? bboxStatus === 'error' : rawStatus === 'error';
  const isCurrentPlayerLoading = shouldShowBbox ? bboxStatus === 'loading' : rawStatus === 'loading';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Raw Camera Video Element */}
      <video
        ref={rawVideoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          !shouldShowBbox && rawStatus === 'playing' ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />

      {/* Bbox Camera Video Element */}
      {hasBbox && (
        <video
          ref={bboxVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            shouldShowBbox && bboxStatus === 'playing' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        />
      )}

      {/* Loading Overlay */}
      {isCurrentPlayerLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {isCurrentPlayerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-2 text-center z-30">
          <VideoOff className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-xs text-slate-400">Stream unavailable</p>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;

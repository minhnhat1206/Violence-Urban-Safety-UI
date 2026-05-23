import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_CAMERAS } from '../../constants';
import {
  X, Maximize, Radio, AlertTriangle, CheckCircle2,
  WifiOff, RefreshCw, Activity, Video, VideoOff,
} from 'lucide-react';
import WebRTCPlayer from '../common/WebRTCPlayer';

// ─── helpers ──────────────────────────────────────────────────────────────────

const statusStyle = (status) => {
  switch (status) {
    case 'NORMAL':           return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'VIOLENCE_DETECTED':return 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
    case 'OFFLINE':          return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default:                 return 'bg-slate-700/20 text-slate-500 border-slate-700/30';
  }
};

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// ─── Pipeline Status Banner ────────────────────────────────────────────────────
const PipelineBanner = () => {
  const [streaming, setStreaming] = useState(null);   // null = loading
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(() => {
    setRefreshing(true);
    fetch(`${API}/api/streaming-status`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setStreaming(d); setRefreshing(false); })
      .catch(() => { setStreaming({ mediamtx_ok: false, stream_count: 0, active_streams: [] }); setRefreshing(false); });
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const isUp   = streaming?.mediamtx_ok;
  const count  = streaming?.stream_count ?? 0;
  const total  = MOCK_CAMERAS.length;

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* MediaMTX indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
        ${isUp
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
        {isUp
          ? <><Radio size={14} className="animate-pulse" /> MediaMTX Online</>
          : <><WifiOff size={14} /> MediaMTX Offline</>}
      </div>

      {/* Stream count */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700 text-sm text-slate-300">
        <Activity size={14} className="text-emerald-400" />
        <span>
          <span className="text-white font-semibold">{count}</span>
          <span className="text-slate-500">/{total}</span> streams live
        </span>
      </div>

      {/* Active stream pills */}
      {isUp && streaming.active_streams?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {streaming.active_streams.map(s => (
            <span key={s} className="px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-mono">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Refresh button */}
      <button
        onClick={fetchStatus}
        disabled={refreshing}
        className="ml-auto p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        title="Refresh pipeline status"
      >
        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

// ─── Camera Card ──────────────────────────────────────────────────────────────
const CameraCard = ({ camera, onFocus, isLive }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveStatus = !isLive ? 'OFFLINE' : camera.status;

  return (
    <div className={`bg-slate-900/50 rounded-xl overflow-hidden shadow-lg border transition-all duration-300 group
      ${effectiveStatus === 'VIOLENCE_DETECTED'
        ? 'border-red-500/60 shadow-red-900/20'
        : 'border-slate-800 hover:border-emerald-500/50'}`}>
      <div className="relative aspect-video">
        {/* Live indicator dot */}
        {isLive && effectiveStatus !== 'OFFLINE' && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        )}

        {effectiveStatus !== 'OFFLINE' ? (
          <WebRTCPlayer streamPath={camera.streamPath} />
        ) : (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2">
            <VideoOff size={24} className="text-slate-600" />
            <p className="text-slate-600 text-xs">
              {isLive ? 'Stream not published' : 'Pipeline offline'}
            </p>
          </div>
        )}

        {/* Expand button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={() => onFocus(camera)}
            className="p-1.5 bg-slate-900/70 rounded-full text-white hover:bg-emerald-600 transition-colors"
          >
            <Maximize size={14} />
          </button>
        </div>

        {/* Overlay gradient */}
        <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <p className="text-white font-semibold text-sm drop-shadow-md leading-tight">{camera.specificLocation}</p>
          <p className="text-slate-300 text-xs drop-shadow-md">{camera.ward}</p>
        </div>
      </div>

      <div className="px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyle(effectiveStatus)}`}>
            {effectiveStatus === 'VIOLENCE_DETECTED' ? '⚠ ALERT' : effectiveStatus}
          </span>
          <span className="text-xs text-slate-600 font-mono">{camera.id}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">{time.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// ─── Focus Modal ─────────────────────────────────────────────────────────────
const FocusModal = ({ camera, onClose, isLive }) => {
  const effectiveStatus = !isLive ? 'OFFLINE' : camera.status;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-700 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">{camera.specificLocation}</h3>
            <p className="text-sm text-slate-400">{camera.ward} · {camera.district} · {camera.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusStyle(effectiveStatus)}`}>
              {effectiveStatus}
            </span>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="aspect-video bg-black">
          {effectiveStatus !== 'OFFLINE' ? (
            <WebRTCPlayer streamPath={camera.streamPath} isMuted={false} />
          ) : (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3">
              <VideoOff size={40} className="text-slate-700" />
              <p className="text-slate-500">Camera offline or pipeline not running</p>
              <p className="text-slate-600 text-sm font-mono">rtsp://mediamtx:8554/{camera.streamPath}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-900/50 flex justify-between items-center text-sm text-slate-400">
          <span className="font-mono">{camera.id} · WebRTC WHEP</span>
          <span>{new Date().toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const LiveStreams = () => {
  const [cameras, setCameras]           = useState(MOCK_CAMERAS);
  const [focusedCamera, setFocusedCamera] = useState(null);
  const [liveStreams, setLiveStreams]    = useState(new Set());  // set of active streamPaths

  // Poll camera violence status from Kafka
  useEffect(() => {
    const fetchCameraStatus = () => {
      fetch(`${API}/api/camera-status`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(({ cameras: statusMap }) => {
          if (!statusMap || typeof statusMap !== 'object') return;
          setCameras(prev =>
            prev.map(cam => {
              const realStatus = statusMap[cam.id];
              if (!realStatus) return cam;
              return { ...cam, status: realStatus };
            })
          );
        })
        .catch(() => {});
    };

    fetchCameraStatus();
    const id = setInterval(fetchCameraStatus, 5000);
    return () => clearInterval(id);
  }, []);

  // Poll which streams are live from MediaMTX
  useEffect(() => {
    const fetchLiveStreams = () => {
      fetch(`${API}/api/streaming-status`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => setLiveStreams(new Set(d.active_streams || [])))
        .catch(() => {});
    };

    fetchLiveStreams();
    const id = setInterval(fetchLiveStreams, 8000);
    return () => clearInterval(id);
  }, []);

  // Summary stats
  const alertCount  = cameras.filter(c => c.status === 'VIOLENCE_DETECTED' && liveStreams.has(c.streamPath)).length;
  const onlineCount = cameras.filter(c => liveStreams.has(c.streamPath)).length;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Video size={20} className="text-emerald-400" />
            Live Surveillance
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {onlineCount}/{cameras.length} cameras online
            {alertCount > 0 && (
              <span className="ml-2 text-red-400 font-medium animate-pulse">
                · {alertCount} alert{alertCount > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium">
              <AlertTriangle size={14} />
              {alertCount} Alert{alertCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
            <CheckCircle2 size={14} />
            {onlineCount} Online
          </span>
        </div>
      </div>

      {/* Pipeline status banner */}
      <PipelineBanner />

      {/* Camera grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            onFocus={setFocusedCamera}
            isLive={liveStreams.has(camera.streamPath)}
          />
        ))}
      </div>

      {/* Focus modal */}
      {focusedCamera && (
        <FocusModal
          camera={focusedCamera}
          onClose={() => setFocusedCamera(null)}
          isLive={liveStreams.has(focusedCamera.streamPath)}
        />
      )}
    </div>
  );
};

export default LiveStreams;

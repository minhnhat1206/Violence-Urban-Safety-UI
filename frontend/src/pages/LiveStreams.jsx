import React, { useState, useEffect, useCallback } from 'react';
import { CAMERA_REGISTRY } from '../../constants';
import {
  X, Maximize, AlertTriangle, CheckCircle2,
  Video, VideoOff, Settings as SettingsIcon,
} from 'lucide-react';
import HLSPlayer from '../common/HLSPlayer';

const LS_KEY    = 'hls_base_url';
// MediaMTX HLS. Host :8888 is taken by VS Code on datalab → remapped to :18888.
// Tailscale IP works both from datalab itself and remote Tailscale machines.
const DEFAULT_HLS = '';   // HLS paths = /cam_XX/index.m3u8 → vite proxy ^/cam_\d+ → mediamtx :8888
const API       = import.meta.env.VITE_API_BASE_URL  || '';
const ADMIN_API = import.meta.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:5003';

const statusStyle = (status) => {
  switch (status) {
    case 'NORMAL':           return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'VIOLENCE_DETECTED':return 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
    case 'OFFLINE':          return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default:                 return 'bg-slate-700/20 text-slate-500 border-slate-700/30';
  }
};

// ─── HLS URL Banner ────────────────────────────────────────────────────────────
const HlsBanner = ({ hlsUrl }) => {
  if (hlsUrl || hlsUrl === "") {
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
        bg-emerald-500/10 border-emerald-500/30 text-emerald-400 w-fit">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        HLS active · <span className="font-mono truncate max-w-xs">{hlsUrl}</span>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
      bg-amber-500/10 border-amber-500/30 text-amber-400 w-fit">
      <SettingsIcon size={14} />
      HLS URL not configured — go to <strong className="ml-1">Settings</strong> to set the ngrok URL
    </div>
  );
};

// ─── Camera Card ──────────────────────────────────────────────────────────────
const CameraCard = ({ camera, onFocus, hlsUrl, alertStatus }) => {
  const [streamStatus, setStreamStatus] = useState('loading');
  const [time, setTime] = useState(new Date());
  const [camData, setCamData] = useState(null); // real-time from VioMoViNet

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll VioMoViNet directly for real-time score + violence status (every 3s).
  // statusId phân biệt StreamViD (cam_XX) vs A3 (cam_XX_a3) → đúng file status.
  useEffect(() => {
    const sid = camera.statusId || camera.id;
    const fetchData = () => {
      fetch(`/vio/api/stream/status/${sid}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setCamData(d); })
        .catch(() => {});
    };
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, [camera.statusId, camera.id]);

  const score = camData?.score ?? 0;
  const scorePct = Math.round(score * 100);
  const isViolent = camData?.is_violent ?? false;
  const fps = camData?.fps ?? 0;

  const effectiveStatus = (hlsUrl === null || hlsUrl === undefined)
    ? 'OFFLINE'
    : isViolent ? 'VIOLENCE_DETECTED' : 'NORMAL';

  const isLive = streamStatus === 'playing';
  const scoreColor = score >= 0.7 ? 'bg-red-500' : score >= 0.4 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className={`bg-slate-900/50 rounded-xl overflow-hidden shadow-lg border transition-all duration-300 group
      ${effectiveStatus === 'VIOLENCE_DETECTED'
        ? 'border-red-500/60 shadow-red-900/20'
        : 'border-slate-800 hover:border-emerald-500/50'}`}>
      <div className="relative aspect-video">
        {isLive && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        )}

        {camera.modelLabel && (
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded text-xs font-bold text-white
            ${camera.modelAccent === 'sky' ? 'bg-sky-600/85' : 'bg-emerald-600/85'}`}>
            {camera.modelLabel}
          </div>
        )}

        <HLSPlayer
          streamPath={camera.streamPath}
          hlsBaseUrl={hlsUrl}
          isMuted
          onStatusChange={setStreamStatus}
        />

        <button
          onClick={() => onFocus(camera)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1.5 bg-slate-900/70 rounded-full text-white hover:bg-emerald-600"
        >
          <Maximize size={14} />
        </button>

        <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <p className="text-white font-semibold text-sm drop-shadow-md leading-tight">{camera.specificLocation}</p>
          <p className="text-slate-300 text-xs drop-shadow-md">{camera.ward}</p>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyle(effectiveStatus)}`}>
              {effectiveStatus === 'VIOLENCE_DETECTED' ? '⚠ ALERT' : effectiveStatus}
            </span>
            <span className="text-xs text-slate-600 font-mono">{camera.id}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{time.toLocaleTimeString()}</span>
        </div>
        {/* Real-time violence score bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${scoreColor} rounded-full transition-all duration-500`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
          <span className={`text-xs font-mono font-bold ${isViolent ? 'text-red-400' : 'text-slate-400'}`}>
            {scorePct}%
          </span>
          {fps > 0 && <span className="text-xs text-slate-600">{fps.toFixed(0)}fps</span>}
        </div>
      </div>
    </div>
  );
};

// ─── Focus Modal ─────────────────────────────────────────────────────────────
const FocusModal = ({ camera, onClose, hlsUrl, alertStatus }) => {
  const effectiveStatus = (hlsUrl === null || hlsUrl === undefined) ? "OFFLINE" : alertStatus || camera.status;

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
          <HLSPlayer
            streamPath={camera.streamPath}
            hlsBaseUrl={hlsUrl}
            isMuted={false}
          />
        </div>

        <div className="px-4 py-3 bg-slate-900/50 flex justify-between items-center text-sm text-slate-400">
          <span className="font-mono">{camera.id} · HLS</span>
          <span>{new Date().toLocaleString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const LiveStreams = () => {
  const [cameras, setCameras]         = useState(CAMERA_REGISTRY);
  const [activeCamIds, setActiveCamIds] = useState(null); // null = loading, Set when loaded
  const [focusedCamera, setFocus]     = useState(null);
  const [hlsUrl, setHlsUrl]           = useState(() => localStorage.getItem(LS_KEY) || DEFAULT_HLS);
  const [alertMap, setAlertMap]       = useState({});  // cam_id → status

  // Sync HLS URL from localStorage when Settings saves it
  useEffect(() => {
    const handler = () => setHlsUrl(localStorage.getItem(LS_KEY) || DEFAULT_HLS);
    window.addEventListener('hls-url-changed', handler);
    return () => window.removeEventListener('hls-url-changed', handler);
  }, []);

  // Fetch active cameras from VioMoViNet inference server (REAL active streams)
  useEffect(() => {
    const fetchActive = () => {
      fetch('/vio/api/stream/active')
        .then(r => { if (!r.ok) throw 0; return r.json(); })
        .then((data) => {
          const streams = data.streams || [];
          const active = new Set(streams.map(s => s.camera_id));
          setActiveCamIds(active.size > 0 ? active : null);
        })
        .catch(() => setActiveCamIds(null)); // fallback: show all
    };
    fetchActive();
    const id = setInterval(fetchActive, 10000); // refresh mỗi 10s
    return () => clearInterval(id);
  }, []);

  // Poll camera violence status from chatbot API
  useEffect(() => {
    const fetch_ = () => {
      fetch(`${API}/api/camera-status`)
        .then(r => { if (!r.ok) throw 0; return r.json(); })
        .then(({ cameras: map }) => {
          if (map && typeof map === 'object') setAlertMap(map);
        })
        .catch(() => {});
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, []);

  // Only show cameras that are active (or all if admin API unavailable)
  const visibleCameras = activeCamIds
    ? cameras.filter(c => activeCamIds.has(c.id))
    : cameras;

  const alertCount  = visibleCameras.filter(c => alertMap[c.id] === 'VIOLENCE_DETECTED').length;
  const onlineCount = (hlsUrl || hlsUrl === "") ? visibleCameras.length : 0;
  const totalCount  = cameras.length;
  const activeCount = activeCamIds ? activeCamIds.size : totalCount;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Video size={20} className="text-emerald-400" />
            Live Surveillance
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {activeCount}/{totalCount} cameras active
            {onlineCount > 0 && activeCount !== onlineCount && (
              <span className="ml-1 text-slate-600">· {onlineCount} streaming</span>
            )}
            {alertCount > 0 && (
              <span className="ml-2 text-red-400 font-medium animate-pulse">
                · {alertCount} alert{alertCount > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium">
              <AlertTriangle size={14} />
              {alertCount} Alert{alertCount > 1 ? 's' : ''}
            </span>
          )}
          {hlsUrl && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
              <CheckCircle2 size={14} />
              HLS Active
            </span>
          )}
        </div>
      </div>

      <HlsBanner hlsUrl={hlsUrl} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleCameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            onFocus={setFocus}
            hlsUrl={hlsUrl}
            alertStatus={alertMap[camera.id]}
          />
        ))}
      </div>

      {focusedCamera && (
        <FocusModal
          camera={focusedCamera}
          onClose={() => setFocus(null)}
          hlsUrl={hlsUrl}
          alertStatus={alertMap[focusedCamera.id]}
        />
      )}
    </div>
  );
};

export default LiveStreams;

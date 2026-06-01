import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_CAMERAS } from '../../constants';
import { Video, Save, X, Play, Square, RefreshCw, Activity } from 'lucide-react';

const LS_KEY    = 'hls_base_url';
const ADMIN_API = import.meta.env.VITE_ADMIN_API_BASE_URL || 'http://localhost:5003';

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
      ${checked ? 'bg-emerald-500' : 'bg-slate-600'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
    />
  </button>
);

const HLSUrlSection = () => {
  const [saved, setSaved]   = useState(() => localStorage.getItem(LS_KEY) || '');
  const [draft, setDraft]   = useState(saved);
  const [status, setStatus] = useState('idle'); // 'idle' | 'saved'

  const handleSave = () => {
    const trimmed = draft.trim();
    localStorage.setItem(LS_KEY, trimmed);
    setSaved(trimmed);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
    window.dispatchEvent(new Event('hls-url-changed'));
  };

  const handleClear = () => {
    localStorage.removeItem(LS_KEY);
    setSaved('');
    setDraft('');
    window.dispatchEvent(new Event('hls-url-changed'));
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 mb-1">
        <Video size={18} className="text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">Live Stream Configuration</h3>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        Paste the ngrok HTTPS URL exposing local MediaMTX port 8888.
        Streams will be loaded as <span className="font-mono text-slate-400">&lt;url&gt;/cam_XX/index.m3u8</span>.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="https://xxxx.ngrok-free.app"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500"
        />
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <Save size={14} />
          {status === 'saved' ? 'Saved!' : 'Save'}
        </button>
        {saved && (
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Clear URL"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {saved && (
        <p className="mt-2 text-xs text-emerald-400 font-mono truncate">
          Active: {saved}
        </p>
      )}
    </div>
  );
};

// ─── Pipeline Control Section ─────────────────────────────────────────────────
const PipelineControl = () => {
  const [status, setStatus]   = useState(null);   // pipeline-status response
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchStatus = useCallback(() => {
    fetch(`${ADMIN_API}/api/pipeline-status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const isRunning = status?.containers?.['rtsp-inference-mock'] === 'running'
                 || status?.containers?.['rtsp_pusher'] === 'running';

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${ADMIN_API}/api/start`, { method: 'POST' });
      const d = await r.json();
      showToast(d.ok ? `Pipeline started · ${d.active_cameras || 'all'} cameras` : `Error: ${d.error}`);
      window.dispatchEvent(new Event('pipeline-cameras-changed'));
      setTimeout(fetchStatus, 1000);
    } finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${ADMIN_API}/api/stop`, { method: 'POST' });
      const d = await r.json();
      showToast(d.ok ? 'Stop signal sent — pipeline shutting down gracefully' : `Error: ${d.error}`);
      setTimeout(fetchStatus, 2000);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-emerald-400" />
          <h3 className="text-xl font-semibold text-white">Pipeline Control</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border
            ${isRunning
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-700/30 border-slate-600/30 text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {status === null ? 'Unknown' : isRunning ? 'Running' : 'Stopped'}
          </span>
          <button onClick={fetchStatus} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {status?.streams?.active?.length > 0 && (
        <p className="text-xs text-slate-500 mb-4">
          Active RTSP streams: <span className="font-mono text-slate-400">{status.streams.active.join(', ')}</span>
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <Play size={14} />
          Start Pipeline
        </button>
        <button
          onClick={handleStop}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-slate-300 text-sm font-medium transition-colors"
        >
          <Square size={14} />
          Stop Pipeline
        </button>
      </div>

      {toast && (
        <p className="mt-3 text-xs text-emerald-400">{toast}</p>
      )}
    </div>
  );
};

// ─── Camera Management Section ────────────────────────────────────────────────
const CameraManagement = () => {
  const [cameras, setCameras]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(null); // camera_id being toggled
  const [toast, setToast]       = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchCameras = useCallback(() => {
    fetch(`${ADMIN_API}/api/cameras`)
      .then(r => r.json())
      .then(d => { setCameras(d.cameras || []); setLoading(false); })
      .catch(() => {
        // Fallback to MOCK_CAMERAS when admin API unavailable
        setCameras(MOCK_CAMERAS.map(c => ({ camera_id: c.id, location: c.specificLocation, district: c.district, ward: c.ward, active: true })));
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchCameras(); }, [fetchCameras]);

  const handleToggle = async (cameraId) => {
    setToggling(cameraId);
    try {
      const r = await fetch(`${ADMIN_API}/api/cameras/${cameraId}/toggle`, { method: 'POST' });
      const d = await r.json();
      setCameras(prev => prev.map(c => c.camera_id === cameraId ? { ...c, active: d.active } : c));
      showToast(`${cameraId} ${d.active ? 'activated' : 'deactivated'} — restart pipeline to apply`);
      window.dispatchEvent(new Event('pipeline-cameras-changed'));
    } catch {
      showToast('Failed to toggle camera — Admin API unavailable');
    } finally { setToggling(null); }
  };

  const activeCount = cameras.filter(c => c.active).length;

  return (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Manage Cameras</h3>
        <span className="text-sm text-slate-400">
          <span className="text-emerald-400 font-semibold">{activeCount}</span>/{cameras.length} active
        </span>
      </div>

      {toast && <p className="mb-3 text-xs text-amber-400">{toast}</p>}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading cameras…</p>
      ) : (
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Ward</th>
                <th className="px-6 py-3 text-center">Active</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((cam) => (
                <tr key={cam.camera_id} className={`border-b border-slate-800 transition-colors
                  ${cam.active ? 'hover:bg-slate-800/40' : 'opacity-50 hover:opacity-70 hover:bg-slate-800/20'}`}>
                  <td className="px-6 py-3 font-mono text-slate-300">{cam.camera_id}</td>
                  <td className="px-6 py-3">{cam.location}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{cam.ward}</td>
                  <td className="px-6 py-3 text-center">
                    <Toggle
                      checked={cam.active}
                      onChange={() => handleToggle(cam.camera_id)}
                      disabled={toggling === cam.camera_id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────
const Settings = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <HLSUrlSection />
      <PipelineControl />
      <CameraManagement />
    </div>
  );
};

export default Settings;

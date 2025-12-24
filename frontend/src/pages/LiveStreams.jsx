import React, { useState, useEffect } from 'react';
import { X, Maximize, AlertTriangle } from 'lucide-react'; 
import WebRTCPlayer from '../common/WebRTCPlayer';
import { MOCK_CAMERAS } from '../../constants'; 

const getStatusConfig = (score, isOffline) => {
  if (isOffline) return { label: 'OFFLINE', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  if (score >= 0.4) return { label: 'VIOLENCE_DETECTED', color: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' };
  if (score >= 0.35) return { label: 'WARNING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  return { label: 'NORMAL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
};

const getStatusBadgeColor = (score, isOffline) => getStatusConfig(score, isOffline).color;

const CameraCard = ({ camera, onFocus }) => {
  const [dynamicStatus, setDynamicStatus] = useState({ score: 0, isOffline: false });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/camera/status/${camera.id}`);
        const data = await response.json();
        setDynamicStatus({ score: data.score || 0, isOffline: data.status === "offline" });
      } catch (err) {
        setDynamicStatus(prev => ({ ...prev, isOffline: true }));
      }
    };
    const statusInterval = setInterval(fetchStatus, 500); // Tối ưu: 500ms
    return () => clearInterval(statusInterval);
  }, [camera.id]);

  const config = getStatusConfig(dynamicStatus.score, dynamicStatus.isOffline);

  return (
    <div className={`bg-slate-900/50 rounded-xl overflow-hidden border transition-all ${
      dynamicStatus.score >= 0.5 ? 'border-red-500 shadow-lg' : 'border-slate-800'
    }`}>
      <div className="relative aspect-video">
        {!dynamicStatus.isOffline ? (
          <WebRTCPlayer streamPath={camera.streamPath} />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center text-slate-500">SIGNAL LOST</div>
        )}
        <div className="absolute top-2 right-2">
          <button onClick={() => onFocus({...camera, score: dynamicStatus.score, isOffline: dynamicStatus.isOffline})} className="p-2 bg-slate-900/50 rounded-full text-white hover:bg-emerald-500">
            <Maximize size={16} />
          </button>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
};

const FocusModal = ({ camera, onClose }) => {
  const config = getStatusConfig(camera.score, camera.isOffline);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-4xl border border-slate-700 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{camera.specificLocation}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="aspect-video bg-black">
          {!camera.isOffline ? <WebRTCPlayer streamPath={camera.streamPath} /> : <div className="h-full flex items-center justify-center text-slate-500">OFFLINE</div>}
        </div>
        <div className="p-4 flex justify-between items-center bg-slate-900/50">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${config.color}`}>{config.label}</span>
          <span className="text-sm text-slate-400 font-mono">{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const LiveStreams = () => {
  const [focusedCamera, setFocusedCamera] = useState(null);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MOCK_CAMERAS.map(cam => <CameraCard key={cam.id} camera={cam} onFocus={setFocusedCamera} />)}
      {focusedCamera && <FocusModal camera={focusedCamera} onClose={() => setFocusedCamera(null)} />}
    </div>
  );
};

export default LiveStreams;
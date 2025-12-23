import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Camera, X, Trash2, AlertTriangle, MapPin } from 'lucide-react';

// MÀU CHO SCORE
const getScoreColor = (score) => {
  if (score >= 0.9) return 'text-red-500 font-bold';
  if (score >= 0.75) return 'text-orange-400 font-semibold';
  return 'text-yellow-400';
};

// MODAL HIỂN THỊ CHI TIẾT
const AlertModal = ({ alert, onClose }) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-700 flex flex-col max-h-[90vh]">
      <div className="p-4 flex justify-between items-center border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white">Bronze Event Details</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">{alert.event_id}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
          <X size={24} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-slate-800 group relative">
          <img
            src={alert.frame_url}
            alt="Evidence"
            className="object-contain w-full h-full"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/640x360?text=Bronze+View+Only'; }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Location Info</span>
              <div className="text-slate-200 text-lg font-semibold">{alert.camera_id}</div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                <MapPin size={12} /> {alert.ward || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Detection Timestamp</span>
              <div className="text-slate-200 font-mono">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Violence Score</span>
              <div className={`text-3xl ${getScoreColor(alert.score)}`}>
                {(alert.score * 100).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">AI Classification</span>
              <div className="text-slate-200 italic">{alert.label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// DASHBOARD CHÍNH
const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/alerts/bronze');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const formatted = data.map((item) => ({
          ...item,
          score: Number(item.score),
        }));
        setAlerts(formatted);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (eventId) => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA vĩnh viễn sự kiện này khỏi database Trino?")) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/alerts/${eventId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.event_id !== eventId));
      } else {
        const errData = await response.json();
        alert(`Lỗi: ${errData.message || "Không thể xóa"}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedAlerts = useMemo(() => {
    const items = [...alerts];
    items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [alerts, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <div>
          <h2 className="text-xl text-white font-bold flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            Lakehouse Bronze Viewer
          </h2>
          <p className="text-sm text-slate-400 mt-1">Review raw streaming events with Ward location</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Status</span>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            CONNECTED TO TRINO
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-900/50 font-black tracking-wider">
            <tr>
              {/* Thêm 'ward' vào danh sách lặp tiêu đề */}
              {['timestamp', 'camera_id', 'ward', 'score', 'label'].map((key) => (
                <th key={key} className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort(key)}>
                  <div className="flex items-center gap-2">
                    {key.replace('_', ' ')}
                    {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center">Control</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/50">
            {sortedAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic text-lg">
                   Waiting for new events from Kafka...
                </td>
              </tr>
            ) : (
              sortedAlerts.map((alert) => (
                <tr key={alert.event_id} className="hover:bg-slate-800/30 transition-all group border-l-2 border-transparent hover:border-emerald-500">
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-200 font-semibold">{alert.camera_id}</td>
                  
                  {/* Cột hiển thị Ward mới */}
                  <td className="px-6 py-4 text-slate-400 italic text-xs">
                    {alert.ward || 'Unknown'}
                  </td>

                  <td className="px-6 py-4">
                    <div className={`font-mono font-black ${getScoreColor(alert.score)}`}>
                      {alert.score.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${alert.is_violent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {alert.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 bg-slate-800 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                        title="View Evidence"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(alert.event_id)}
                        disabled={isDeleting}
                        className="p-2 bg-slate-800 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg disabled:opacity-30"
                        title="Delete from Lakehouse"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedAlert && <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}
    </div>
  );
};

export default AlertsDashboard;
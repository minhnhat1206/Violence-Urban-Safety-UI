import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Camera, X } from 'lucide-react';

// MÀU CHO TRẠNG THÁI
const getStatusPillColor = (status) => {
  switch (status) {
    case 'Unreviewed':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'Reviewed':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'False Alarm':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
};

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
          <h3 className="text-xl font-bold text-white">Event Details</h3>
          <p className="text-xs text-slate-500 mt-1">{alert.event_id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center overflow-hidden border border-slate-800 group relative">
          <img
            src={alert.frame_url}
            alt="Evidence"
            className="object-contain w-full h-full"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/640x360?text=Image+Not+Found';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
            <span className="text-white text-sm font-medium">
              Evidence captured at {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase">Location</span>
              <div className="text-slate-200">{alert.location}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Timestamp</span>
              <div className="text-slate-200 font-mono">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">AI Model</span>
              <div className="text-slate-200">{alert.model_version}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase">Violence Score</span>
              <div className={`text-2xl ${getScoreColor(alert.violence_score)}`}>
                {(alert.violence_score * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Classification</span>
              <div className="text-slate-200">{alert.label}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Review Status</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusPillColor(alert.status)}`}>
                {alert.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// DASHBOARD
const AlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc',
  });

  useEffect(() => {
    const fetchAlerts = () => {
      fetch('http://localhost:3000/alerts')
        .then((res) => res.json())
        .then((data) => {
          const formatted = data.map((item) => ({
            ...item,
            violence_score: Number(item.violence_score),
          }));
          setAlerts(formatted);
        })
        .catch((err) => console.error('Fetch failed:', err));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const sortedAlerts = useMemo(() => {
    const items = [...alerts];
    if (sortConfig) {
      items.sort((a, b) => {
        const key = sortConfig.key;
        if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [alerts, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-lg text-white font-semibold">Recent Security Alerts (Star Schema Data)</h2>
        <p className="text-sm text-slate-400">Real-time monitoring from Kafka & Iceberg Lakehouse</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-800/80">
            <tr>
              {['timestamp', 'location', 'violence_score', 'label', 'status'].map((key) => (
                <th
                  key={key}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-800"
                  onClick={() => requestSort(key)}
                >
                  <div className="flex items-center gap-2">
                    {key.replace('_', ' ')}
                    <span>{getSortIcon(key)}</span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center">Evidence</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {sortedAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                  No alerts found in the Data Warehouse.
                </td>
              </tr>
            ) : (
              sortedAlerts.map((alert) => (
                <tr key={alert.event_id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-white">{alert.location}</td>

                  <td className="px-6 py-4">
                    <div className={`font-mono font-bold ${getScoreColor(alert.violence_score)}`}>
                      {alert.violence_score.toFixed(4)}
                    </div>
                  </td>

                  <td className="px-6 py-4">{alert.label}</td>

                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full ${getStatusPillColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2 bg-slate-800 text-emerald-400 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-300 transition"
                    >
                      <Camera size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedAlert && (
        <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
};

export default AlertsDashboard;

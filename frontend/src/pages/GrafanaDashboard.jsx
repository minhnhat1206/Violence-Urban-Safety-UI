import React, { useState } from 'react';
import { Activity, Shield, Zap, Server, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';

const GRAFANA_BASE = import.meta.env.VITE_GRAFANA_URL || 'http://34.124.131.144:3001';

const DASHBOARDS = [
  {
    uid: 'violence-incidents-v2',
    title: 'Violence Incidents Analytics',
    description: 'Tổng quan sự cố bạo lực — 24h / 7 ngày / 30 ngày',
    icon: Shield,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  {
    uid: 'violence-security-monitor',
    title: 'Security Monitor (7 ngày)',
    description: 'Phân tích an ninh theo district, camera, risk score',
    icon: Activity,
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
  },
  {
    uid: 'violence_analytics',
    title: 'Violence Analytics',
    description: 'Trend, heatmap, phân phối event type',
    icon: TrendingUp,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  {
    uid: 'chatbot-metrics',
    title: 'Chatbot Performance',
    description: 'Latency HOT/WARM/COLD, query throughput',
    icon: Zap,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  {
    uid: 'streamhouse-arch-001',
    title: 'Streamhouse Architecture',
    description: 'Pipeline health — Flink jobs, lag, throughput',
    icon: Server,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
];

const buildIframeUrl = (uid, from = 'now-7d', to = 'now') =>
  `${GRAFANA_BASE}/d/${uid}?orgId=1&from=${from}&to=${to}&kiosk=tv&theme=dark&refresh=30s`;

const DashboardCard = ({ dash, onClick, active }) => {
  const Icon = dash.icon;
  return (
    <button
      onClick={() => onClick(dash)}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200
        ${active
          ? `${dash.bg} ${dash.border} ring-1 ring-inset ${dash.border}`
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${active ? dash.bg : 'bg-slate-800'}`}>
          <Icon size={16} className={active ? dash.color : 'text-slate-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-slate-300'}`}>
            {dash.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-tight">{dash.description}</p>
        </div>
      </div>
    </button>
  );
};

const TIME_RANGES = [
  { label: '1h',  from: 'now-1h' },
  { label: '6h',  from: 'now-6h' },
  { label: '24h', from: 'now-24h' },
  { label: '7d',  from: 'now-7d' },
  { label: '30d', from: 'now-30d' },
];

const GrafanaDashboard = () => {
  const [active, setActive]   = useState(DASHBOARDS[0]);
  const [timeRange, setTime]  = useState('now-7d');
  const [key, setKey]         = useState(0);  // force iframe reload

  const refresh = () => setKey(k => k + 1);

  const iframeUrl = buildIframeUrl(active.uid, timeRange);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-emerald-400" />
            Grafana Dashboards
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Live monitoring từ Prometheus · Flink · Paimon
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {TIME_RANGES.map(r => (
              <button
                key={r.from}
                onClick={() => setTime(r.from)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors
                  ${timeRange === r.from
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            title="Reload dashboard"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <a
            href={`${GRAFANA_BASE}/d/${active.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Open in Grafana"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar — dashboard list */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {DASHBOARDS.map(d => (
            <DashboardCard
              key={d.uid}
              dash={d}
              onClick={setActive}
              active={active.uid === d.uid}
            />
          ))}

          {/* Quick links */}
          <div className="mt-2 pt-3 border-t border-slate-800">
            <p className="text-xs text-slate-600 uppercase tracking-wide mb-2 px-1">Quick links</p>
            <a href={`${GRAFANA_BASE}`} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
              <ExternalLink size={12} /> Grafana Home
            </a>
            <a href={`http://34.124.131.144:9090`} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
              <Activity size={12} /> Prometheus
            </a>
          </div>
        </div>

        {/* Main iframe area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-sm font-semibold ${active.color}`}>{active.title}</h2>
            <span className="text-xs text-slate-500 font-mono">{active.uid}</span>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
            <iframe
              key={`${active.uid}-${timeRange}-${key}`}
              src={iframeUrl}
              className="w-full h-full border-0"
              title={active.title}
              loading="lazy"
              onError={() => {}}
            />

            {/* Fallback overlay — shown if Grafana unreachable */}
            <noscript>
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                <p className="text-slate-500 text-sm">Grafana không khả dụng</p>
              </div>
            </noscript>
          </div>

          <p className="text-xs text-slate-600 mt-1.5 truncate font-mono">{iframeUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default GrafanaDashboard;

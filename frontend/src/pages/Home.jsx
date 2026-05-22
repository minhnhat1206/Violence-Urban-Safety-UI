import React, { useState, useEffect } from 'react';
import { ShieldAlert, Camera, Activity, Zap, Database, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_CAMERAS } from '../../constants';

// ── helpers ────────────────────────────────────────────────────────────────
const useApiData = (url, fallback = null) => {
  const [data, setData] = useState(fallback);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { if (!cancelled) { setData(d); setStatus('ok'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, status };
};

// ── sub-components ─────────────────────────────────────────────────────────
const KPICard = ({ title, value, sub, icon: Icon, accent }) => (
  <div className={`bg-slate-900/80 border rounded-xl p-5 flex flex-col gap-3 ${accent.border}`}>
    <div className="flex justify-between items-start">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className={`p-2 rounded-lg ${accent.bg}`}>
        <Icon size={18} className={accent.text} />
      </div>
    </div>
    <div>
      <p className={`text-3xl font-bold ${accent.text}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const LayerBadge = ({ label, desc, color, icon: Icon, healthy, count, latencyMs, targetMs }) => (
  <div className={`flex items-start gap-3 p-4 rounded-xl border ${color.border} ${color.bg}`}>
    <div className={`p-2 rounded-lg ${color.iconBg} flex-shrink-0`}>
      <Icon size={16} className={color.iconText} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className={`font-semibold text-sm ${color.iconText}`}>{label}</p>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${healthy ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
      </div>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
        {count != null && count >= 0 && (
          <span className="text-xs font-mono text-slate-300">
            {count.toLocaleString()} rows
          </span>
        )}
        {latencyMs != null && (
          <span className={`text-xs font-mono ${latencyMs <= targetMs ? 'text-emerald-400' : 'text-amber-400'}`}>
            {latencyMs < 1000 ? `${latencyMs}ms` : `${(latencyMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ScoreBadge = ({ score }) => {
  if (score >= 0.9) return <span className="text-red-400 font-bold font-mono">{(score * 100).toFixed(0)}%</span>;
  if (score >= 0.75) return <span className="text-orange-400 font-semibold font-mono">{(score * 100).toFixed(0)}%</span>;
  return <span className="text-yellow-400 font-mono">{(score * 100).toFixed(0)}%</span>;
};

// ── main ───────────────────────────────────────────────────────────────────
const Home = () => {
  const { data: incidents,    status: incStatus    } = useApiData('/api/recent-incidents', []);
  const { data: stats,        status: statsStatus  } = useApiData('/api/stats', null);
  const { data: layerCounts,  status: lcStatus     } = useApiData('/api/layer-counts', null);
  const { data: latency,      status: latStatus    } = useApiData('/api/latency', null);

  // Derived KPIs
  const totalIncidents = incidents?.length ?? 0;
  const violentCount = incidents?.filter(i => (i.violence_score ?? 0) >= 0.5).length ?? 0;
  const violenceRate = totalIncidents > 0 ? ((violentCount / totalIncidents) * 100).toFixed(0) : 0;
  const peakScore = incidents?.length
    ? Math.max(...incidents.map(i => i.violence_score ?? 0))
    : 0;
  const activeCams = MOCK_CAMERAS.filter(c => c.status !== 'OFFLINE').length;

  const apiOnline = incStatus === 'ok' || statsStatus === 'ok';
  const hotHealthy  = layerCounts?.hot  != null && layerCounts.hot  >= 0;
  const warmHealthy = layerCounts?.warm != null && layerCounts.warm >= 0;
  const coldHealthy = layerCounts?.cold != null && layerCounts.cold >= 0;

  return (
    <div className="space-y-6">

      {/* ── Page title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Realtime Violence Detection · Streamhouse Architecture
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {apiOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Backend online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
              <AlertTriangle size={12} />
              Backend offline — hiển thị mock data
            </span>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Incidents (recent)"
          value={incStatus === 'loading' ? '…' : totalIncidents}
          sub="từ Iceberg via Trino"
          icon={ShieldAlert}
          accent={{ border: 'border-red-500/20', bg: 'bg-red-500/10', text: 'text-red-400' }}
        />
        <KPICard
          title="Violence Rate"
          value={incStatus === 'loading' ? '…' : `${violenceRate}%`}
          sub={`${violentCount} / ${totalIncidents} sự cố`}
          icon={TrendingUp}
          accent={{ border: 'border-orange-500/20', bg: 'bg-orange-500/10', text: 'text-orange-400' }}
        />
        <KPICard
          title="Peak Risk Score"
          value={incStatus === 'loading' ? '…' : peakScore ? `${(peakScore * 100).toFixed(0)}%` : '—'}
          sub="risk score cao nhất"
          icon={Activity}
          accent={{ border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400' }}
        />
        <KPICard
          title="Active Cameras"
          value={activeCams}
          sub={`/ ${MOCK_CAMERAS.length} cameras`}
          icon={Camera}
          accent={{ border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Streamhouse Layers ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Database size={16} className="text-emerald-400" />
            Streamhouse 3-Layer
          </h2>
          <div className="space-y-3">
            <LayerBadge
              label="HOT · Fluss"
              desc="<100ms · real-time · 1-2h retention"
              icon={Zap}
              color={{
                border: 'border-red-500/20',
                bg: 'bg-red-500/5',
                iconBg: 'bg-red-500/20',
                iconText: 'text-red-400',
              }}
              healthy={hotHealthy}
              count={layerCounts?.hot}
              latencyMs={latency?.hot?.latency_ms}
              targetMs={100}
            />
            <LayerBadge
              label="WARM · Paimon"
              desc="1-10 min · ACID · 7-30 day retention"
              icon={Database}
              color={{
                border: 'border-amber-500/20',
                bg: 'bg-amber-500/5',
                iconBg: 'bg-amber-500/20',
                iconText: 'text-amber-400',
              }}
              healthy={warmHealthy}
              count={layerCounts?.warm}
              latencyMs={latency?.warm?.latency_ms}
              targetMs={10000}
            />
            <LayerBadge
              label="COLD · Iceberg"
              desc="Parquet · time-travel · years retention"
              icon={Database}
              color={{
                border: 'border-blue-500/20',
                bg: 'bg-blue-500/5',
                iconBg: 'bg-blue-500/20',
                iconText: 'text-blue-400',
              }}
              healthy={coldHealthy}
              count={layerCounts?.cold}
              latencyMs={latency?.cold?.latency_ms}
              targetMs={30000}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Query Engine</span>
              <span className="text-slate-300">Trino · port 8082</span>
            </div>
            <div className="flex justify-between">
              <span>Stream Broker</span>
              <span className="text-slate-300">Kafka · port 19092</span>
            </div>
            <div className="flex justify-between">
              <span>Compute</span>
              <span className="text-slate-300">Apache Flink · port 8081</span>
            </div>
          </div>
        </div>

        {/* ── Recent Incidents ── */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" />
              Recent Incidents
            </h2>
            <Link
              to="/alertsdashboard"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            >
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>

          {incStatus === 'loading' && (
            <div className="text-slate-500 text-sm text-center py-8 animate-pulse">Đang tải dữ liệu từ Iceberg…</div>
          )}

          {incStatus === 'error' && (
            <div className="text-slate-500 text-sm text-center py-8 flex flex-col items-center gap-2">
              <AlertTriangle size={24} className="text-amber-500" />
              <span>Backend offline. Khởi động Docker stack để xem dữ liệu thực.</span>
            </div>
          )}

          {incStatus === 'ok' && incidents.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">Không có dữ liệu.</p>
          )}

          {incStatus === 'ok' && incidents.length > 0 && (
            <div className="space-y-2">
              {incidents.slice(0, 6).map((inc, i) => (
                <div key={inc.event_id ?? i} className="flex items-center gap-3 py-2 border-b border-slate-800/60 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{inc.location || inc.camera_id}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {inc.timestamp ? new Date(inc.timestamp).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">{inc.label}</span>
                    <ScoreBadge score={inc.violence_score ?? 0} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Locations + Alert Types ── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top locations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              Điểm nóng (7 ngày qua)
            </h2>
            <div className="space-y-2">
              {(stats.topLocations ?? []).slice(0, 5).map((loc, i) => {
                const max = stats.topLocations?.[0]?.alerts ?? 1;
                const pct = Math.round((loc.alerts / max) * 100);
                return (
                  <div key={loc.name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate">{loc.name}</span>
                        <span className="text-slate-400 ml-2 flex-shrink-0">{loc.alerts}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert types */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Loại cảnh báo (7 ngày qua)
            </h2>
            <div className="space-y-3">
              {(stats.alertTypes ?? []).map((t) => {
                const total = stats.alertTypes?.reduce((s, x) => s + x.value, 0) ?? 1;
                const pct = Math.round((t.value / total) * 100);
                return (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{t.name}</span>
                        <span className="text-slate-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/livestreams', label: 'Live Streams', icon: Camera, color: 'text-emerald-400' },
          { to: '/alertsdashboard', label: 'Alerts', icon: ShieldAlert, color: 'text-red-400' },
          { to: '/analytics', label: 'Analytics', icon: Activity, color: 'text-amber-400' },
          { to: '/chatbot', label: 'AI Assistant', icon: Zap, color: 'text-blue-400' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-600 transition group"
          >
            <Icon size={20} className={`${color} group-hover:scale-110 transition-transform`} />
            <span className="text-sm text-slate-300 font-medium">{label}</span>
            <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;

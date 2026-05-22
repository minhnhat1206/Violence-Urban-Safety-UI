import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  ShieldAlert, Activity, Video, AlertTriangle, MapPin, Clock, Zap, Database,
  RefreshCw, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// ── palette ────────────────────────────────────────────────────────────────
const INCIDENT_COLORS = {
  FIGHTING:  '#ef4444',
  SHOOTING:  '#f97316',
  STABBING:  '#eab308',
  ASSAULT:   '#ec4899',
  Unknown:   '#64748b',
  Anomaly:   '#94a3b8',
};
const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#ec4899', '#3b82f6', '#8b5cf6'];
const LAYER_CONFIG = {
  HOT:  { label: 'HOT · Fluss',   color: '#ef4444', targetMs: 100,   icon: Zap      },
  WARM: { label: 'WARM · Paimon', color: '#f97316', targetMs: 10000, icon: Database },
  COLD: { label: 'COLD · Iceberg',color: '#3b82f6', targetMs: 30000, icon: Database },
};

// ── helpers ────────────────────────────────────────────────────────────────
const useApiData = (url, fallback = null, interval = 0) => {
  const [data, setData]     = useState(fallback);
  const [status, setStatus] = useState('loading');
  const [ts, setTs]         = useState(Date.now());

  const refresh = useCallback(() => setTs(Date.now()), []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d  => { if (!cancelled) { setData(d); setStatus('ok'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [url, ts]);

  useEffect(() => {
    if (!interval) return;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [interval, refresh]);

  return { data, status, refresh };
};

const fmtNum = n => n == null ? '—' : Number(n).toLocaleString('vi-VN');
const fmtPct = n => n == null ? '—' : `${(n * 100).toFixed(1)}%`;
const fmtMs  = n => {
  if (n == null) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`;
};

const trend = (cur, target) => {
  if (cur == null) return <Minus size={14} className="text-slate-500" />;
  return cur <= target
    ? <TrendingDown size={14} className="text-emerald-400" />
    : <TrendingUp   size={14} className="text-red-400"     />;
};

// ── sub-components ─────────────────────────────────────────────────────────
const KPICard = ({ title, value, sub, icon: Icon, accent, loading }) => (
  <div className={`bg-slate-900/80 border rounded-xl p-5 flex flex-col gap-2 ${accent.border}`}>
    <div className="flex justify-between items-start">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className={`p-2 rounded-lg ${accent.iconBg}`}>
        <Icon size={16} className={accent.iconText} />
      </div>
    </div>
    <p className={`text-3xl font-bold ${accent.text}`}>
      {loading ? <span className="animate-pulse text-slate-600">…</span> : value}
    </p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);

const LayerCard = ({ layer, count, latencyMs, targetMs, color, icon: Icon, label }) => {
  const isHealthy = latencyMs != null;
  const aboveTarget = latencyMs > targetMs;
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3`}
         style={{ borderColor: `${color}33`, background: `${color}08` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        </div>
        <span className={`w-2 h-2 rounded-full ${isHealthy ? 'animate-pulse' : 'bg-slate-700'}`}
              style={{ background: isHealthy ? color : undefined }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-slate-500 mb-0.5">Rows</p>
          <p className="text-slate-200 font-mono font-bold">{fmtNum(count)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <p className="text-slate-500 mb-0.5">Latency</p>
          <p className={`font-mono font-bold ${aboveTarget ? 'text-amber-400' : 'text-emerald-400'}`}>
            {fmtMs(latencyMs)}
            {latencyMs != null && (
              <span className="ml-1">{trend(latencyMs, targetMs)}</span>
            )}
          </p>
        </div>
      </div>
      <div className="text-xs text-slate-500 flex justify-between">
        <span>SLA target</span>
        <span className="font-mono">{fmtMs(targetMs)}</span>
      </div>
      {latencyMs != null && (
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (latencyMs / targetMs) * 100)}%`,
              background: aboveTarget ? '#f59e0b' : color,
            }}
          />
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
      <p className="text-slate-300 font-mono mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, sub, icon: Icon, color = 'text-emerald-400', refreshFn, refreshing }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-white font-semibold flex items-center gap-2">
        <Icon size={16} className={color} />
        {title}
      </h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    {refreshFn && (
      <button
        onClick={refreshFn}
        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        title="Refresh"
      >
        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
      </button>
    )}
  </div>
);

const Offline = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
    <AlertTriangle size={32} className="text-amber-500" />
    <p className="text-sm">Backend offline — khởi động Docker stack để xem analytics thực.</p>
    <code className="text-xs bg-slate-800 px-3 py-1 rounded font-mono">
      docker compose -f docker/docker-compose.yml up -d
    </code>
  </div>
);

// ── main ───────────────────────────────────────────────────────────────────
const Analytics = () => {
  const { data: stats,       status: sStatus,  refresh: refreshStats  } = useApiData('/api/stats',        null, 60000);
  const { data: layers,      status: lStatus,  refresh: refreshLayers } = useApiData('/api/layer-counts', null, 30000);
  const { data: latency,     status: latStatus,refresh: refreshLatency} = useApiData('/api/latency',      null, 30000);
  const { data: incidents,   status: iStatus                           } = useApiData('/api/recent-incidents?limit=200', []);

  const offline = sStatus === 'error' && lStatus === 'error';
  const loading = sStatus === 'loading';

  // Derived KPIs
  const totalAlerts  = stats?.alertsPerHour?.reduce((s, x) => s + (x.alerts || 0), 0) ?? 0;
  const peakScore    = stats?.avgScore?.length
    ? Math.max(...stats.avgScore.map(x => x.score))
    : null;
  const topLocation  = stats?.topLocations?.[0]?.name ?? '—';
  const totalWarm    = layers?.warm ?? null;
  const totalCold    = layers?.cold ?? null;

  // Camera breakdown from recent incidents
  const cameraStats = React.useMemo(() => {
    if (!incidents?.length) return [];
    const map = {};
    incidents.forEach(i => {
      const cam = i.camera_id || 'Unknown';
      if (!map[cam]) map[cam] = { camera: cam, total: 0, violent: 0 };
      map[cam].total += 1;
      if ((i.violence_score ?? 0) >= 0.5) map[cam].violent += 1;
    });
    return Object.values(map).sort((a, b) => b.violent - a.violent).slice(0, 12);
  }, [incidents]);

  // Risk score distribution
  const riskBuckets = React.useMemo(() => {
    if (!incidents?.length) return [];
    const buckets = [
      { name: '0–25%', min: 0,    max: 0.25, count: 0, fill: '#22c55e' },
      { name: '25–50%',min: 0.25, max: 0.5,  count: 0, fill: '#eab308' },
      { name: '50–75%',min: 0.5,  max: 0.75, count: 0, fill: '#f97316' },
      { name: '75–90%',min: 0.75, max: 0.9,  count: 0, fill: '#ef4444' },
      { name: '90–100%',min: 0.9, max: 1.01, count: 0, fill: '#dc2626' },
    ];
    incidents.forEach(i => {
      const s = i.violence_score ?? 0;
      const b = buckets.find(bk => s >= bk.min && s < bk.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [incidents]);

  // Radar data for 24h vs 7d comparison placeholder
  const alertTypeData = stats?.alertTypes ?? [];
  const radarData = alertTypeData.map(t => ({
    subject: t.name,
    count: t.value,
    fullMark: Math.max(...alertTypeData.map(x => x.value), 1),
  }));

  const refreshAll = () => { refreshStats(); refreshLayers(); refreshLatency(); };
  const refreshing = loading;

  if (offline) return <Offline />;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Dữ liệu thực từ Streamhouse · Fluss / Paimon / Iceberg
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-sm transition"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Alerts (24h)"
          value={fmtNum(totalAlerts)}
          sub="từ Iceberg qua Trino"
          icon={ShieldAlert}
          loading={loading}
          accent={{ border: 'border-red-500/20', iconBg: 'bg-red-500/10', iconText: 'text-red-400', text: 'text-red-400' }}
        />
        <KPICard
          title="Peak Risk Score"
          value={peakScore != null ? fmtPct(peakScore) : '—'}
          sub="điểm rủi ro cao nhất"
          icon={Activity}
          loading={loading}
          accent={{ border: 'border-orange-500/20', iconBg: 'bg-orange-500/10', iconText: 'text-orange-400', text: 'text-orange-400' }}
        />
        <KPICard
          title="WARM (Paimon)"
          value={lStatus === 'loading' ? '…' : fmtNum(totalWarm)}
          sub="rows tổng lưu trữ"
          icon={Database}
          loading={lStatus === 'loading'}
          accent={{ border: 'border-amber-500/20', iconBg: 'bg-amber-500/10', iconText: 'text-amber-400', text: 'text-amber-400' }}
        />
        <KPICard
          title="COLD (Iceberg)"
          value={lStatus === 'loading' ? '…' : fmtNum(totalCold)}
          sub="rows lịch sử"
          icon={MapPin}
          loading={lStatus === 'loading'}
          accent={{ border: 'border-blue-500/20', iconBg: 'bg-blue-500/10', iconText: 'text-blue-400', text: 'text-blue-400' }}
        />
      </div>

      {/* ── Streamhouse Layer Health ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <SectionHeader
          title="Streamhouse 3-Layer Health"
          sub="Row counts + measured query latency vs SLA target"
          icon={Database}
          color="text-emerald-400"
          refreshFn={() => { refreshLayers(); refreshLatency(); }}
          refreshing={lStatus === 'loading' || latStatus === 'loading'}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LayerCard
            layer="hot"
            label="HOT · Fluss"
            count={layers?.hot}
            latencyMs={latency?.hot?.latency_ms}
            targetMs={100}
            color="#ef4444"
            icon={Zap}
          />
          <LayerCard
            layer="warm"
            label="WARM · Paimon"
            count={layers?.warm}
            latencyMs={latency?.warm?.latency_ms}
            targetMs={10000}
            color="#f97316"
            icon={Database}
          />
          <LayerCard
            layer="cold"
            label="COLD · Iceberg"
            count={layers?.cold}
            latencyMs={latency?.cold?.latency_ms}
            targetMs={30000}
            color="#3b82f6"
            icon={Database}
          />
        </div>
        {/* Latency comparison bar */}
        {latency && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-3">Latency comparison (measured vs target)</p>
            <div className="space-y-2">
              {[
                { key: 'hot',  label: 'HOT  · Fluss',   target: 100,   color: '#ef4444' },
                { key: 'warm', label: 'WARM · Paimon',  target: 10000, color: '#f97316' },
                { key: 'cold', label: 'COLD · Iceberg', target: 30000, color: '#3b82f6' },
              ].map(({ key, label, target, color }) => {
                const ms  = latency?.[key]?.latency_ms;
                const pct = ms != null ? Math.min(100, (ms / target) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="font-mono w-14 text-right" style={{ color }}>
                      {fmtMs(ms)}
                    </span>
                    <span className="text-slate-600 w-16 text-right">
                      / {fmtMs(target)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Alerts per Hour + Incident Types ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alerts per Hour time series */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Alerts Per Hour (24h)"
            sub="Tổng số cảnh báo từng giờ trong 24h qua"
            icon={Clock}
            color="text-red-400"
          />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.alertsPerHour ?? []}>
                <defs>
                  <linearGradient id="gAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval="preserveStartEnd" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="alerts" name="Alerts"
                  stroke="#ef4444" fill="url(#gAlerts)" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert types donut */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Loại Sự Cố"
            sub="Phân phối theo loại (7 ngày)"
            icon={ShieldAlert}
            color="text-orange-400"
          />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.alertTypes ?? []} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name"
                  paddingAngle={2}
                >
                  {(stats?.alertTypes ?? []).map((entry, i) => (
                    <Cell key={i}
                      fill={INCIDENT_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Camera Breakdown + Risk Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Camera incidents bar chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Incidents theo Camera"
            sub="Tổng / Bạo lực theo từng camera (dữ liệu thực-time)"
            icon={Video}
            color="text-amber-400"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cameraStats} layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.4} />
                <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                <YAxis dataKey="camera" type="category" stroke="#94a3b8" width={60} fontSize={10} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.3 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total"   name="Total"    fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="violent" name="Violent"  fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk score distribution */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Phân Phối Risk Score"
            sub="Số sự cố theo ngưỡng rủi ro"
            icon={Activity}
            color="text-red-400"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBuckets} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.3 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }}
                />
                <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]} barSize={40}>
                  {riskBuckets.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Hotspot Locations + Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top locations horizontal bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Điểm Nóng (Top Locations)"
            sub="Số sự cố theo địa điểm — 7 ngày qua"
            icon={MapPin}
            color="text-emerald-400"
          />
          <div className="space-y-2.5">
            {(stats?.topLocations ?? []).slice(0, 8).map((loc, i) => {
              const max = stats?.topLocations?.[0]?.alerts ?? 1;
              const pct = Math.round((loc.alerts / max) * 100);
              const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
              return (
                <div key={loc.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate">{loc.name}</span>
                      <span className="text-slate-400 ml-2 flex-shrink-0 font-mono">
                        {loc.alerts.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: colors[i] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident type radar */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <SectionHeader
            title="Radar — Loại Sự Cố"
            sub="So sánh tỷ lệ các loại cảnh báo (7 ngày)"
            icon={TrendingUp}
            color="text-blue-400"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar
                  name="Incidents"
                  dataKey="count"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Avg Risk Score Trend ── */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
        <SectionHeader
          title="Avg Risk Score Trend"
          sub="Điểm rủi ro trung bình theo ngày"
          icon={TrendingUp}
          color="text-blue-400"
        />
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.avgScore ?? []}>
              <defs>
                <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 1]}
                     tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              {/* Reference lines */}
              <Area
                type="monotone" dataKey="score" name="Avg Risk"
                stroke="#3b82f6" fill="url(#gScore)" strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Analytics;

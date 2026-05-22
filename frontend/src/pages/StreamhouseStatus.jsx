import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity, Zap, Database, Server, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Clock, BarChart2, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── polling hook ──────────────────────────────────────────────────────────
const usePollApi = (url, fallback, intervalMs = 15000) => {
  const [data, setData]     = useState(fallback);
  const [status, setStatus] = useState('loading');
  const [lastTs, setLastTs] = useState(null);

  const fetchNow = useCallback(() => {
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d  => { setData(d); setStatus('ok'); setLastTs(Date.now()); })
      .catch(() => setStatus('error'));
  }, [url]);

  useEffect(() => { fetchNow(); }, [fetchNow]);
  useEffect(() => {
    const id = setInterval(fetchNow, intervalMs);
    return () => clearInterval(id);
  }, [fetchNow, intervalMs]);

  return { data, status, lastTs, refresh: fetchNow };
};

// ── Flink jobs via REST ───────────────────────────────────────────────────
const useFlinkJobs = () => {
  const [jobs, setJobs]     = useState([]);
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState('loading');

  const fetchJobs = useCallback(async () => {
    try {
      const [ovRes, jobsRes] = await Promise.all([
        fetch('http://localhost:8081/overview'),
        fetch('http://localhost:8081/jobs'),
      ]);
      if (!ovRes.ok || !jobsRes.ok) throw new Error('HTTP error');
      const [ov, jd] = await Promise.all([ovRes.json(), jobsRes.json()]);

      // Enrich running jobs with vertex details
      const running = (jd.jobs || []).filter(j => j.status === 'RUNNING');
      const enriched = await Promise.all(
        running.map(async j => {
          try {
            const r = await fetch(`http://localhost:8081/jobs/${j.id}`);
            const d = await r.json();
            return { ...j, name: d.name || j.id, vertices: d.vertices || [] };
          } catch { return j; }
        })
      );

      setOverview(ov);
      setJobs([
        ...enriched,
        ...(jd.jobs || []).filter(j => j.status !== 'RUNNING').slice(0, 3),
      ]);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => {
    const id = setInterval(fetchJobs, 20000);
    return () => clearInterval(id);
  }, [fetchJobs]);

  return { jobs, overview, status, refresh: fetchJobs };
};

// ── helpers ───────────────────────────────────────────────────────────────
const fmtMs  = n => n == null ? '—' : n >= 1000 ? `${(n/1000).toFixed(1)}s` : `${n}ms`;
const fmtNum = n => n == null ? '—' : Number(n).toLocaleString('vi-VN');

const StatusDot = ({ status }) => {
  const map = {
    ok:      'bg-emerald-400 animate-pulse',
    error:   'bg-red-500',
    loading: 'bg-amber-400 animate-pulse',
    RUNNING: 'bg-emerald-400 animate-pulse',
    FINISHED:'bg-slate-500',
    FAILED:  'bg-red-500',
    CANCELED:'bg-slate-600',
    RESTARTING:'bg-amber-400 animate-pulse',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${map[status] ?? 'bg-slate-600'}`} />
  );
};

const ServiceRow = ({ label, url, status, value, sub, icon: Icon, color }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
    status === 'ok' ? 'border-emerald-500/15 bg-emerald-500/5'
    : status === 'error' ? 'border-red-500/15 bg-red-500/5'
    : 'border-slate-700 bg-slate-800/30'
  }`}>
    <div className={`p-2 rounded-lg ${
      status === 'ok' ? 'bg-emerald-500/10' : 'bg-slate-800'
    }`}>
      <Icon size={14} className={
        status === 'ok' ? 'text-emerald-400' : 'text-slate-500'
      } />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <StatusDot status={status} />
      </div>
      <p className="text-xs text-slate-500 truncate">{sub || url}</p>
    </div>
    {value != null && (
      <span className={`text-xs font-mono font-bold ${color ?? 'text-emerald-400'}`}>
        {value}
      </span>
    )}
  </div>
);

const LayerStatusCard = ({ label, layer, count, latencyMs, targetMs, color, icon: Icon }) => {
  const slaOk = latencyMs != null && latencyMs <= targetMs;
  return (
    <div className="bg-slate-900/80 border rounded-xl p-4"
         style={{ borderColor: `${color}25` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="font-semibold text-sm" style={{ color }}>{label}</span>
        </div>
        {latencyMs != null ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            slaOk
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {slaOk ? '✓ SLA' : '⚠ Above SLA'}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
            No data
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500 mb-0.5">Rows stored</p>
          <p className="text-white font-bold text-lg font-mono">{fmtNum(count)}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Query latency</p>
          <p className="text-white font-bold text-lg font-mono">{fmtMs(latencyMs)}</p>
        </div>
      </div>

      {latencyMs != null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>0</span>
            <span>SLA: {fmtMs(targetMs)}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
                 style={{
                   width: `${Math.min(100, (latencyMs / targetMs) * 100)}%`,
                   background: slaOk ? color : '#f59e0b',
                 }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── main ─────────────────────────────────────────────────────────────────
const StreamhouseStatus = () => {
  const { data: layers,  status: lSt,   lastTs: lTs,  refresh: rL } = usePollApi('/api/layer-counts', null, 30000);
  const { data: latency, status: latSt, lastTs: latTs,refresh: rLat}= usePollApi('/api/latency',      null, 30000);
  const { jobs, overview, status: fSt, refresh: rFlink }           = useFlinkJobs();

  const refreshAll = () => { rL(); rLat(); rFlink(); };
  const lastRefresh = Math.max(lTs || 0, latTs || 0);

  const runningJobs    = jobs.filter(j => j.status === 'RUNNING');
  const nonRunningJobs = jobs.filter(j => j.status !== 'RUNNING');

  // Service checklist
  const services = [
    { label: 'Chatbot API',         url: 'localhost:5002', status: lSt,   icon: Activity, value: '/api/layer-counts ✓' },
    { label: 'Flink JobManager',    url: 'localhost:8081', status: fSt,   icon: Zap,      value: overview ? `${overview['jobs-running']} jobs` : null },
    { label: 'Trino Coordinator',   url: 'localhost:8082', status: latSt, icon: Database, value: latSt === 'ok' ? 'Queries OK' : null },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Streamhouse Status</h1>
          <p className="text-sm text-slate-400 mt-1">Infrastructure health · HOT / WARM / COLD layers</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh > 0 && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} />
              {new Date(lastRefresh).toLocaleTimeString('vi-VN')}
            </span>
          )}
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-sm transition"
          >
            <RefreshCw size={13} className={lSt === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Flink Cluster Overview ── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Running Jobs',      value: overview['jobs-running'],   color: 'text-emerald-400', border: 'border-emerald-500/20' },
            { label: 'Task Slots Total',  value: overview['slots-total'],    color: 'text-blue-400',    border: 'border-blue-500/20'    },
            { label: 'Slots Available',   value: overview['slots-available'],color: 'text-amber-400',   border: 'border-amber-500/20'   },
            { label: 'Flink Version',     value: overview['flink-version'],  color: 'text-slate-300',   border: 'border-slate-700'      },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`bg-slate-900/80 border rounded-xl p-4 ${border}`}>
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className={`font-bold text-xl ${color}`}>{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Layer Status ── */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Database size={16} className="text-emerald-400" />
          Storage Layer Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LayerStatusCard
            label="HOT · Fluss"
            layer="hot"
            count={layers?.hot}
            latencyMs={latency?.hot?.latency_ms}
            targetMs={100}
            color="#ef4444"
            icon={Zap}
          />
          <LayerStatusCard
            label="WARM · Paimon"
            layer="warm"
            count={layers?.warm}
            latencyMs={latency?.warm?.latency_ms}
            targetMs={10000}
            color="#f97316"
            icon={Database}
          />
          <LayerStatusCard
            label="COLD · Iceberg"
            layer="cold"
            count={layers?.cold}
            latencyMs={latency?.cold?.latency_ms}
            targetMs={30000}
            color="#3b82f6"
            icon={Database}
          />
        </div>
      </div>

      {/* ── Flink Running Jobs ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Flink Jobs
          </h2>
          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
          >
            Flink UI <ArrowRight size={12} />
          </a>
        </div>

        {fSt === 'error' && (
          <p className="text-amber-500 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> Cannot reach Flink JobManager at localhost:8081
          </p>
        )}

        {runningJobs.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-500 uppercase font-medium mb-2">Running</p>
            {runningJobs.map(job => (
              <div key={job.id}
                   className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5">
                <StatusDot status="RUNNING" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-emerald-300 font-medium truncate">
                    {job.name || job.id}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{job.id.slice(0, 8)}…</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RUNNING
                </span>
              </div>
            ))}
          </div>
        )}

        {nonRunningJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase font-medium mb-2">Recent (finished/failed)</p>
            {nonRunningJobs.map(job => {
              const colorMap = {
                FINISHED: 'text-slate-400',
                FAILED:   'text-red-400',
                CANCELED: 'text-slate-500',
                RESTARTING:'text-amber-400',
              };
              return (
                <div key={job.id}
                     className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                  <StatusDot status={job.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-mono">{job.id.slice(0, 16)}…</p>
                  </div>
                  <span className={`text-xs ${colorMap[job.status] ?? 'text-slate-500'}`}>
                    {job.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Service Checklist ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Server size={16} className="text-blue-400" />
          Service Connectivity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {services.map(s => (
            <ServiceRow key={s.label} {...s} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'MinIO',          url: 'localhost:9001' },
            { label: 'Kafka',          url: 'localhost:19092' },
            { label: 'Fluss',          url: 'localhost:9123' },
            { label: 'Hive Metastore', url: 'localhost:9083' },
          ].map(({ label, url }) => (
            <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-slate-300 font-medium">{label}</p>
                <p className="text-slate-600">{url}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: 'http://localhost:8081',  label: 'Flink Web UI',    icon: Zap,       color: 'text-amber-400'   },
          { href: 'http://localhost:9001',  label: 'MinIO Console',   icon: Database,  color: 'text-blue-400'    },
          { href: 'http://localhost:3001',  label: 'Grafana',         icon: BarChart2, color: 'text-orange-400'  },
          { href: 'http://localhost:9090',  label: 'Prometheus',      icon: Activity,  color: 'text-red-400'     },
          { href: 'http://localhost:18085', label: 'Kafka UI',        icon: Server,    color: 'text-emerald-400' },
          { href: 'http://localhost:8082',  label: 'Trino UI',        icon: Database,  color: 'text-purple-400'  },
        ].map(({ href, label, icon: Icon, color }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-600 transition group"
          >
            <Icon size={16} className={`${color} group-hover:scale-110 transition-transform`} />
            <span className="text-sm text-slate-300 font-medium">{label}</span>
            <ArrowRight size={12} className="ml-auto text-slate-600 group-hover:text-slate-400 transition" />
          </a>
        ))}
      </div>

    </div>
  );
};

export default StreamhouseStatus;

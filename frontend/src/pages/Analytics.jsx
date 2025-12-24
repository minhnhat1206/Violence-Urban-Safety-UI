import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import {
  ShieldAlert, Video, Clock, Zap, BarChart3, Radio, MapPin, Activity
} from 'lucide-react';

/* ================= THẺ KPI (CHỈ SỐ CHÍNH) ================= */
const KPICard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl transition-all hover:border-slate-500/50">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-white mt-2 tabular-nums">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-inner`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const Analytics = () => {
  /* ---------- TRẠNG THÁI CHẾ ĐỘ XEM ---------- */
  const [viewMode, setViewMode] = useState('realtime'); // realtime | weekly
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- LẤY DỮ LIỆU TỪ BACKEND ---------- */
  const fetchAnalytics = () => {
    fetch('http://localhost:5000/api/v1/analytics')
      .then(res => res.json())
      .then(fetchedData => {
        // Sắp xếp dữ liệu theo thời gian tăng dần
        const sorted = fetchedData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setData(sorted);
        setLoading(false);
      })
      .catch(err => console.error('Lỗi lấy dữ liệu Bronze:', err));
  };

  useEffect(() => {
    if (viewMode === 'realtime') {
      fetchAnalytics();
      const i = setInterval(fetchAnalytics, 300000); // 5 phút cập nhật một lần
      return () => clearInterval(i);
    }
  }, [viewMode]);

  /* ---------- TÍNH TOÁN CÁC CHỈ SỐ KPI ---------- */
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, latency: 0, activeCams: 0, peakRisk: 0 };
    return {
      total: data.filter(d => d.is_violent).length,
      latency: Math.round(data.reduce((s, d) => s + (d.latency || 0), 0) / data.length),
      activeCams: new Set(data.map(d => d.camera_id)).size,
      peakRisk: Math.max(...data.map(d => d.risk_score || 0)).toFixed(2)
    };
  }, [data]);

  /* ---------- DỮ LIỆU RỦI RO TRUNG BÌNH CAMERA ---------- */
  const cameraRiskData = useMemo(() => {
    const camMap = {};
    data.forEach(item => {
      if (!camMap[item.camera_id]) camMap[item.camera_id] = { name: item.camera_id, sum: 0, count: 0 };
      camMap[item.camera_id].sum += item.raw_score || 0;
      camMap[item.camera_id].count += 1;
    });
    return Object.values(camMap)
      .map(c => ({ name: c.name, avgRisk: c.sum / c.count }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [data]);

  /* ---------- DỮ LIỆU ĐIỂM NÓNG THEO PHƯỜNG ---------- */
  const locationStats = useMemo(() => {
    const counts = {};
    data.forEach(item => {
      if (item.is_violent) {
        const loc = item.ward && item.ward !== 'Unknown' ? item.ward : (item.district || 'Khu vực chung');
        counts[loc] = (counts[loc] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [data]);

  const grafanaUrl = 'http://localhost:3001/d/violence-security-monitor/he-thong-giam-sat-an-ninh-do-thi-phan-tich-7-ngay?orgId=1&kiosk&from=now-7d&to=now';

  return (
    <div className="space-y-6 pb-10 min-h-screen bg-slate-950 p-4">
      {/* ===== HEADER & BỘ CHUYỂN ĐỔI ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">TRUNG TÂM PHÂN TÍCH</h2>
          <p className="text-xs text-slate-500 font-mono">Trạng thái: {viewMode === 'realtime' ? 'Đồng bộ tầng Bronze' : 'Đang phân tích tầng Gold'}</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setViewMode('realtime')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'realtime' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            <Radio size={14} /> THỜI GIAN THỰC
          </button>
          <button onClick={() => setViewMode('weekly')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            <BarChart3 size={14} /> XU HƯỚNG 7 NGÀY
          </button>
        </div>
      </div>

      {viewMode === 'realtime' && (
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* Hàng KPI chính */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Cảnh báo bạo lực" value={stats.total} icon={ShieldAlert} color="bg-red-500" />
            <KPICard title="Rủi ro cao nhất" value={stats.peakRisk} icon={Zap} color="bg-orange-500" />
            <KPICard title="Độ trễ hệ thống" value={`${stats.latency} ms`} icon={Clock} color="bg-blue-500" />
            <KPICard title="Nguồn Camera" value={stats.activeCams} icon={Video} color="bg-emerald-500" />
          </div>

          {/* Biểu đồ phần trên */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GIÁM SÁT LUỒNG BRONZE  */}
            <div className="lg:col-span-2 bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                  <Activity className="text-red-500" size={20} /> Giám sát luồng Bronze
                </h3>
                <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20 animate-pulse">TRỰC TIẾP</div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                      stroke="#475569" fontSize={10} axisLine={false} 
                    />
                    <YAxis domain={[0, 1]} stroke="#475569" fontSize={10} axisLine={false} />
                    <Tooltip 
                      labelFormatter={t => new Date(t).toLocaleString('vi-VN')}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="risk_score" 
                      name="Mức độ rủi ro"
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      fill="url(#riskGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHỈ SỐ RỦI RO TRUNG BÌNH CAMERA */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-2">
                   <Zap className="text-orange-500" size={20} /> Rủi ro TB theo Camera
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1">Chỉ số nguy hiểm trung bình của từng nguồn</p>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cameraRiskData} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" domain={[0, 1]} hide />
                    <YAxis dataKey="name" type="category" width={70} stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }} />
                    <Bar dataKey="avgRisk" name="Rủi ro TB" radius={[0, 10, 10, 0]} barSize={18}>
                      {cameraRiskData.map((e, i) => (
                        <Cell key={i} fill={e.avgRisk > 0.5 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Biểu đồ phần dưới */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ĐIỂM NÓNG THEO PHƯỜNG */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="text-emerald-500" size={18} /> Điểm nóng theo Phường
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationStats}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} />
                    <Tooltip cursor={{ fill: '#1e293b' }} />
                    <Bar dataKey="count" name="Số vụ việc" fill="#f59e0b" radius={[5, 5, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* THEO DÕI ĐỘ TRỄ */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <Clock className="text-blue-500" size={18} /> Độ trễ hệ thống (ms)
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="2 2" />
                    <XAxis hide />
                    <Tooltip labelFormatter={t => new Date(t).toLocaleString('vi-VN')} />
                    <Area type="monotone" dataKey="latency" name="Độ trễ" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHẾ ĐỘ XEM 7 NGÀY (GRAFANA) ===== */}
      {viewMode === 'weekly' && (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-700">
          <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <BarChart3 size={14} /> PHÂN TÍCH TẦNG GOLD (7 NGÀY QUA)
             </span>
             <button onClick={() => window.open(grafanaUrl, '_blank')} className="text-[10px] text-slate-500 hover:text-blue-400 font-bold uppercase transition-colors">Mở Dashboard ↗</button>
          </div>
          <div className="h-[900px]">
            <iframe src={grafanaUrl} width="100%" height="100%" frameBorder="0" title="Grafana Analytics" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
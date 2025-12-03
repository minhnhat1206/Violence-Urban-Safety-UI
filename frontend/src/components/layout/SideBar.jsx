import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Radio, Bell, BarChart2, MessageSquare, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Live Streams', path: '/livestreams', icon: Radio },
  { name: 'Alerts', path: '/alertsdashboard', icon: Bell },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Assistant', path: '/chatbot', icon: MessageSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];
const Sidebar = () => {
  return (
    // Giữ nguyên w-64, flex-col, h-full (do được bọc trong div cha)
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="flex items-center h-20 px-6 border-b border-slate-800">
        <Shield className="h-8 w-8 text-emerald-500" />
        <h1 className="text-xl font-bold ml-3 text-slate-100 tracking-tight">Vigilance AI</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold' // Bỏ shadow-inner
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3 transition-colors" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Đổi p-4 thành px-6 py-4 để căn chỉnh hợp lý hơn */}
      <div className="px-6 py-4 text-center border-t border-slate-800">
        <p className="text-xs text-slate-600">v2.4.0 Production Build</p>
      </div>
    </aside>
  );
};

export default Sidebar;
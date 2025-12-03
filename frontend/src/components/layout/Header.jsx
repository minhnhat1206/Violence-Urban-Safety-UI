import React from 'react';
import { Search, UserCircle } from 'lucide-react';

const Header = ({ currentPage }) => {
  return (
    // Bỏ h-20, bg-slate-950, border-b (để div cha trong App.jsx quản lý)
    <header className="flex items-center justify-between h-full px-8 flex-shrink-0">
      {/* Thêm một h2 trống để giữ layout nếu cần, hoặc nếu bạn có logic xác định currentPage */}
      {/* Nếu bạn không truyền currentPage, bạn có thể xóa dòng này hoặc dùng một tiêu đề mặc định */}
      <h2 className="text-2xl font-bold text-slate-100">{currentPage || ''}</h2> 

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Global Search..."
            className="w-64 bg-slate-800/80 border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <UserCircle className="h-8 w-8 text-slate-400" />
          <div>
            <p className="font-semibold text-slate-200">Admin</p>
            <p className="text-xs text-slate-500">Operator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
import { Outlet } from 'react-router-dom'
import './App.css'
import Header from './components/layout/Header'
import Sidebar from './components/layout/SideBar'

function App() {
  // Thống nhất w-64 cho Sidebar và h-20 cho Header.
  return (
    <div className="bg-slate-950 h-screen w-screen overflow-hidden">

      {/* SIDEBAR FIXED */}
      {/* Thay w-60 bằng w-64 */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-20">
        <Sidebar />
      </div>

      {/* CONTENT AREA */}
      {/* Thay ml-60 bằng ml-64 */}
      <div className="ml-64 flex flex-col h-full">

        {/* HEADER FIXED */}
        {/* Thay left-60 bằng left-64 */}
        {/* Thay h-16 bằng h-20 để khớp với Header.jsx */}
        <div className="fixed top-0 left-64 right-0 h-20 bg-slate-900 border-b border-slate-800 z-10">
          <Header />
        </div>

        {/* MAIN CONTENT */}
        {/* Thay mt-16 bằng mt-20 để bù đắp chiều cao h-20 của Header */}
        {/* Xóa max-w-screen-2xl mx-auto để nội dung chính chiếm toàn bộ không gian ngang còn lại */}
        <main className="mt-20 flex-1 overflow-y-auto px-8 py-6 font-primary">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default App
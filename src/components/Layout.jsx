import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Bot, Activity, Menu, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard },
  { to: '/projects', label: '项目', icon: FolderKanban },
  { to: '/agents', label: 'Agent', icon: Bot },
  { to: '/activity', label: '活动日志', icon: Activity },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:sticky top-0 inset-y-0 lg:inset-y-auto z-30 w-64 h-screen bg-white border-r border-gray-200/70 transform transition-transform duration-300 lg:transform-none flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {/* Logo 区 */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: 'var(--shadow-brand)' }}
            >
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-gray-900 tracking-tight">Agent Dashboard</h1>
              <p className="text-[10px] text-gray-400 font-medium">协作进度中心</p>
            </div>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航 */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">导航</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 底部信息 */}
        <div className="p-3 border-t border-gray-100">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3">
            <p className="text-xs font-semibold text-indigo-900">💡 小贴士</p>
            <p className="text-[11px] text-indigo-600/80 mt-1 leading-relaxed">
              Agent 完成任务后会自动上报到这里，无需手动维护。
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/70 flex items-center px-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-3 font-bold text-gray-900">🎯 Agent Dashboard</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

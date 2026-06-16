import { BellRing, ChefHat, ClipboardPenLine, Home, ListOrdered, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: '首页总览', icon: Home },
  { to: '/orders/new', label: '新建订单', icon: ClipboardPenLine },
  { to: '/orders/tracking', label: '订单跟踪', icon: ListOrdered },
  { to: '/operations', label: '食堂运营', icon: ChefHat },
  { to: '/admin', label: '后台管理', icon: Settings }
];

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Canteen Express</p>
            <h1 className="text-xl font-bold text-slate-900">智慧食堂配送平台</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 md:flex">
            <BellRing className="h-4 w-4" />
            <span>支持教师下单、食堂运营和后台配置的一体化管理</span>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, ChartColumn, ClipboardList, Settings2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';

function HomePage() {
  const [summary, setSummary] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        const [summaryResponse, menuResponse] = await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/menu-items', { params: { available: true } })
        ]);

        setSummary(summaryResponse.data);
        setMenuItems(menuResponse.data.slice(0, 6));
      } catch (requestError) {
        setError('首页数据加载失败，请确认后端服务已启动。');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const quickActions = [
    {
      title: '教师下单中心',
      description: '支持文本点单、语音转写、菜单勾选组合下单。',
      to: '/orders/new',
      icon: ClipboardList
    },
    {
      title: '订单履约跟踪',
      description: '查看历史订单、筛选状态、追踪配送流转。',
      to: '/orders/tracking',
      icon: ChartColumn
    },
    {
      title: '后台运营配置',
      description: '维护菜单、配送地址、营业状态和公告。',
      to: '/admin',
      icon: Settings2
    }
  ];

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">正在加载首页数据...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-2xl shadow-slate-300 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-200">一站式智慧食堂交付平台</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">把点单、履约、运营和后台配置统一到一个系统</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              目前系统已具备教师端下单、订单实时流转、运营看板、菜单管理、配送点管理和营业配置等核心能力，可直接作为校内配送业务的上线基础版本。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/orders/new" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                立即下单
              </Link>
              <Link to="/operations" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white hover:border-slate-400 hover:bg-slate-800">
                进入运营看板
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-slate-300">系统公告</p>
            <p className="mt-3 text-xl font-semibold">{summary?.settings?.announcement || '暂无公告'}</p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>营业时段</span>
                <span>{summary?.settings?.businessHours || '--'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>客服热线</span>
                <span>{summary?.settings?.supportPhone || '--'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>接单状态</span>
                <span>{summary?.settings?.acceptingOrders ? '正常接单' : '暂停接单'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="今日订单" value={summary?.todayOrders || 0} description="当天创建的订单总量" accent="indigo" />
        <MetricCard title="活跃订单" value={summary?.activeOrders || 0} description="当前仍在处理中的订单" accent="amber" />
        <MetricCard title="今日营收" value={formatCurrency(summary?.revenueToday || 0)} description="按订单金额实时累计" accent="emerald" />
        <MetricCard title="平均客单价" value={formatCurrency(summary?.averageTicket || 0)} description="便于评估运营效率" accent="sky" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="快速入口" description="覆盖教师、运营和后台三类核心角色。">
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link key={action.to} to={action.to} className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:border-indigo-200 hover:bg-indigo-50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    <span>进入模块</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="今日状态分布" description="帮助快速判断积压状态。">
          <div className="grid gap-3 sm:grid-cols-2">
            {['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map((status) => (
              <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={status} />
                  <span className="text-2xl font-bold text-slate-900">{summary?.statusCounts?.[status] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="近期订单" description="展示最近进入系统的订单记录。">
          <div className="space-y-3">
            {summary?.recentOrders?.length ? (
              summary.recentOrders.map((order) => (
                <div key={order._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {order.customerName} · {order.destination} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{formatCurrency(order.totalAmount)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                暂无订单数据。
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="菜单预览" description="当前可售菜品一览。">
          <div className="grid gap-3 sm:grid-cols-2">
            {menuItems.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-indigo-500">{item.category}</p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{item.badge || 'Menu'}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.description || '暂无描述'}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">{formatCurrency(item.price)}</span>
                  <span className="text-slate-500">预计 {item.preparationTime} 分钟</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export default HomePage;

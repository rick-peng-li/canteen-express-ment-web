import { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { formatCurrency, formatDate, formatDateTime } from '../lib/format';

function OrderTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [destination, setDestination] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaticData() {
      const [destinationResponse, summaryResponse] = await Promise.all([
        api.get('/api/destinations'),
        api.get('/api/dashboard/summary')
      ]);

      setDestinations(destinationResponse.data.filter((item) => item.isActive));
      setSummary(summaryResponse.data);
    }

    loadStaticData();
  }, []);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);

      try {
        const response = await api.get('/api/orders', {
          params: {
            page,
            limit: 8,
            search: search || undefined,
            status: status || undefined,
            destination: destination || undefined
          }
        });

        setOrders(response.data.items);
        setPagination(response.data.pagination);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [destination, page, search, status]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="历史订单总量" value={pagination.total || 0} description="根据当前筛选结果动态统计" accent="indigo" />
        <MetricCard title="今日订单" value={summary?.todayOrders || 0} description="与首页及运营看板实时同步" accent="sky" />
        <MetricCard title="当前活跃订单" value={summary?.activeOrders || 0} description="仍在处理中或待配送的订单" accent="amber" />
        <MetricCard title="今日营业额" value={formatCurrency(summary?.revenueToday || 0)} description="帮助评估食堂实时营收" accent="emerald" />
      </section>

      <SectionCard title="订单筛选" description="支持按订单号、下单人、状态和配送地点进行快速过滤。">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="搜索订单号 / 下单人"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
          >
            <option value="">全部状态</option>
            {['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
          >
            <option value="">全部配送点</option>
            {destinations.map((item) => (
              <option key={item._id} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('');
              setDestination('');
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
          >
            重置筛选
          </button>
        </div>
      </SectionCard>

      <SectionCard title="订单履约记录" description="查看每一笔订单的菜品明细、金额和状态时间线。">
        {loading ? (
          <div className="py-10 text-center text-slate-500">正在加载订单记录...</div>
        ) : orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{order.orderNumber}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                      <p>下单人：{order.customerName || '--'}</p>
                      <p>配送点：{order.destination}</p>
                      <p>下单时间：{formatDateTime(order.createdAt)}</p>
                      <p>联系方式：{order.phone || '--'}</p>
                    </div>
                    <p className="text-sm text-slate-500">原始订单：{order.rawText}</p>
                    {order.notes ? <p className="text-sm text-slate-500">备注：{order.notes}</p> : null}
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-sm text-slate-500">订单金额</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">菜品明细</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {order.parsedItems.map((item, index) => (
                        <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatCurrency((item.price || 0) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">状态时间线</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      {order.statusTimeline?.map((item, index) => (
                        <div key={`${item.status}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                          <span>{item.status}</span>
                          <span>{formatDateTime(item.at)}</span>
                        </div>
                      ))}
                      {!order.statusTimeline?.length ? <p className="text-slate-500">暂无时间线</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">
                第 {pagination.page} / {pagination.totalPages || 1} 页，共 {pagination.total} 条订单记录
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-slate-500">当前筛选条件下暂无订单记录。</div>
        )}
      </SectionCard>

      <SectionCard title="运营提示" description="面向上线场景的常用检查项。">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">每日巡检</p>
            <p className="mt-2 leading-6">建议开餐前检查菜单可售状态、配送点可用性和公告信息是否准确。</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">履约跟踪</p>
            <p className="mt-2 leading-6">若 Ready 状态长期堆积，可在运营页重点关注配送节点并追加提醒。</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">数据留痕</p>
            <p className="mt-2 leading-6">系统已记录状态时间线，可用于复盘峰值时段、投诉处理和 SLA 评估。</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default OrderTrackingPage;

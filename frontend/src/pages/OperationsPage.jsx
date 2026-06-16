import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import MetricCard from '../components/MetricCard';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { API_BASE_URL, api } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';

const nextStatusMap = {
  Pending: 'Confirmed',
  Confirmed: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Delivered'
};

function OperationsPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const [ordersResponse, summaryResponse] = await Promise.all([
        api.get('/api/orders/active'),
        api.get('/api/dashboard/summary')
      ]);

      setOrders(ordersResponse.data);
      setSummary(summaryResponse.data);
      setLoading(false);
    }

    bootstrap();

    const socket = io(API_BASE_URL);

    socket.on('new_order', (order) => {
      setOrders((current) => [...current, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    });

    socket.on('order_updated', (updatedOrder) => {
      setOrders((current) => {
        if (updatedOrder.status === 'Delivered' || updatedOrder.status === 'Cancelled') {
          return current.filter((item) => item._id !== updatedOrder._id);
        }

        return current.map((item) => (item._id === updatedOrder._id ? updatedOrder : item));
      });
    });

    socket.on('summary_updated', (incomingSummary) => {
      setSummary(incomingSummary);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const groupedOrders = useMemo(() => {
    return {
      Pending: orders.filter((item) => item.status === 'Pending'),
      Confirmed: orders.filter((item) => item.status === 'Confirmed'),
      Preparing: orders.filter((item) => item.status === 'Preparing'),
      Ready: orders.filter((item) => item.status === 'Ready')
    };
  }, [orders]);

  async function updateOrderStatus(id, status) {
    await api.patch(`/api/orders/${id}/status`, { status });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="活跃订单" value={summary?.activeOrders || orders.length} description="实时同步中的待处理订单数量" accent="amber" />
        <MetricCard title="今日订单" value={summary?.todayOrders || 0} description="当天累计订单量" accent="indigo" />
        <MetricCard title="可售菜品" value={summary?.availableMenuItems || 0} description="当前已开放销售的菜单条目" accent="sky" />
        <MetricCard title="今日营收" value={formatCurrency(summary?.revenueToday || 0)} description="便于运营值班快速掌握收入口径" accent="emerald" />
      </section>

      <SectionCard title="食堂运营看板" description="按订单状态分栏展示，适合厨房、打包和配送协同处理。">
        {loading ? (
          <div className="py-10 text-center text-slate-500">正在连接实时订单流...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {Object.entries(groupedOrders).map(([status, list]) => (
              <div key={status} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <StatusBadge status={status} />
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length ? (
                    list.map((order) => (
                      <div key={order._id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                            <p className="mt-1 text-sm text-slate-500">{order.customerName || 'Teacher'} · {order.destination}</p>
                          </div>
                          <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          {order.parsedItems.map((item, index) => (
                            <div key={`${order._id}-${index}`} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                              <span>{item.name} x {item.quantity}</span>
                              <span>{formatCurrency((item.price || 0) * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-500">
                          <span>预计出餐 {order.estimatedReadyMinutes || 15} 分钟</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                        </div>

                        {order.notes ? <p className="mt-3 text-sm text-slate-500">备注：{order.notes}</p> : null}

                        <div className="mt-4 flex gap-2">
                          {nextStatusMap[order.status] ? (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order._id, nextStatusMap[order.status])}
                              className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              更新为 {nextStatusMap[order.status]}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                            className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      当前暂无 {status} 状态订单。
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="值班提示" description="适用于正式上线后的运营协同。">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">峰值预警</p>
            <p className="mt-2 leading-6">当 Pending 和 Confirmed 同时增长时，建议提前增加打包窗口和配送人手。</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">实时协作</p>
            <p className="mt-2 leading-6">页面通过 Socket 实时同步，无需人工刷新，适合投屏值班或厨房屏幕常驻。</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">履约闭环</p>
            <p className="mt-2 leading-6">从 Pending 到 Delivered 的状态流已打通，便于形成完整业务留痕。</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default OperationsPage;

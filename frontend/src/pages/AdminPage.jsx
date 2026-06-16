import { useEffect, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';

const initialMenuForm = {
  name: '',
  category: 'Meals',
  price: 0,
  description: '',
  badge: '',
  preparationTime: 10
};

const initialDestinationForm = {
  name: '',
  code: '',
  contactPerson: '',
  deliveryFee: 0
};

function AdminPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    canteenName: '',
    announcement: '',
    supportPhone: '',
    businessHours: '',
    acceptingOrders: true,
    averagePrepMinutes: 15
  });
  const [menuForm, setMenuForm] = useState(initialMenuForm);
  const [destinationForm, setDestinationForm] = useState(initialDestinationForm);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  async function loadAdminData() {
    const [menuResponse, destinationResponse, settingsResponse] = await Promise.all([
      api.get('/api/menu-items'),
      api.get('/api/destinations'),
      api.get('/api/settings')
    ]);

    setMenuItems(menuResponse.data);
    setDestinations(destinationResponse.data);
    setSettingsForm({
      canteenName: settingsResponse.data.canteenName || '',
      announcement: settingsResponse.data.announcement || '',
      supportPhone: settingsResponse.data.supportPhone || '',
      businessHours: settingsResponse.data.businessHours || '',
      acceptingOrders: Boolean(settingsResponse.data.acceptingOrders),
      averagePrepMinutes: settingsResponse.data.averagePrepMinutes || 15
    });
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function showFeedback(type, text) {
    setFeedbackType(type);
    setFeedback(text);
  }

  async function handleCreateMenuItem(event) {
    event.preventDefault();

    try {
      await api.post('/api/menu-items', menuForm);
      setMenuForm(initialMenuForm);
      await loadAdminData();
      showFeedback('success', '菜单项创建成功。');
    } catch (error) {
      showFeedback('error', error.response?.data?.error || '菜单项创建失败。');
    }
  }

  async function handleCreateDestination(event) {
    event.preventDefault();

    try {
      await api.post('/api/destinations', {
        ...destinationForm,
        code: destinationForm.code.trim().toUpperCase().replace(/\s+/g, '_')
      });
      setDestinationForm(initialDestinationForm);
      await loadAdminData();
      showFeedback('success', '配送点创建成功。');
    } catch (error) {
      showFeedback('error', error.response?.data?.error || '配送点创建失败。');
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    try {
      await api.put('/api/settings', settingsForm);
      showFeedback('success', '系统配置已保存。');
    } catch (error) {
      showFeedback('error', error.response?.data?.error || '系统配置保存失败。');
    }
  }

  async function toggleMenuAvailability(item) {
    await api.patch(`/api/menu-items/${item._id}`, { isAvailable: !item.isAvailable });
    await loadAdminData();
  }

  async function deleteMenuItem(id) {
    await api.delete(`/api/menu-items/${id}`);
    await loadAdminData();
  }

  async function toggleDestination(item) {
    await api.patch(`/api/destinations/${item._id}`, { isActive: !item.isActive });
    await loadAdminData();
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            feedbackType === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600'
          ].join(' ')}
        >
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="系统配置" description="控制站点名称、营业时间、接单状态和通知公告。">
          <form className="space-y-4" onSubmit={handleSaveSettings}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>食堂名称</span>
                <input
                  value={settingsForm.canteenName}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, canteenName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>客服电话</span>
                <input
                  value={settingsForm.supportPhone}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, supportPhone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>营业时间</span>
                <input
                  value={settingsForm.businessHours}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, businessHours: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>平均出餐时长</span>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.averagePrepMinutes}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, averagePrepMinutes: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>系统公告</span>
              <textarea
                rows={4}
                value={settingsForm.announcement}
                onChange={(event) => setSettingsForm((current) => ({ ...current, announcement: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={settingsForm.acceptingOrders}
                onChange={(event) => setSettingsForm((current) => ({ ...current, acceptingOrders: event.target.checked }))}
              />
              是否允许新订单进入系统
            </label>
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              保存系统配置
            </button>
          </form>
        </SectionCard>

        <SectionCard title="新增配送点" description="为不同办公区域维护独立的配送配置。">
          <form className="space-y-4" onSubmit={handleCreateDestination}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>配送点名称</span>
                <input
                  value={destinationForm.name}
                  onChange={(event) => setDestinationForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>编码</span>
                <input
                  value={destinationForm.code}
                  onChange={(event) => setDestinationForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="例如：LIBRARY_BLOCK"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>联系人</span>
                <input
                  value={destinationForm.contactPerson}
                  onChange={(event) => setDestinationForm((current) => ({ ...current, contactPerson: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>配送费</span>
                <input
                  type="number"
                  min="0"
                  value={destinationForm.deliveryFee}
                  onChange={(event) => setDestinationForm((current) => ({ ...current, deliveryFee: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <button type="submit" className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              新增配送点
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {destinations.map((item) => (
              <div key={item._id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.code} · {item.contactPerson || '未设置联系人'} · 配送费 {formatCurrency(item.deliveryFee)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDestination(item)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-semibold',
                    item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  ].join(' ')}
                >
                  {item.isActive ? '停用配送点' : '启用配送点'}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="新增菜单项" description="支持上线后的菜单持续维护和价格调整。">
          <form className="space-y-4" onSubmit={handleCreateMenuItem}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>菜品名称</span>
                <input
                  value={menuForm.name}
                  onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>分类</span>
                <select
                  value={menuForm.category}
                  onChange={(event) => setMenuForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                >
                  {['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Desserts'].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>价格</span>
                <input
                  type="number"
                  min="0"
                  value={menuForm.price}
                  onChange={(event) => setMenuForm((current) => ({ ...current, price: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>标签</span>
                <input
                  value={menuForm.badge}
                  onChange={(event) => setMenuForm((current) => ({ ...current, badge: event.target.value }))}
                  placeholder="如：Popular"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>出餐时间</span>
                <input
                  type="number"
                  min="1"
                  value={menuForm.preparationTime}
                  onChange={(event) => setMenuForm((current) => ({ ...current, preparationTime: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>描述</span>
              <textarea
                rows={4}
                value={menuForm.description}
                onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <button type="submit" className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              新增菜单项
            </button>
          </form>
        </SectionCard>

        <SectionCard title="菜单管理" description="查看已上线菜单、价格和可售状态，支持快速上下架。">
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <StatusBadge status={item.isAvailable ? 'Ready' : 'Cancelled'} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{item.category} · {formatCurrency(item.price)} · {item.preparationTime} 分钟</p>
                    <p className="mt-2 text-sm text-slate-500">{item.description || '暂无描述'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleMenuAvailability(item)}
                      className={[
                        'rounded-full px-4 py-2 text-sm font-semibold',
                        item.isAvailable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      ].join(' ')}
                    >
                      {item.isAvailable ? '下架' : '上架'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMenuItem(item._id)}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default AdminPage;

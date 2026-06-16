import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, ShoppingCart, Sparkles } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';

function OrderCreatePage() {
  const [menuItems, setMenuItems] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [orderText, setOrderText] = useState('');
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isRecording, setIsRecording] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [transcribed, setTranscribed] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setMessage('');

      try {
        const [menuResponse, destinationResponse, settingsResponse] = await Promise.all([
          api.get('/api/menu-items', { params: { available: true } }),
          api.get('/api/destinations'),
          api.get('/api/settings')
        ]);

        const activeDestinations = destinationResponse.data.filter((item) => item.isActive);
        setMenuItems(menuResponse.data);
        setDestinations(activeDestinations);
        setSettings(settingsResponse.data);
        setDestination(activeDestinations[0]?.code || '');
      } catch (error) {
        setMessageType('error');
        setMessage('下单页面初始化失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  const groupedMenu = useMemo(() => {
    return menuItems.reduce((accumulator, item) => {
      const category = item.category || 'Other';
      accumulator[category] = accumulator[category] || [];
      accumulator[category].push(item);
      return accumulator;
    }, {});
  }, [menuItems]);

  const selectedItems = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
  }, [quantities]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, selection) => {
      const menuItem = menuItems.find((item) => item._id === selection.menuItemId);
      return sum + (menuItem?.price || 0) * selection.quantity;
    }, 0);
  }, [menuItems, selectedItems]);

  function updateQuantity(menuItemId, nextValue) {
    setQuantities((current) => ({
      ...current,
      [menuItemId]: Math.max(0, nextValue)
    }));
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessageType('info');
      setMessage('正在录音，请说出您的订单内容。');
    } catch (error) {
      setMessageType('error');
      setMessage('无法访问麦克风，请检查浏览器权限。');
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'order.webm');

      setMessageType('info');
      setMessage('正在进行语音转写，请稍候。');

      try {
        const response = await api.post('/api/transcribe', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setOrderText(response.data.text || '');
        setTranscribed(Boolean(response.data.text));
        setMessageType('success');
        setMessage('语音转写成功，您可以继续编辑后提交订单。');
      } catch (error) {
        setMessageType('error');
        setMessage(error.response?.data?.error || '语音转写失败，请改用文本或菜单下单。');
      }
    };

    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setCreatedOrder(null);
    setMessage('');

    try {
      const response = await api.post('/api/orders', {
        customerName,
        phone,
        destination,
        orderText,
        notes,
        selectedItems,
        source: transcribed ? 'voice' : orderText && selectedItems.length ? 'mixed' : orderText ? 'text' : 'catalog'
      });

      setCreatedOrder(response.data.order);
      setCustomerName('');
      setPhone('');
      setOrderText('');
      setNotes('');
      setQuantities({});
      setTranscribed(false);
      setMessageType('success');
      setMessage(`订单 ${response.data.order.orderNumber} 已成功提交。`);
    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.error || '订单提交失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">正在加载下单能力...</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="创建新订单" description="支持语音、文本和菜单组合下单，适合教师办公配送场景。">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>下单人姓名</span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="例如：张老师"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>联系电话</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="用于配送联系"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>配送地点</span>
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
            >
              {destinations.map((item) => (
                <option key={item._id} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">语音下单</p>
                <p className="mt-1 text-sm text-slate-500">点击开始录音，再点击结束录音即可自动转写。</p>
              </div>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={[
                  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white',
                  isRecording ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
                ].join(' ')}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? '结束录音' : '开始录音'}
              </button>
            </div>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>自然语言订单</span>
            <textarea
              value={orderText}
              onChange={(event) => {
                setOrderText(event.target.value);
                setTranscribed(false);
              }}
              rows={5}
              placeholder="例如：2杯奶茶、1份 Poha，送到 CS Dept Staffroom"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>补充备注</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="例如：少糖、提前电话联系"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </label>

          {message ? (
            <div
              className={[
                'rounded-2xl border px-4 py-3 text-sm',
                messageType === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : messageType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-600'
              ].join(' ')}
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !settings?.acceptingOrders || (!orderText.trim() && selectedItems.length === 0)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? '正在提交订单...' : settings?.acceptingOrders ? '提交订单' : '当前暂停接单'}
          </button>
        </form>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard
          title="菜单快捷点单"
          description="直接勾选菜品数量，系统会自动计算金额并合并到订单中。"
          actions={<div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">小计 {formatCurrency(subtotal)}</div>}
        >
          <div className="space-y-5">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{category}</p>
                <div className="space-y-3">
                  {items.map((item) => {
                    const quantity = quantities[item._id] || 0;

                    return (
                      <div key={item._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.description || '暂无描述'}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-700">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                            <button type="button" onClick={() => updateQuantity(item._id, quantity - 1)} className="h-8 w-8 rounded-full text-lg text-slate-600 hover:bg-slate-100">
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item._id, quantity + 1)} className="h-8 w-8 rounded-full text-lg text-slate-600 hover:bg-slate-100">
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="订单摘要" description="提交前再次核对菜单、金额与目标地址。">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>目标地址</span>
              <span className="font-semibold text-slate-900">{destinations.find((item) => item.code === destination)?.name || '--'}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>接单状态</span>
              <span className="font-semibold text-slate-900">{settings?.acceptingOrders ? '正常接单' : '暂停接单'}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>默认出餐时长</span>
              <span className="font-semibold text-slate-900">约 {settings?.averagePrepMinutes || 15} 分钟</span>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4">
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold">已选菜品</span>
              </div>
              <div className="space-y-2">
                {selectedItems.length ? (
                  selectedItems.map((selection) => {
                    const item = menuItems.find((menuItem) => menuItem._id === selection.menuItemId);
                    return (
                      <div key={selection.menuItemId} className="flex items-center justify-between">
                        <span>{item?.name || '未知菜品'} x {selection.quantity}</span>
                        <span>{formatCurrency((item?.price || 0) * selection.quantity)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500">暂未选择菜单菜品，可仅提交文本订单。</p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {createdOrder ? (
          <SectionCard title="提交结果" description="订单创建成功后可复制单号并前往跟踪页查看。">
            <div className="space-y-3 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-700">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                订单已创建
              </div>
              <p>订单编号：{createdOrder.orderNumber}</p>
              <p>订单金额：{formatCurrency(createdOrder.totalAmount)}</p>
              <p>当前状态：{createdOrder.status}</p>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}

export default OrderCreatePage;

export function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) {
    return '--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function getStatusClasses(status) {
  const styles = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Confirmed: 'bg-sky-100 text-sky-700 border-sky-200',
    Preparing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Delivered: 'bg-slate-100 text-slate-700 border-slate-200',
    Cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

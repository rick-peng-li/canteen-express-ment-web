import { getStatusClasses } from '../lib/format';

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
      {status}
    </span>
  );
}

export default StatusBadge;

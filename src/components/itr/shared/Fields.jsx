export function NumField({ label, value, onChange, hint, max, placeholder = '0' }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number" min="0" max={max} step="1"
        value={value || ''}
        placeholder={placeholder}
        onChange={e => onChange(Math.min(max ?? Infinity, Math.max(0, Number(e.target.value) || 0)))}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer mb-3 select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  );
}

export function Box({ type = 'info', children }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed mb-3 ${styles[type]}`}>
      {children}
    </div>
  );
}

export function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">{children}</div>;
}

/* Premium form components — Indian Tax Agent design system */

const NAVY   = '#0D1B2A';
const GOLD   = '#F5A623';
const BORDER = '#D8DEE8';

export function NumField({ label, value, onChange, hint, max, placeholder = '0' }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
        style={{ color: '#6B7A99', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
          style={{ color: '#9AAABB', pointerEvents: 'none' }}>₹</span>
        <input
          type="number" min="0" max={max} step="1"
          value={value || ''}
          placeholder={placeholder}
          onChange={e => onChange(Math.min(max ?? Infinity, Math.max(0, Number(e.target.value) || 0)))}
          className="w-full rounded-xl pl-7 pr-4 py-2.5 text-sm font-semibold tabular transition-all"
          style={{
            background: '#F7F9FC',
            border: `1.5px solid ${BORDER}`,
            color: NAVY,
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(245,166,35,0.12)`; }}
          onBlur={e  => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
        />
      </div>
      {hint && <p className="text-xs mt-1.5" style={{ color: '#9AAABB' }}>{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer mb-4 select-none group">
      <div
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 rounded-full transition-all duration-200"
        style={{
          width: 44, height: 24,
          background: checked ? GOLD : '#D1D9E6',
          boxShadow: checked ? `0 0 0 3px rgba(245,166,35,0.18)` : 'none',
        }}
      >
        <span
          className="absolute top-1 rounded-full shadow-sm transition-all duration-200"
          style={{
            left: 4, width: 16, height: 16,
            background: 'white',
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </div>
      <span className="text-sm font-medium" style={{ color: '#374151' }}>{label}</span>
    </label>
  );
}

const SECTION_COLORS = {
  profile:    { border: '#F5A623', icon: '👤' },
  income:     { border: '#3B82F6', icon: '💼' },
  deductions: { border: '#00B37E', icon: '📉' },
  compare:    { border: '#8B5CF6', icon: '⚖️' },
  filing:     { border: '#0D1B2A', icon: '📋' },
  dates:      { border: '#F5A623', icon: '📅' },
  saved:      { border: '#6366F1', icon: '💾' },
  default:    { border: '#CBD5E1', icon: '' },
};

export function Section({ title, children, accent }) {
  const key = accent || (['profile','income','deduction','compare','filing','dates','saved'].find(k => title?.toLowerCase().includes(k)) || 'default');
  const { border } = SECTION_COLORS[key] || SECTION_COLORS.default;

  return (
    <div className="rounded-2xl mb-5"
      style={{
        background: 'white',
        border: '1.5px solid #E8EDF4',
        borderLeft: `4px solid ${border}`,
        boxShadow: '0 1px 4px rgba(13,27,42,0.05), 0 4px 16px rgba(13,27,42,0.04)',
      }}>
      <div className="px-5 pt-4 pb-1">
        <h3 className="text-sm font-bold mb-3 pb-2.5"
          style={{ color: NAVY, borderBottom: '1.5px solid #F0F4FA', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

export function Box({ type = 'info', children }) {
  const styles = {
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: 'ℹ' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', icon: '✓' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '⚠' },
    danger:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '✕' },
  };
  const s = styles[type] || styles.info;
  return (
    <div className="rounded-xl flex gap-2.5 mb-4"
      style={{ background: s.bg, border: `1.5px solid ${s.border}`, padding: '10px 14px' }}>
      <span className="flex-shrink-0 text-xs font-bold mt-0.5" style={{ color: s.color }}>{s.icon}</span>
      <p className="text-xs leading-relaxed" style={{ color: s.color }}>{children}</p>
    </div>
  );
}

export function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">{children}</div>;
}

/* Reusable stat card for Compare / Summary */
export function StatCard({ label, value, sub, accent = '#0D1B2A', glow = false }) {
  return (
    <div className={`rounded-2xl p-4 text-center ${glow ? 'glow-gold' : ''}`}
      style={{ background: accent + '10', border: `1.5px solid ${accent}25` }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accent, opacity: 0.7 }}>{label}</div>
      <div className="text-2xl font-black tabular leading-none" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: accent, opacity: 0.6 }}>{sub}</div>}
    </div>
  );
}

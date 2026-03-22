import React, { useEffect } from 'react';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...modalStyle, maxWidth: width }}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: '#f1f5f9', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: '0 28px 28px' }}>{children}</div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const modalStyle = { background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeUp 0.25s ease' };
const modalHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const closeBtn = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.9rem', color: '#94a3b8', width: 34, height: 34, borderRadius: 10, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' };


// ─── FORM COMPONENTS ──────────────────────────────────────────────────────────
export function FormGrid({ children, cols = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 4 }}>{children}</div>;
}
export function FormGroup({ label, full, children, hint }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{hint}</span>}
    </div>
  );
}
export function Input({ ...props }) {
  return <input {...props} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(30,41,59,0.5)', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s', ...props.style }} onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />;
}
export function Select({ children, ...props }) {
  return <select {...props} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(30,41,59,0.5)', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s', ...props.style }} onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}>
    <style>{`select option { background: #1e293b; color: #f1f5f9; }`}</style>
    {children}
  </select>;
}
export function Textarea({ ...props }) {
  return <textarea {...props} rows={3} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(30,41,59,0.5)', color: '#f1f5f9', outline: 'none', resize: 'vertical', transition: 'all 0.2s', ...props.style }} onFocus={e => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />;
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  primary:  { background: '#6366f1', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', border: 'none' },
  accent:   { background: '#6366f1', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', border: 'none' },
  danger:   { background: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', border: 'none' },
  warn:     { background: '#f59e0b', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.2)', border: 'none' },
  outline:  { background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.12)' },
  ghost:    { background: 'transparent', color: '#94a3b8', border: 'none' },
  blue:     { background: '#6366f1', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', border: 'none' },
  dark:     { background: '#f1f5f9', color: '#0f172a', border: 'none' },
};
export function Btn({ variant = 'primary', size = 'md', children, icon, ...props }) {
  const szStyle = size === 'sm' ? { padding: '6px 14px', fontSize: '0.78rem', borderRadius: 8 } : { padding: '10px 20px', fontSize: '0.875rem', borderRadius: 12 };
  return (
    <button {...props} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s', ...szStyle, ...BTN_STYLES[variant], ...props.style }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  ok:      { background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' },
  warn:    { background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.2)' },
  danger:  { background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' },
  info:    { background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' },
  neutral: { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' },
  primary: { background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' },
};
export function Badge({ variant = 'neutral', children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase', ...BADGE_STYLES[variant] }}>{children}</span>;
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty, toolbar }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.37)' }}>
      {toolbar && <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{toolbar}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(30,41,59,0.5)' }}>{headers.map((h, i) => <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div style={{ padding: 40, textAlign: 'center' }}>{empty}</div>}
    </div>
  );
}
export function Tr({ children, onClick }) {
  return <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = ''}>{children}</tr>;
}
export function Td({ children, ...props }) {
  return <td {...props} style={{ padding: '14px 20px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle', color: '#e2e8f0', ...props.style }}>{children}</td>;
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.37)', padding: 24, ...style }}>{children}</div>;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color, icon }) {
  const colors = { green: '#059669', blue: '#0284c7', warn: '#ca8a04', danger: '#dc2626', purple: '#7c3aed', orange: '#ea580c' };
  const c = colors[color] || colors.blue;
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.37)', padding: '24px 28px', position: 'relative', overflow: 'hidden', animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: c, marginTop: 10, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 460 }}>
      <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 14, border: 'none', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', fontSize: '0.9rem', fontFamily: 'inherit', background: 'rgba(30,41,59,0.5)', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
        onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #818cf8'; }}
        onBlur={e => { e.target.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1)'; }} />
    </div>
  );
}

// ─── CONFIRM DIALOG (ENHANCED) ────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, message = 'Confirmer cette action ?', title, variant = 'warning', confirmLabel, cancelLabel = 'Annuler', icon }) {
  const variants = {
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: icon || '⚠️', title: title || 'Attention', btnVariant: 'primary' },
    danger:  { color: '#e63946', bg: 'rgba(230,57,70,0.08)',  icon: icon || '🚨', title: title || 'Action dangereuse', btnVariant: 'danger' },
    info:    { color: '#0079c1', bg: 'rgba(0,121,193,0.08)',  icon: icon || 'ℹ️', title: title || 'Confirmation', btnVariant: 'primary' },
    success: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  icon: icon || '✅', title: title || 'Confirmer', btnVariant: 'primary' },
  };
  const v = variants[variant] || variants.warning;
  return (
    <Modal open={open} onClose={onClose} title={`${v.icon} ${v.title}`} width={420}>
      <div style={{
        padding: '14px 16px', background: v.bg, border: `1px solid ${v.color}20`,
        borderRadius: 10, marginBottom: 20, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6,
      }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="outline" onClick={onClose}>{cancelLabel}</Btn>
        <Btn variant={v.btnVariant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel || 'Confirmer'}</Btn>
      </div>
    </Modal>
  );
}

// ─── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────────
const TOAST_STYLES = {
  success: { bg: 'rgba(15,23,42,0.95)', icon: '✅', border: '#22c55e', text: '#4ade80' },
  error:   { bg: 'rgba(15,23,42,0.95)', icon: '❌', border: '#ef4444', text: '#f87171' },
  warning: { bg: 'rgba(15,23,42,0.95)', icon: '⚠️', border: '#f59e0b', text: '#fbbf24' },
  info:    { bg: 'rgba(15,23,42,0.95)', icon: 'ℹ️', border: '#6366f1', text: '#a5b4fc' },
};

let _toastId = 0;
let _toastSetState = null;

export function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => { _toastSetState = setToasts; return () => { _toastSetState = null; }; }, []);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div key={t.id} style={{
            background: s.bg, borderLeft: `4px solid ${s.border}`, border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 20px', color: s.text || '#e2e8f0', fontSize: '0.88rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)', minWidth: 280, maxWidth: 420, backdropFilter: 'blur(16px)',
            animation: 'slideInRight 0.3s ease', display: 'flex', alignItems: 'center', gap: 10,
            pointerEvents: 'auto', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function toast(message, type = 'success', duration = 3000) {
  if (!_toastSetState) return;
  const id = ++_toastId;
  _toastSetState(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    if (_toastSetState) _toastSetState(prev => prev.filter(t => t.id !== id));
  }, duration);
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function Empty({ icon = '📦', message = 'Aucun élément trouvé', action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: '#94a3b8' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: '0.9rem', marginBottom: action ? 16 : 0, color: '#64748b' }}>{message}</p>
      {action}
    </div>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '2rem', color: '#f1f5f9', margin: 0, letterSpacing: '-0.025em' }}>{title}</h1>
        {subtitle && <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.95rem', maxWidth: 560 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

// ─── TOOLBAR (deprecated, replaced by toolbar prop in Table) ───
export function Toolbar({ children }) {
  return <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>{children}</div>;
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
export function SectionCard({ title, children, action }) {
  return (
    <Card>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.05rem', color: '#f1f5f9' }}>{title}</span>
        {action}
      </div>
      {children}
    </Card>
  );
}

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
// GlobalStyles extracted to GlobalStyles.jsx to fix React Fast Refresh lint errors

import React, { useState, useEffect, useRef } from 'react';

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
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: '0 28px 28px' }}>{children}</div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'var(--glass-blur)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const modalStyle = { background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderRadius: 16, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeUp 0.2s ease' };
const modalHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px', borderBottom: '1px solid var(--border-color)' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'color 0.15s' };

// ─── FORM COMPONENTS ──────────────────────────────────────────────────────────
export function FormGrid({ children, cols = 2 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 4 }}>{children}</div>;
}
export function FormGroup({ label, full, children, hint }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}
export function Input({ ...props }) {
  return <input {...props} style={{ padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', transition: 'all 0.15s', ...props.style }} onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }} />;
}
export function Select({ children, ...props }) {
  return <select {...props} style={{ padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', ...props.style }} onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}>
    {/* Option elements inherit color but to avoid unreadable native dropdowns on some OS, we set style here */}
    <style>{`select option { background: var(--bg-card); color: var(--text-main); }`}</style>
    {children}
  </select>;
}
export function Textarea({ ...props }) {
  return <textarea {...props} rows={3} style={{ padding: '9px 13px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', resize: 'vertical', transition: 'all 0.15s', ...props.style }} onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }} />;
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
const BTN_STYLES = {
  primary:  { background: 'linear-gradient(135deg, #38bdf8, #2563eb)', color: '#fff', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)', border: '1px solid rgba(255,255,255,0.1)' },
  accent:   { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)', border: '1px solid rgba(255,255,255,0.1)' },
  danger:   { background: 'linear-gradient(135deg, #f43f5e, #be123c)', color: '#fff', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)', border: '1px solid rgba(255,255,255,0.1)' },
  warn:     { background: 'linear-gradient(135deg, #f59e0b, #b45309)', color: '#fff', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)', border: '1px solid rgba(255,255,255,0.1)' },
  outline:  { background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' },
  ghost:    { background: 'transparent', color: 'var(--text-muted)' },
  blue:     { background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)', color: '#fff', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)', border: '1px solid rgba(255,255,255,0.1)' },
};
export function Btn({ variant = 'primary', size = 'md', children, icon, ...props }) {
  const szStyle = size === 'sm' ? { padding: '5px 12px', fontSize: '0.78rem', borderRadius: 7 } : { padding: '9px 18px', fontSize: '0.875rem', borderRadius: 9 };
  return (
    <button {...props} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'opacity 0.15s, transform 0.1s', ...szStyle, ...BTN_STYLES[variant], ...props.style }}
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
  ok:      { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' },
  warn:    { background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)' },
  danger:  { background: 'rgba(244, 63, 94, 0.15)', color: '#e11d48', border: '1px solid rgba(244, 63, 94, 0.2)' },
  info:    { background: 'rgba(56, 189, 248, 0.15)', color: '#0ea5e9', border: '1px solid rgba(56, 189, 248, 0.2)' },
  neutral: { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' },
};
export function Badge({ variant = 'neutral', children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.3px', ...BADGE_STYLES[variant] }}>{children}</span>;
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--bg-card)' }}>
          <tr>{headers.map((h, i) => <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export function Tr({ children, onClick }) {
  return <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined, transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--table-hover)'} onMouseLeave={e => e.currentTarget.style.background = ''}>{children}</tr>;
}
export function Td({ children, ...props }) {
  return <td {...props} style={{ padding: '12px 16px', fontSize: '0.855rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle', color: 'var(--text-main)', ...props.style }}>{children}</td>;
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', ...style }}>{children}</div>;
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color, icon }) {
  const colors = { green: '#10b981', blue: '#38bdf8', warn: '#f59e0b', danger: '#f43f5e', purple: '#8b5cf6' };
  const c = colors[color] || colors.blue;
  return (
    <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c, boxShadow: `0 0 10px ${c}` }} />
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', color: 'var(--text-main)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
      {icon && <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.1, fontSize: '4rem' }}>{icon}</div>}
    </div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', paddingLeft: 36, padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.85rem', fontFamily: 'inherit', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s' }} onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }} />
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, message = 'Confirmer cette action ?' }) {
  return (
    <Modal open={open} onClose={onClose} title="⚠️ Confirmation" width={380}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 24px' }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="outline" onClick={onClose}>Annuler</Btn>
        <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>Confirmer</Btn>
      </div>
    </Modal>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function Empty({ icon = '📦', message = 'Aucun élément trouvé', action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.6 }}>{icon}</div>
      <p style={{ fontSize: '0.9rem', marginBottom: action ? 16 : 0, color: 'var(--text-muted)' }}>{message}</p>
      {action}
    </div>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export function PageHeader({ title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

// ─── TOOLBAR ──────────────────────────────────────────────────────────────────
export function Toolbar({ children }) {
  return <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>{children}</div>;
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
export function SectionCard({ title, children, action }) {
  return (
    <Card>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</span>
        {action}
      </div>
      {children}
    </Card>
  );
}

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
export function GlobalStyles() {
  return (
    <style>{`
      :root {
        /* LIGHT THEME (Minimal & Neumorphic) */
        --bg-page: #f0f4f8;
        --bg-card: #ffffff;
        --bg-sidebar: #0a2540;
        --bg-overlay: rgba(10,37,64,0.5);
        --text-main: #0a2540;
        --text-muted: #6b7c93;
        --text-inverse: #ffffff;
        --border-color: #e5edf5;
        --border-light: #d0dce8;
        --input-bg: #f8fafc;
        --table-hover: #f8fafc;
        --scrollbar-track: #f0f4f8;
        --scrollbar-thumb: #c8d5e3;
        --card-shadow: 0 2px 12px rgba(10,37,64,0.07);
        --glass-blur: blur(0px);
      }

      [data-theme='dark'] {
        /* DARK THEME (Glassmorphism) */
        --bg-page: radial-gradient(circle at top, #1e293b, #020617);
        --bg-card: rgba(30, 41, 59, 0.45);
        --bg-sidebar: rgba(15, 23, 42, 0.45);
        --bg-overlay: rgba(2, 6, 23, 0.75);
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --text-inverse: #f8fafc;
        --border-color: rgba(255,255,255,0.08);
        --border-light: rgba(255,255,255,0.1);
        --input-bg: rgba(30, 41, 59, 0.5);
        --table-hover: rgba(255,255,255,0.04);
        --scrollbar-track: rgba(0,0,0,0.1);
        --scrollbar-thumb: rgba(255,255,255,0.15);
        --card-shadow: 0 8px 32px rgba(0,0,0,0.4);
        --glass-blur: blur(16px);
      }

      *, *::before, *::after { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Inter', sans-serif;
        background: var(--bg-page);
        color: var(--text-main);
        min-height: 100vh;
        transition: background 0.3s ease, color 0.3s ease;
      }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; border: 2px solid transparent; background-clip: content-box; }
      ::-webkit-scrollbar-thumb:hover { background-color: var(--text-muted); border-width: 1px; }
      input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      [data-theme='dark'] input[type=number]::-webkit-inner-spin-button { filter: invert(0.8); }
    `}</style>
  );
}

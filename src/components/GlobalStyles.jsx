import React from 'react';

export function GlobalStyles() {
  return (
    <style>{`
      :root {
        /* DARK THEME — Default (Glassmorphism) */
        --bg-page: #0b1121;
        --bg-card: rgba(17, 27, 52, 0.75);
        --bg-sidebar: rgba(15, 23, 42, 0.8);
        --bg-overlay: rgba(2, 6, 23, 0.75);
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --text-inverse: #f8fafc;
        --border-color: rgba(255,255,255,0.06);
        --border-light: rgba(255,255,255,0.08);
        --input-bg: rgba(30, 41, 59, 0.5);
        --table-hover: rgba(255,255,255,0.04);
        --scrollbar-track: rgba(0,0,0,0.1);
        --scrollbar-thumb: rgba(255,255,255,0.15);
        --card-shadow: 0 8px 32px rgba(0,0,0,0.4);
        --glass-blur: blur(16px);
        --accent: #a855f7;
        --accent-alt: #3b82f6;
      }

      [data-theme='light'] {
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
        --accent: #6366f1;
        --accent-alt: #3b82f6;
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

      /* ─── Cartes d'export : hover CSS (remplace le JS onMouseEnter) ─── */
      .export-card-hover { transition: all 0.25s ease; }
      .export-card-hover:hover {
        transform: translateY(-2px);
        border-color: var(--hover-color) !important;
        box-shadow: 0 8px 24px var(--hover-shadow);
      }
    `}</style>

  );
}

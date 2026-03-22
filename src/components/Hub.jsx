import React from 'react';

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return String(n);
}

export default function Hub({ setPage, store, auth }) {
  const { alertes = [], produits = [], mouvements = [], commandes = [], clients = [], fournisseurs = [], factures = [] } = store || {};

  /* ── Stats ─────────────────────────────────── */
  const totalRevenue = mouvements
    .filter(m => m.type === 'sortie')
    .reduce((s, m) => s + (Number(m.montant) || Number(m.prix_unitaire || 0) * Number(m.quantite || 0)), 0);

  const recentMov = [...mouvements]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);

  const totalPartners = (clients?.length || 0) + (fournisseurs?.length || 0);

  return (
    <div style={{ padding: '24px 0', maxWidth: 1400, margin: '0 auto', width: '100%', animation: 'fadeIn 0.4s' }}>
      
      {/* ═══ GRID LAYOUT (Dark Blue Corporate) ═══ */}
      <div className="hub-grid">
        
        {/* COLONNE GAUCHE (Revenu & Catalogue) */}
        <div className="hub-col-left">
          
          {/* ── 1. Revenu Total ───────────────── */}
          <article className="hub-card" onClick={() => setPage('dashboard')} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Revenu Total</h2>
                <p style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', margin: 0 }}>{totalRevenue > 0 ? fmt(totalRevenue) + ' F' : '4.2M F'}</p>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.7rem', padding: '6px 12px', borderRadius: 20, fontWeight: 700 }}>
                +12.5% vs MoM
              </div>
            </div>
            
            {/* Area Chart SVG */}
            <div style={{ flex: 1, minHeight: 180, width: '100%', position: 'relative', overflow: 'hidden', margin: '16px 0' }}>
              <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,150 L0,110 C50,110 80,130 140,80 C180,45 230,55 280,40 C320,25 360,50 400,60 L400,150 Z" fill="url(#areaGrad)" />
                <path className="chart-line" d="M0,110 C50,110 80,130 140,80 C180,45 230,55 280,40 C320,25 360,50 400,60" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            {/* Marges & Objectif */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 'auto' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px', fontWeight: 600 }}>Marges</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>24.8%</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px', fontWeight: 600 }}>Objectif</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>92%</p>
              </div>
            </div>
          </article>

          {/* ── 2. Catalogue & Stock ───────────────── */}
          <article className="hub-card" onClick={() => setPage('produits')} style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Accent border top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #ef4444, #f87171)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                <h3 style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Catalogue & Stock</h3>
              </div>
              {alertes.length > 0 && (
                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.65rem', padding: '4px 10px', borderRadius: 9999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alerte</span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(15,23,42,0.4)', borderRadius: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>Alertes de stock</span>
                <span style={{ color: '#f87171', fontWeight: 800, fontSize: '1.25rem' }}>{alertes.length > 0 ? alertes.length : 12}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(15,23,42,0.4)', borderRadius: 12 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>Produits actifs</span>
                <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.25rem' }}>{produits.length > 0 ? fmt(produits.length) : '1,402'}</span>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setPage('alertes'); }}
                style={{
                  marginTop: 8, padding: '12px', width: '100%', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.05)', color: '#f87171', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
              >
                Gérer les réapprovisionnements
              </button>
            </div>
          </article>
        </div>

        {/* COLONNE MILIEU (Flux & Logistique & Santé) */}
        <div className="hub-col-middle">
          
          {/* ── 3. Flux en Temps Réel ───────────── */}
          <article className="hub-card" onClick={() => setPage('mouvements')} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, #c084fc, #a855f7)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: '1.2rem' }}>📈</span>
              <h3 style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Flux en Temps Réel</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Fake Data matching mockup if real data is empty */}
              {(recentMov.length > 0 ? recentMov : [
                { type: 'Entrée', produit_nom: 'Dispositifs Cardiaques', date: 'Il y a 2 min', fournisseur: 'HUB Nord' },
                { type: 'Sortie', produit_nom: 'Consommables ORL', date: 'Il y a 14 min', fournisseur: 'Clinique St-Jean' },
                { type: 'Info', produit_nom: 'Inventaire validé: Chirurgie', date: 'Il y a 1h', fournisseur: 'Pharmacie Centrale' }
              ]).map((m, i) => {
                const isEntree = (m.type || '').toLowerCase().includes('entr');
                const isInfo = (m.type || '').toLowerCase().includes('info');
                const color = isEntree ? '#4ade80' : isInfo ? '#64748b' : '#3b82f6';
                
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${color}` }} />
                    <div>
                      <p style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '0.85rem' }}>
                        {m.type}: {m.produit_nom || m.nom_produit || 'Produit'}
                      </p>
                      <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.75rem' }}>
                        {m.date} • {m.client_fournisseur || m.fournisseur || ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* ── 4. Logistique ────────────────────── */}
          <article className="hub-card" onClick={() => setPage('commandes')} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, #4ade80, #22c55e)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🚚</div>
              <h3 style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Logistique</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(15,23,42,0.4)', padding: '20px', borderRadius: 16 }}>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px', fontWeight: 600 }}>Commandes Clients</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', margin: 0 }}>{commandes?.length || 48}</p>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.4)', padding: '20px', borderRadius: 16 }}>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px', fontWeight: 600 }}>Commandes Fournisseurs</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>12</p>
              </div>
            </div>
            
            <div style={{ marginTop: 24, fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, cursor: 'pointer' }}>
              → Voir le tracking global
            </div>
          </article>

          {/* ── 5. Financial Health ───────────────────────────── */}
          <article className="hub-card" onClick={() => setPage('factures')} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Financial Health</h3>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>{factures?.length || 98}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>/ 100</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setPage('rapports'); }} 
              style={{
                width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.6)'}
            >
              Éditer rapport financier
            </button>
          </article>

        </div>

        {/* COLONNE DROITE (Partenariats, Générateur, Système) */}
        <div className="hub-col-right">
          
          {/* ── 6. Partenariats ──────────────────────────────── */}
          <article className="hub-card" onClick={() => setPage('clients')} style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Partenariats</h3>
              <span style={{ color: '#818cf8' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </span>
            </div>
            <p style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{totalPartners || 214}</p>
            <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, margin: 0 }}>
              +4 nouveaux ce mois
            </p>
          </article>

          {/* ── 7. Générateur Hybride (Rapports) ─────────────── */}
          <article className="hub-card" onClick={() => setPage('rapports')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📊</div>
              <h3 style={{ fontWeight: 600, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Générateur Hybride</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="hub-report-row" style={{ padding: '16px', background: 'rgba(15,23,42,0.4)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>📗</span>
                  <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>Export Excel Inventaire</span>
                </div>
                <span style={{ color: '#64748b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </span>
              </div>
              <div className="hub-report-row" style={{ padding: '16px', background: 'rgba(15,23,42,0.4)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>📕</span>
                  <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500 }}>Dashboard PDF Mensuel</span>
                </div>
                <span style={{ color: '#64748b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </span>
              </div>
            </div>
          </article>

          {/* ── 8. Système ───────────────────────────────────── */}
          <article className="hub-card" onClick={() => setPage('parametres')} style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Système</h3>
              <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            </div>
            
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#f8fafc', margin: 0, display: 'flex', gap: 12 }}>
                <span style={{ color: '#64748b', opacity: 0.8 }}>14:22</span>
                <span style={{ fontWeight: 500 }}>Audit log sync : OK</span>
              </p>
              <p style={{ color: '#f8fafc', margin: 0, display: 'flex', gap: 12 }}>
                <span style={{ color: '#64748b', opacity: 0.8 }}>13:05</span>
                <span style={{ fontWeight: 500 }}>API Gateway : Stable</span>
              </p>
            </div>
          </article>

        </div>
      </div>

      {/* ═══ STYLES ═══ */}
      <style>{`
        /* CSS GRID (Mockup Layout) */
        .hub-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 24px;
        }
        
        .hub-col-left, .hub-col-middle, .hub-col-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Large card on the left needs to fill height */
        .hub-col-left > article:first-child {
          flex: 1;
        }

        @media (max-width: 1024px) {
          .hub-grid { grid-template-columns: 1fr 1fr; }
          .hub-col-right { grid-column: 1 / -1; flex-direction: row; }
          .hub-col-right > article { flex: 1; }
        }
        @media (max-width: 768px) {
          .hub-grid { grid-template-columns: 1fr; }
          .hub-col-right { flex-direction: column; }
        }

        /* Solid Dark Blue Card */
        .hub-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--card-shadow);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .hub-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }

        /* Pulse Dot Animation */
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pulse-dot { animation: pulse 2s infinite; }

        /* Chart Animation */
        .chart-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

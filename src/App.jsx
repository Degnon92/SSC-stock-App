import React, { useState, useRef, useEffect } from 'react';
import { GlobalStyles, Modal, Btn } from './components/UI';
import useStore from './utils/useStore';
import useAuth from './utils/useAuth';
import { LoginScreen } from './components/Auth';
import Dashboard from './components/Dashboard';
import Produits from './components/Produits';
import Mouvements from './components/Mouvements';
import Commandes from './components/Commandes';
import { Alertes, Fournisseurs, Clients, Rapports, AuditLogs } from './components/Pages';
import { Lots, HistoriquePrix } from './components/Tracabilite';
import Facturation from './components/Facturation';
import Scanner from './components/Scanner';
import Parametres from './components/Parametres';

const NAV = [
  { id: 'dashboard',     emoji: '📊', label: 'Tableau de bord',   section: 'principal' },
  { id: 'produits',      emoji: '📦', label: 'Catalogue',          section: 'principal' },
  { id: 'mouvements',    emoji: '🔄', label: 'Mouvements',         section: 'principal' },
  { id: 'scanner',       emoji: '📷', label: 'Scanner',            section: 'principal' },
  { id: 'alertes',       emoji: '🔔', label: 'Alertes',            section: 'suivi', badge: true },
  { id: 'lots',          emoji: '🔬', label: 'Lots & Traçabilité', section: 'suivi' },
  { id: 'prix',          emoji: '📉', label: 'Historique prix',    section: 'suivi' },
  { id: 'factures',      emoji: '🧾', label: 'Facturation',        section: 'commercial' },
  { id: 'fournisseurs',  emoji: '🏭', label: 'Fournisseurs',       section: 'commercial' },
  { id: 'commandes',     emoji: '📦', label: 'Commandes/Achats',   section: 'commercial' },
  { id: 'clients',       emoji: '🏥', label: 'Clients',            section: 'commercial' },
  { id: 'rapports',      emoji: '📈', label: 'Rapports',           section: 'analyse' },
  { id: 'audit',         emoji: '🛡️', label: 'Audit & Logs',       section: 'analyse' },
  { id: 'parametres',    emoji: '⚙️', label: 'Paramètres',        section: 'analyse' },
];

const SECTIONS = [
  { key: 'principal',  label: 'PRINCIPAL' },
  { key: 'suivi',      label: 'SUIVI' },
  { key: 'commercial', label: 'COMMERCIAL' },
  { key: 'analyse',    label: 'ANALYSE' },
];

const TITLES = {
  dashboard: 'Tableau de bord', produits: 'Catalogue Produits',
  mouvements: 'Mouvements', scanner: 'Scanner Code-Barres',
  alertes: 'Alertes de Stock', lots: 'Lots & Traçabilité',
  prix: 'Historique Prix Fournisseurs', factures: 'Facturation',
  fournisseurs: 'Fournisseurs', commandes: 'Bons de Commande', clients: 'Clients',
  rapports: 'Rapports & Analyses', audit: 'Historique d\'Audit', parametres: 'Paramètres',
};

export default function App() {
  const [theme,    setTheme]    = useState(() => localStorage.getItem('ssc_theme') || 'light');
  const [page,     setPage]     = useState('dashboard');
  const [sidebar,  setSidebar]  = useState(true);
  
  // Avatar Dropdown & Password Reset States
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [pwdModalOpen,  setPwdModalOpen]  = useState(false);
  const [pwdMsg,        setPwdMsg]        = useState(null);
  const profileRef = useRef(null);

  const store = useStore();
  const auth  = useAuth();

  useEffect(() => {
    localStorage.setItem('ssc_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Auth Loading ─────────────────────────────────────────
  if (auth.loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '2rem', color: 'var(--text-main)' }}>SSC</div>
        <div style={{ width: 36, height: 36, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  // ── Not logged in ─────────────────────────────────────────
  if (!auth.user) return <LoginScreen auth={auth} />;

  // ── Firebase loading ──────────────────────────────────────
  if (store.loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)' }}>Chargement des données...</div>
        <div style={{ width: 36, height: 36, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  if (store.error) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f43f5e' }}>Erreur Firebase</div>
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', borderRadius: 12, padding: '20px 28px', maxWidth: 500, border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
          {store.error}<br /><br />
          Ouvrez <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>src/firebase.js</code> et remplacez les valeurs VOTRE_... par celles de votre projet Firebase.
        </div>
      </div>
    </>
  );

  const alertCount = store.alertes.length;

  return (
    <>
      <GlobalStyles />
      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* SIDEBAR */}
        <aside style={{
          width: sidebar ? 230 : 64, height: '100vh', background: 'var(--bg-sidebar)',
          backdropFilter: 'var(--glass-blur)', borderRight: '1px solid var(--border-color)',
          position: 'fixed', top: 0, left: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease',
          fontFamily: 'Inter, sans-serif',
        }}>
          {/* Logo */}
          <div style={{ padding: sidebar ? '22px 20px 16px' : '22px 14px 16px', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem', boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)' }}>💊</div>
              {sidebar && (
                <div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1 }}>SSC</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>Stock Manager</div>
                </div>
              )}
            </div>
            {sidebar && (
              <div style={{ marginTop: 10, background: 'rgba(0,168,120,0.15)', borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem', color: '#00a878', fontWeight: 600 }}>
                👤 {auth.profile?.nom || auth.user?.email}
                <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '0.65rem', textTransform: 'uppercase' }}>({auth.profile?.role})</span>
              </div>
            )}
          </div>

          {/* NAV */}
          <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {SECTIONS.map(sec => {
              const items = NAV.filter(n => n.section === sec.key);
              return (
                <div key={sec.key}>
                  {sidebar && <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 10px 4px', fontWeight: 700 }}>{sec.label}</div>}
                  {items.map(item => {
                    const isActive  = page === item.id;
                    const showBadge = item.badge && alertCount > 0;
                    return (
                      <button key={item.id} onClick={() => setPage(item.id)} title={!sidebar ? item.label : undefined} style={{
                        display: 'flex', alignItems: 'center', gap: sidebar ? 10 : 0, justifyContent: sidebar ? 'flex-start' : 'center',
                        width: '100%', padding: sidebar ? '9px 10px' : '10px', borderRadius: 8, border: '1px solid transparent',
                        background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        borderColor: isActive ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        color: isActive ? '#38bdf8' : 'rgba(255,255,255,0.5)',
                        fontSize: sidebar ? '0.875rem' : '1.1rem',
                        fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden',
                      }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
                      >
                        <span style={{ fontSize: sidebar ? '0.95rem' : '1.1rem', flexShrink: 0 }}>{item.emoji}</span>
                        {sidebar && <span style={{ flex: 1 }}>{item.label}</span>}
                        {sidebar && showBadge && <span style={{ background: '#e63946', color: '#fff', borderRadius: 20, fontSize: '0.62rem', padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>{alertCount}</span>}
                      </button>
                    );
                  })}
                  {sidebar && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />}
                </div>
              );
            })}
          </nav>

          {/* Déconnexion */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-light)' }}>
            <button onClick={auth.logout} title={!sidebar ? 'Déconnexion' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: sidebar ? 10 : 0, justifyContent: sidebar ? 'flex-start' : 'center',
              width: '100%', padding: sidebar ? '9px 10px' : '10px', borderRadius: 8, border: 'none',
              background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.855rem', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.15)'; e.currentTarget.style.color = '#e63946'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            >
              <span>🚪</span>{sidebar && <span>Déconnexion</span>}
            </button>
            {sidebar && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.15)', padding: '6px 10px 0', lineHeight: 1.5 }}>© 2025 SSC v2.0</div>}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ marginLeft: sidebar ? 230 : 64, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
          {/* TOPBAR */}
          <div style={{ background: 'var(--bg-sidebar)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--border-color)', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSidebar(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', padding: 4, borderRadius: 6, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'} title="Masquer/afficher le menu">
                ☰
              </button>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>{TITLES[page]}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: 4, transition: 'transform 0.2s' }} title="Changer de thème">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button onClick={() => setPage('parametres')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: 4, color: 'var(--text-muted)', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Paramètres">
                ⚙️
              </button>
              {alertCount > 0 && (
                <button onClick={() => setPage('alertes')} style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 20, padding: '4px 12px', color: '#fb7185', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.9rem' }}>🔔</span> {alertCount} alerte{alertCount > 1 ? 's' : ''}
                </button>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              
              {/* AVATAR DROPDOWN */}
              <div style={{ position: 'relative' }} ref={profileRef}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', transform: profileOpen ? 'scale(1.05)' : 'scale(1)', boxShadow: profileOpen ? '0 0 0 3px rgba(56,189,248,0.2)' : 'none' }}
                  onClick={() => setProfileOpen(!profileOpen)}
                  title={`Connecté en tant que ${auth.profile?.nom || auth.user?.email}`}>
                  {(auth.profile?.nom || auth.user?.email || 'U')[0].toUpperCase()}
                </div>

                {profileOpen && (
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 220, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 100, overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-sidebar)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.profile?.nom || 'Utilisateur'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auth.user?.email}</div>
                    </div>
                    <div style={{ padding: 6 }}>
                      <button onClick={() => { setProfileOpen(false); setPage('parametres'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <span>👤</span> Mon Profil
                      </button>
                      <button onClick={() => { setProfileOpen(false); setPwdModalOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <span>🔑</span> Changer le mot de passe
                      </button>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', padding: 6 }}>
                      <button onClick={auth.logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'none', border: 'none', color: '#e63946', fontSize: '0.85rem', cursor: 'pointer', borderRadius: 6, transition: 'background 0.2s', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <span>🚪</span> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PASSWORD RESET MODAL */}
          <Modal open={pwdModalOpen} onClose={() => { setPwdModalOpen(false); setPwdMsg(null); }} title="🔒 Changer de mot de passe" width={400}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Vous allez recevoir un email contenant un lien sécurisé pour choisir votre nouveau mot de passe.
            </p>
            {pwdMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: pwdMsg.type === 'success' ? 'rgba(0,168,120,0.1)' : 'rgba(230,57,70,0.1)', color: pwdMsg.type === 'success' ? '#00a878' : '#e63946', fontSize: '0.85rem' }}>
                {pwdMsg.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="outline" onClick={() => { setPwdModalOpen(false); setPwdMsg(null); }}>Annuler</Btn>
              <Btn variant="primary" onClick={async () => {
                setPwdMsg(null);
                const res = await auth.resetPassword(auth.user.email);
                if (res.success) setPwdMsg({ type: 'success', text: `✅ Lien envoyé à ${auth.user.email} !` });
                else setPwdMsg({ type: 'error', text: `❌ Erreur : ${res.error}` });
              }}>Envoyer le lien</Btn>
            </div>
          </Modal>

          {/* PAGE */}
          <div style={{ padding: 24, flex: 1 }}>
            {page === 'dashboard'    && <Dashboard store={store} onNavigate={setPage} />}
            {page === 'produits'     && <Produits store={store} auth={auth} />}
            {page === 'mouvements'   && <Mouvements store={store} auth={auth} />}
            {page === 'scanner'      && <Scanner store={store} />}
            {page === 'alertes'      && <Alertes store={store} onNavigate={setPage} />}
            {page === 'lots'         && <Lots store={store} />}
            {page === 'prix'         && <HistoriquePrix store={store} />}
            {page === 'factures'     && <Facturation store={store} auth={auth} />}
            {page === 'fournisseurs' && <Fournisseurs store={store} auth={auth} />}
            {page === 'commandes'    && <Commandes store={store} auth={auth} />}
            {page === 'clients'      && <Clients store={store} auth={auth} />}
            {page === 'rapports'     && <Rapports store={store} />}
            {page === 'audit'        && <AuditLogs store={store} />}
            {page === 'parametres'   && <Parametres store={store} auth={auth} />}
          </div>
        </main>
      </div>
    </>
  );
}

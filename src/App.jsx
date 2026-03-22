import React, { useState, useRef, useEffect } from 'react';
import { Modal, Btn } from './components/UI';
import { GlobalStyles } from './components/GlobalStyles';
import useStore from './utils/useStore';
import useAuth from './utils/useAuth';
import { LoginScreen } from './components/Auth';
import Hub from './components/Hub';
import Produits from './components/Produits';
import Mouvements from './components/Mouvements';
import Commandes from './components/Commandes';
import Fournisseurs from './components/Fournisseurs';
import Clients from './components/Clients';
import { Alertes, Rapports, AuditLogs } from './components/Pages';
import { Lots, HistoriquePrix } from './components/Tracabilite';
import Facturation from './components/Facturation';
import Scanner from './components/Scanner';
import Parametres from './components/Parametres';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [partenaireSub, setPartenaireSub] = useState('clients'); // sub-tab: 'clients' | 'fournisseurs'
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdMsg,       setPwdMsg]       = useState(null);
  const profileRef = useRef(null);

  const store = useStore();
  const auth  = useAuth();

  // Force dark theme always — clear any old 'light' preference
  useEffect(() => {
    localStorage.removeItem('ssc_theme');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Click outside → close profile dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Auth Loading ──────────────────────────────────────────
  if (auth.loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1121', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#f8fafc' }}>SSC FLOW</div>
        <div style={{ width: 36, height: 36, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  if (!auth.user) return <LoginScreen auth={auth} />;

  if (store.loading) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1121', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f8fafc' }}>Chargement des données...</div>
        <div style={{ width: 36, height: 36, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  if (store.error) return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1121', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#f43f5e' }}>Erreur Firebase</div>
        <div style={{ background: 'rgba(17,27,52,0.75)', borderRadius: 12, padding: '20px 28px', maxWidth: 500, border: '1px solid rgba(244,63,94,0.2)', fontSize: '0.875rem', color: '#f8fafc', lineHeight: 1.8 }}>
          {store.error}
        </div>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: '#0b1121', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

        {/* ══ TOP NAVBAR ══ */}
        <header style={{
          height: 64, padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(11, 17, 33, 0.9)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }} onClick={() => setPage('dashboard')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f1f5f9' }}>SSC FLOW</span>
          </div>

          {/* Center tabs */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'dashboard',    label: 'Accueil' },
              { id: 'produits',     label: 'Produits' },
              { id: 'partenaires',  label: 'Partenaires' },
              { id: 'mouvements',   label: 'Mouvements' },
              { id: 'rapports',     label: 'Analytique' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setPage(tab.id)} style={{
                background: 'none', border: 'none', padding: '4px 14px', cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                color: page === tab.id ? '#f8fafc' : '#64748b',
                borderBottom: page === tab.id ? '2px solid #a855f7' : '2px solid transparent',
                transition: 'color 0.2s', whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right side: search + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Rechercher..." style={{ width: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#f8fafc', padding: '8px 12px 8px 36px', borderRadius: 24, fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <div
                onClick={() => setProfileOpen(p => !p)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', border: '2px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#c084fc', fontSize: '0.85rem' }}
              >
                {(auth.profile?.nom || auth.user?.email || 'U')[0].toUpperCase()}
              </div>

              {profileOpen && (
                <div style={{ position: 'absolute', top: 46, right: 0, width: 220, background: '#111b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 200, padding: 8 }}>
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{auth.profile?.nom || 'Utilisateur'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{auth.user?.email}</div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <button onClick={() => { setProfileOpen(false); setPage('parametres'); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.84rem', cursor: 'pointer', borderRadius: 6, fontFamily: 'inherit' }}>👤 Mon profil</button>
                    <button onClick={() => { setProfileOpen(false); setPwdModalOpen(true); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '0.84rem', cursor: 'pointer', borderRadius: 6, fontFamily: 'inherit' }}>🔑 Changer le mot de passe</button>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0 0' }}>
                    <button onClick={auth.logout} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#f87171', fontSize: '0.84rem', cursor: 'pointer', borderRadius: 6, fontFamily: 'inherit' }}>🚪 Déconnexion</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══ PAGE CONTENT ══ */}
        <main style={{ flex: 1, overflowY: 'auto' }}>

          {/* Sub-nav for Partenaires */}
          {page === 'partenaires' && (
            <div style={{ background: 'rgba(11,17,33,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', display: 'flex', gap: 0 }}>
              {[
                { id: 'clients',      label: '🏥 Clients' },
                { id: 'fournisseurs', label: '🏭 Fournisseurs' },
              ].map(sub => (
                <button key={sub.id} onClick={() => setPartenaireSub(sub.id)} style={{
                  background: 'none', border: 'none', padding: '12px 24px', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                  color: partenaireSub === sub.id ? '#c084fc' : '#64748b',
                  borderBottom: partenaireSub === sub.id ? '2px solid #a855f7' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}>
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '24px 32px 120px' }}>
            {page === 'dashboard'    && <Hub store={store} auth={auth} setPage={setPage} />}
            {page === 'produits'     && <Produits store={store} auth={auth} />}
            {page === 'mouvements'   && <Mouvements store={store} auth={auth} />}
            {page === 'scanner'      && <Scanner store={store} />}
            {page === 'alertes'      && <Alertes store={store} onNavigate={setPage} />}
            {page === 'lots'         && <Lots store={store} />}
            {page === 'prix'         && <HistoriquePrix store={store} />}
            {page === 'factures'     && <Facturation store={store} auth={auth} />}
            {page === 'commandes'    && <Commandes store={store} auth={auth} />}
            {page === 'rapports'     && <Rapports store={store} />}
            {page === 'audit'        && <AuditLogs store={store} />}
            {page === 'parametres'   && <Parametres store={store} auth={auth} />}
            {page === 'partenaires'  && partenaireSub === 'clients'      && <Clients store={store} auth={auth} />}
            {page === 'partenaires'  && partenaireSub === 'fournisseurs' && <Fournisseurs store={store} auth={auth} />}
          </div>
        </main>

        {/* ══ BOTTOM PILL NAV ══ */}
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 40,
            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
          }}>
            {(() => {
              const alertCount = (store.ruptures?.length || 0) + (store.stockFaible?.length || 0) + (store.expirationProche?.length || 0);
              return [
                { id: 'dashboard',  label: 'Accueil',    badge: 0, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                { id: 'commandes',  label: 'Commandes',  badge: 0, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
                { id: 'scanner',    label: 'Scanner',    badge: 0, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg> },
                { id: 'alertes',    label: 'Alertes',    badge: alertCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
                { id: 'parametres', label: 'Système',    badge: 0, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
              ].map(item => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 18px', background: active ? 'rgba(168,85,247,0.15)' : 'none',
                      border: 'none', borderRadius: 28, cursor: 'pointer',
                      color: active ? '#c084fc' : '#64748b', transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {item.badge > 0 && (
                      <span style={{ position: 'absolute', top: 4, right: 10, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(15,23,42,0.9)' }}>{item.badge > 9 ? '9+' : item.badge}</span>
                    )}
                    {item.icon}
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{item.label}</span>
                  </button>
                );
              });
            })()}
          </div>
        </div>

      </div>

      {/* ══ PASSWORD RESET MODAL ══ */}
      <Modal open={pwdModalOpen} onClose={() => { setPwdModalOpen(false); setPwdMsg(null); }} title="🔒 Changer de mot de passe" width={400}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>
          Vous allez recevoir un email avec un lien pour choisir votre nouveau mot de passe.
        </p>
        {pwdMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: pwdMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: pwdMsg.type === 'success' ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
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
    </>
  );
}

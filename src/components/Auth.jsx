import React, { useState } from 'react';
import { GlobalStyles, Btn, FormGroup, Input, Modal, FormGrid, Select } from './UI';
import { ROLES, DEFAULT_PERMS } from '../utils/useAuth';

// ─── ÉCRAN DE CONNEXION ───────────────────────────────────────────────────────
export function LoginScreen({ auth }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    await auth.login(email, password);
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    const res = await auth.resetPassword(email);
    if (res.success) setResetSent(true);
    setLoading(false);
  }

  return (
    <>
      <GlobalStyles />
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{
        minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0a2540 0%, #1a4a7a 50%, #0a2540 100%)',
        alignItems: 'center', justifyContent: 'center', padding: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decorative circles */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: [200, 300, 150, 400, 250][i],
            height: [200, 300, 150, 400, 250][i],
            borderRadius: '50%',
            background: 'rgba(0,168,120,0.05)',
            border: '1px solid rgba(0,168,120,0.1)',
            top: ['10%', '60%', '80%', '-10%', '40%'][i],
            left: ['5%', '70%', '20%', '60%', '-5%'][i],
            animation: `float ${3 + i}s ease-in-out infinite`,
          }} />
        ))}

        <div style={{ animation: 'fadeUp 0.5s ease', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #00a878, #0079c1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(0,168,120,0.4)',
            }}>
              <span style={{ fontSize: '2rem' }}>💊</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#fff', letterSpacing: '-0.5px' }}>SSC</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 4 }}>
              Surgical Services Consulting
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(0,168,120,0.8)', marginTop: 8 }}>Gestion de Stock — v2.0</div>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '36px 40px',
            width: 420, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#00a878', marginBottom: 8 }}>Email envoyé !</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                  Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
                </p>
                <Btn variant="outline" onClick={() => { setResetMode(false); setResetSent(false); }} style={{ width: '100%', justifyContent: 'center' }}>
                  Retour à la connexion
                </Btn>
              </div>
            ) : resetMode ? (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 6 }}>
                  Mot de passe oublié
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: 22 }}>
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
                <form onSubmit={handleReset}>
                  <FormGroup label="Email">
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
                  </FormGroup>
                  {auth.error && <div style={{ color: '#e63946', fontSize: '0.8rem', margin: '10px 0' }}>⚠️ {auth.error}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <Btn variant="outline" type="button" onClick={() => setResetMode(false)} style={{ flex: 1, justifyContent: 'center' }}>Annuler</Btn>
                    <Btn variant="accent" type="submit" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                      {loading ? '...' : 'Envoyer'}
                    </Btn>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: 6 }}>
                  Connexion
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: 24 }}>
                  Accédez à votre espace de gestion de stock.
                </p>
                <form onSubmit={handleLogin}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <FormGroup label="Email">
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
                    </FormGroup>
                    <FormGroup label="Mot de passe">
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </FormGroup>
                  </div>
                  {auth.error && (
                    <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: '0.8rem', marginTop: 14 }}>
                      ⚠️ {auth.error}
                    </div>
                  )}
                  <Btn variant="accent" type="submit" disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 22, padding: '12px 20px', fontSize: '0.95rem' }}>
                    {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
                  </Btn>
                </form>
                <button onClick={() => setResetMode(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', marginTop: 16, width: '100%', textAlign: 'center', padding: 4 }}>
                  Mot de passe oublié ?
                </button>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem' }}>
            © 2025 SSC · Réseau local sécurisé
          </div>
        </div>
      </div>
    </>
  );
}

// ─── GESTION DES UTILISATEURS (admin seulement) ───────────────────────────────
export function GestionUtilisateurs({ auth }) {
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState({ email: '', password: '', nom: '', role: ROLES.STOCK, permissions: { ...DEFAULT_PERMS } });
  const [msg,  setMsg]      = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPerm = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  async function handleCreate() {
    if (!form.email || !form.password || !form.nom) return setMsg({ type: 'error', text: 'Tous les champs sont requis.' });
    setLoading(true);
    const res = await auth.createUser(form);
    setLoading(false);
    if (res.success) {
      setMsg({ type: 'success', text: `✅ Compte créé pour ${form.email}` });
      setForm({ email: '', password: '', nom: '', role: ROLES.STOCK, permissions: { ...DEFAULT_PERMS } });
    } else {
      setMsg({ type: 'error', text: res.error });
    }
  }

  return (
    <>
      <Btn variant="outline" size="sm" onClick={() => setOpen(true)} icon="👥">Gérer utilisateurs</Btn>
      <Modal open={open} onClose={() => { setOpen(false); setMsg(null); }} title="👥 Gestion des utilisateurs" width={500}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          Créez des comptes pour votre équipe. Chaque utilisateur a son propre login.
        </p>

        <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: '0.82rem' }}>
          <strong>Rôles disponibles :</strong>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span>🔴 <strong>Admin</strong> — Accès total (créer/modifier/supprimer, gérer utilisateurs)</span>
            <span>🟡 <strong>Stock</strong> — Entrées/sorties + consultation (pas de suppression)</span>
            <span>🟢 <strong>Lecture</strong> — Consultation uniquement (aucune modification)</span>
          </div>
        </div>

        <FormGrid cols={2}>
          <FormGroup label="Nom complet *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Prénom Nom" /></FormGroup>
          <FormGroup label="Email *"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@..." /></FormGroup>
          <FormGroup label="Rôle">
            <Select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value={ROLES.ADMIN}>🔴 Admin</option>
              <option value={ROLES.STOCK}>🟡 Stock</option>
              <option value={ROLES.LECTURE}>🟢 Lecture seule</option>
            </Select>
          </FormGroup>
          <FormGroup label="Mot de passe *" full hint="Minimum 6 caractères — l'utilisateur peut le changer ensuite">
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 caractères" />
          </FormGroup>
        </FormGrid>

        {form.role !== ROLES.ADMIN && (
          <div style={{ marginTop: 20, background: 'var(--bg-card)', padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 12 }}>🔧 Permissions Supplémentaires (Granulaires)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.permissions.canViewPUMP} onChange={e => setPerm('canViewPUMP', e.target.checked)} />
                Voir le Prix d'Achat (PUMP)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.permissions.canDelete} onChange={e => setPerm('canDelete', e.target.checked)} />
                Droit de Suppression
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.permissions.canExport} onChange={e => setPerm('canExport', e.target.checked)} />
                Exporter les données (PDF/Excel)
              </label>
            </div>
          </div>
        )}

        {msg && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: msg.type === 'success' ? 'rgba(0,168,120,0.1)' : 'rgba(230,57,70,0.1)', color: msg.type === 'success' ? '#00a878' : '#e63946', fontSize: '0.82rem' }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => { setOpen(false); setMsg(null); }}>Fermer</Btn>
          <Btn variant="accent" onClick={handleCreate} disabled={loading}>
            {loading ? '⏳ Création...' : '➕ Créer le compte'}
          </Btn>
        </div>
      </Modal>
    </>
  );
}

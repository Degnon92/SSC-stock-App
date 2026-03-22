import React, { useState, useEffect } from 'react';
import { Btn, FormGroup, Input, Modal, FormGrid, Select } from './UI';
import { GlobalStyles } from './GlobalStyles';
import { ROLES, DEFAULT_PERMS } from '../utils/useAuth';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
        minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
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
            background: 'rgba(249,115,22,0.04)',
            border: '1px solid rgba(249,115,22,0.08)',
            top: ['10%', '60%', '80%', '-10%', '40%'][i],
            left: ['5%', '70%', '20%', '60%', '-5%'][i],
            animation: `float ${3 + i}s ease-in-out infinite`,
          }} />
        ))}

        <div style={{ animation: 'fadeUp 0.5s ease', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: 'rgba(249,115,22,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <span style={{ fontSize: '2rem' }}>💊</span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#f1f5f9', letterSpacing: '-0.03em' }}>SSC Flow</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 4 }}>
              Surgical Services Consulting
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(249,115,22,0.7)', marginTop: 8, fontWeight: 600 }}>Gestion de Stock — v2.0</div>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '36px 40px',
            width: 420, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
          }}>
            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</div>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: '#059669', marginBottom: 8 }}>Email envoyé !</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
                  Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
                </p>
                <Btn variant="outline" onClick={() => { setResetMode(false); setResetSent(false); }} style={{ width: '100%', justifyContent: 'center' }}>
                  Retour à la connexion
                </Btn>
              </div>
            ) : resetMode ? (
              <>
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: 6 }}>
                  Mot de passe oublié
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: 22 }}>
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
                <form onSubmit={handleReset}>
                  <FormGroup label="Email">
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
                  </FormGroup>
                  {auth.error && <div style={{ color: '#ef4444', fontSize: '0.8rem', margin: '10px 0' }}>⚠️ {auth.error}</div>}
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
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', marginBottom: 6 }}>
                  Connexion
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: 24 }}>
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
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: '0.8rem', marginTop: 14 }}>
                      ⚠️ {auth.error}
                    </div>
                  )}
                  <Btn variant="accent" type="submit" disabled={loading}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 22, padding: '12px 20px', fontSize: '0.95rem', borderRadius: 12 }}>
                    {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
                  </Btn>
                </form>
                <button onClick={() => setResetMode(true)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', marginTop: 16, width: '100%', textAlign: 'center', padding: 4 }}>
                  Mot de passe oublié ?
                </button>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem' }}>
            © 2025 SSC · Réseau local sécurisé
          </div>
        </div>
      </div>
    </>
  );

}

// ─── GESTION DES UTILISATEURS (admin seulement) ───────────────────────────────
export function GestionUtilisateurs({ auth }) {
  const [users, setUsers]       = useState([]);
  const [open, setOpen]         = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState({ email: '', password: '', nom: '', role: ROLES.STOCK, permissions: { ...DEFAULT_PERMS } });
  const [editForm, setEditForm] = useState({ nom: '', role: '', permissions: {} });
  const [msg,  setMsg]          = useState(null);
  const [loading, setLoading]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPerm = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  // Load all users from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setUsers(list);
    });
    return () => unsub();
  }, []);

  // Update current user's presence
  useEffect(() => {
    if (!auth.user) return;
    const userRef = doc(db, 'users', auth.user.uid);
    setDoc(userRef, { online: true, lastSeen: new Date().toISOString() }, { merge: true });
    const handleUnload = () => {
      // Best effort — navigator.sendBeacon not available for Firestore
      setDoc(userRef, { online: false, lastSeen: new Date().toISOString() }, { merge: true });
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      setDoc(userRef, { online: false, lastSeen: new Date().toISOString() }, { merge: true });
    };
  }, [auth.user]);

  async function handleCreate() {
    if (!form.email || !form.password || !form.nom) return setMsg({ type: 'error', text: 'Tous les champs sont requis.' });
    setLoading(true);
    const res = await auth.createUser(form);
    setLoading(false);
    if (res.success) {
      setMsg({ type: 'success', text: `✅ Compte créé pour ${form.email}` });
      setForm({ email: '', password: '', nom: '', role: ROLES.STOCK, permissions: { ...DEFAULT_PERMS } });
      setTimeout(() => { setOpen(false); setMsg(null); }, 1500);
    } else {
      setMsg({ type: 'error', text: res.error });
    }
  }

  async function handleEditSave() {
    if (!editUser) return;
    try {
      const perms = (editForm.role === ROLES.ADMIN || editForm.role === ROLES.SUPER_ADMIN)
        ? { canViewPUMP: true, canDelete: true, canExport: true, canStock: true, canCommandes: true, canFacturation: true, canClients: true, canRapports: true }
        : editForm.permissions;
      await setDoc(doc(db, 'users', editUser.uid), {
        nom: editForm.nom,
        role: editForm.role,
        permissions: perms,
      }, { merge: true });
      setEditUser(null);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  }

  const setEditPerm = (k, v) => setEditForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  const onlineCount = users.filter(u => u.online).length;
  const ROLE_COLORS = { admin: '#e63946', stock: '#f59e0b', lecture: '#22c55e' };
  const AVATAR_COLORS = ['#0a2540', '#1a4a7a', '#6366f1', '#8b5cf6', '#0891b2', '#059669', '#d97706', '#dc2626'];

  return (
    <>
      {/* TEAM LIST */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
            👥 Équipe ({users.length})
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: 20,
            fontSize: '0.78rem', color: '#22c55e', fontWeight: 600,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            {onlineCount} en ligne
          </div>
        </div>

        {/* User rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((u, idx) => {
            const initial = (u.nom || u.email || 'U')[0].toUpperCase();
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const roleColor = ROLE_COLORS[u.role] || '#6b7c93';
            const isOnline = !!u.online;
            return (
              <div key={u.uid} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                background: 'var(--bg-page)', borderRadius: 10,
                transition: 'background 0.15s',
              }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  }}>
                    {initial}
                  </div>
                  {/* Online dot */}
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: '50%',
                    background: isOnline ? '#22c55e' : '#94a3b8',
                    border: '2px solid var(--bg-card)',
                  }} />
                </div>

                {/* Name & email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{u.nom || u.email}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                </div>

                {/* Role badge */}
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                  color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}30`,
                  textTransform: 'capitalize',
                }}>
                  {u.role === 'admin' ? '🔴' : u.role === 'stock' ? '🟡' : '🟢'} {u.role || 'N/A'}
                </span>

                {/* Online status text */}
                <span style={{ fontSize: '0.75rem', color: isOnline ? '#22c55e' : '#94a3b8', fontWeight: 500, minWidth: 70 }}>
                  {isOnline ? '● En ligne' : '○ Hors ligne'}
                </span>

                {/* Edit button */}
                <button onClick={() => { setEditUser(u); setEditForm({ nom: u.nom || '', role: u.role || ROLES.STOCK, permissions: u.permissions || { ...DEFAULT_PERMS, canStock: false, canCommandes: false, canFacturation: false, canClients: false, canRapports: false } }); }}
                  style={{
                    background: 'rgba(56,189,248,0.1)', border: 'none', borderRadius: 8,
                    padding: '6px 10px', cursor: 'pointer', color: '#38bdf8', fontSize: '0.85rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                >
                  ✏️
                </button>
              </div>
            );
          })}
        </div>

        {/* Create account button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn variant="accent" onClick={() => { setOpen(true); setMsg(null); }} icon="➕">Créer un compte</Btn>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Modal open={open} onClose={() => { setOpen(false); setMsg(null); }} title="👥 Créer un compte" width={500}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          Créez des comptes pour votre équipe. Chaque utilisateur a son propre login.
        </p>

        <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: '0.82rem' }}>
          <strong>Rôles disponibles :</strong>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span>🟣 <strong>Super Admin</strong> — Accès total + gestion système (utilisateurs, paramètres)</span>
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
              <option value={ROLES.SUPER_ADMIN}>🟣 Super Admin</option>
              <option value={ROLES.ADMIN}>🔴 Admin</option>
              <option value={ROLES.STOCK}>🟡 Stock</option>
              <option value={ROLES.LECTURE}>🟢 Lecture seule</option>
            </Select>
          </FormGroup>
          <FormGroup label="Mot de passe *" full hint="Minimum 6 caractères — l'utilisateur peut le changer ensuite">
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 caractères" />
          </FormGroup>
        </FormGrid>

        {form.role !== ROLES.ADMIN && form.role !== ROLES.SUPER_ADMIN && (
          <div style={{ marginTop: 20, background: 'var(--input-bg)', padding: '16px 18px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 14 }}>🔧 Permissions Supplémentaires (Granulaires)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['canViewPUMP',    '🔍 Voir les Prix d\'Achat (PUMP)'],
                ['canDelete',      '🗑️ Droit de Suppression'],
                ['canExport',      '📄 Exporter (PDF/Excel)'],
                ['canStock',       '📦 Gérer le Stock (Entrées/Sorties)'],
                ['canCommandes',   '📋 Gérer les Commandes'],
                ['canFacturation', '💰 Gérer la Facturation'],
                ['canClients',     '🏥 Gérer les Clients'],
                ['canRapports',    '📊 Accéder aux Rapports'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.permissions[key]}
                    onChange={e => setPerm(key, e.target.checked)}
                    style={{ accentColor: '#f97316' }}
                  />
                  {label}
                </label>
              ))}
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

      {/* EDIT USER MODAL */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`✏️ Modifier — ${editUser?.nom || editUser?.email || ''}`} width={520}>
        <FormGrid cols={1}>
          <FormGroup label="Nom">
            <Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Rôle">
            <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
              <option value={ROLES.SUPER_ADMIN}>🟣 Super Admin</option>
              <option value={ROLES.ADMIN}>🔴 Admin</option>
              <option value={ROLES.STOCK}>🟡 Stock</option>
              <option value={ROLES.LECTURE}>🟢 Lecture seule</option>
            </Select>
          </FormGroup>
          <FormGroup label="Email">
            <Input value={editUser?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </FormGroup>
        </FormGrid>

        {/* Granular Permissions */}
        <div style={{ marginTop: 20, background: 'var(--input-bg)', padding: '16px 18px', borderRadius: 10 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 14 }}>🔧 Permissions granulaires</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['canViewPUMP',    '🔍 Voir les Prix d\'Achat (PUMP)'],
              ['canDelete',      '🗑️ Droit de Suppression'],
              ['canExport',      '📄 Exporter (PDF/Excel)'],
              ['canStock',       '📦 Gérer le Stock (Entrées/Sorties)'],
              ['canCommandes',   '📋 Gérer les Commandes'],
              ['canFacturation', '💰 Gérer la Facturation'],
              ['canClients',     '🏥 Gérer les Clients'],
              ['canRapports',    '📊 Accéder aux Rapports'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.role === ROLES.ADMIN || editForm.role === ROLES.SUPER_ADMIN ? true : !!editForm.permissions?.[key]}
                  disabled={editForm.role === ROLES.ADMIN || editForm.role === ROLES.SUPER_ADMIN}
                  onChange={e => setEditPerm(key, e.target.checked)}
                  style={{ accentColor: '#f97316' }}
                />
                {label}
              </label>
            ))}
          </div>
          {(editForm.role === ROLES.ADMIN || editForm.role === ROLES.SUPER_ADMIN) && (
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Les administrateurs ont toutes les permissions par défaut.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setEditUser(null)}>Annuler</Btn>
          <Btn variant="accent" onClick={handleEditSave}>💾 Enregistrer</Btn>
        </div>
      </Modal>
    </>
  );
}

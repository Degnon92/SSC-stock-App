import React, { useState, useRef, useMemo } from 'react';
import { Modal, Btn, PageHeader, FormGroup, Input, Select, Textarea, SectionCard, Confirm, toast } from './UI';
import { generateInventaire } from '../utils/pdfUtils';
import { GestionUtilisateurs } from './Auth';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ─── TOGGLE SWITCH ──────────────────────────────────────────────────────────
const Toggle = ({ on, onChange, disabled }) => (
  <div
    onClick={disabled ? undefined : onChange}
    style={{
      width: 38, height: 22, borderRadius: 999, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
      background: on ? '#22c55e' : 'var(--border-color)', transition: 'all 0.25s', opacity: disabled ? 0.45 : 1,
      border: `1px solid ${on ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`,
    }}
  >
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
      left: on ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
);


// ─── CARD UTILITAIRE ────────────────────────────────────────────────────────
const SettingsCard = ({ title, icon, children, style }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 14, padding: '22px 24px',
    border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(10,37,64,0.06)', ...style,
  }}>
    {title && (
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
        {title}
      </div>
    )}
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 : SOCIÉTÉ
// ═══════════════════════════════════════════════════════════════════════════
function TabSociete({ store }) {
  const [form, setForm] = useState({ ...store.settings });
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    await store.setSettings(form);
    setSaved(true);
    toast('Paramètres de la société sauvegardés', 'success');
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SettingsCard title="Informations de la société" icon="🏢">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormGroup label="Raison sociale">
              <Input value={form.entreprise || ''} onChange={e => set('entreprise', e.target.value)} placeholder="Surgical Services Consulting" />
            </FormGroup>
            <FormGroup label="RCCM / NIF">
              <Input value={form.rccm || ''} onChange={e => set('rccm', e.target.value)} placeholder="SN/DKR/2024-B..." />
            </FormGroup>
            <FormGroup label="Adresse" style={{ gridColumn: '1 / -1' }}>
              <Input value={form.adresse || ''} onChange={e => set('adresse', e.target.value)} placeholder="Quartier, rue..." />
            </FormGroup>
            <FormGroup label="Ville">
              <Input value={form.ville || ''} onChange={e => set('ville', e.target.value)} placeholder="Dakar" />
            </FormGroup>
            <FormGroup label="Pays">
              <Input value={form.pays || ''} onChange={e => set('pays', e.target.value)} placeholder="Sénégal" />
            </FormGroup>
            <FormGroup label="Email de l'entreprise">
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@ssc.sn" />
            </FormGroup>
            <FormGroup label="Téléphone">
              <Input value={form.tel || ''} onChange={e => set('tel', e.target.value)} placeholder="+221 77 000 00 00" />
            </FormGroup>
            <FormGroup label="Site web">
              <Input value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </FormGroup>
            <FormGroup label="Devise">
              <Select value={form.devise || 'FCFA'} onChange={e => set('devise', e.target.value)}>
                <option value="FCFA">FCFA (Franc CFA)</option>
                <option value="XOF">XOF (Franc CFA BCEAO)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="MAD">MAD (Dirham)</option>
                <option value="GNF">GNF (Franc guinéen)</option>
              </Select>
            </FormGroup>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn variant="accent" onClick={() => setConfirmSave(true)} icon="💾">Sauvegarder</Btn>
            {saved && <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>✅ Sauvegardé !</span>}
          </div>
        </SettingsCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingsCard title="Paramètres du stock" icon="📦">
            <FormGroup label="Seuil d'alerte global par défaut">
              <Input type="number" min="1" value={form.seuil_defaut || 5} onChange={e => set('seuil_defaut', parseInt(e.target.value) || 5)} />
            </FormGroup>
            <FormGroup label="Opérateur par défaut">
              <Input value={form.operateur || ''} onChange={e => set('operateur', e.target.value)} placeholder="Nom affiché" />
            </FormGroup>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.alerteEmail} onChange={e => set('alerteEmail', e.target.checked)} style={{ accentColor: '#f97316', width: 16, height: 16 }} />
                <span>Notifications par email en cas d'alerte stock</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.autoSave !== false} onChange={e => set('autoSave', e.target.checked)} style={{ accentColor: '#f97316', width: 16, height: 16 }} />
                <span>Sauvegarde automatique quotidienne</span>
              </label>
            </div>
            <Btn variant="outline" onClick={() => setConfirmSave(true)} style={{ marginTop: 14 }}>Appliquer</Btn>
          </SettingsCard>

          <SettingsCard title="À propos" icon="ℹ️">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 2.2 }}>
              {[
                ['Application', 'SSC Flow — Gestion de Stock'],
                ['Version', '2.0.0'],
                ['Produits', store.produits?.length || 0],
                ['Fournisseurs', store.fournisseurs?.length || 0],
                ['Mouvements', store.mouvements?.length || 0],
                ['Clients', store.clients?.length || 0],
              ].map(([k, v]) => (
                <div key={k}><strong style={{ color: 'var(--text-main)' }}>{k} :</strong> {v}</div>
              ))}
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* Confirm Save Modal */}
      <Confirm
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Sauvegarder les modifications"
        message="Voulez-vous enregistrer ces nouveaux paramètres pour la société ?"
        confirmLabel="💾 Enregistrer"
        variant="success"
        onConfirm={handleSave}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2b : UTILISATEURS (CARD GRID)
// ═══════════════════════════════════════════════════════════════════════════
const AVATAR_COLORS = ['#e63946', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#0a2540', '#6366f1'];
const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  admin:   { label: 'Admin',        color: '#e63946', bg: 'rgba(230,57,70,0.12)' },
  stock:   { label: 'Gestionnaire', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  lecture: { label: 'Lecteur',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

function TabUtilisateurs({ auth }) {
  const [users, setUsers] = React.useState([]);
  const [editUser, setEditUser] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ nom: '', role: '', permissions: {} });
  const [confirmToggle, setConfirmToggle] = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [confirmPwdReset, setConfirmPwdReset] = React.useState(null);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function toggleActif(u) {
    if (!u) return;
    const newState = u.actif === false ? true : false;
    await setDoc(doc(db, 'users', u.uid), { actif: newState }, { merge: true });
    toast(`Utilisateur ${newState ? 'activé' : 'désactivé'} avec succès`, 'info');
  }

  async function handleDelete(u) {
    if (!u) return;
    const { deleteDoc, doc: fDoc } = await import('firebase/firestore');
    await deleteDoc(fDoc(db, 'users', u.uid));
    toast('Utilisateur supprimé', 'warning');
  }

  async function handleEditSave() {
    if (!editUser) return;
    await setDoc(doc(db, 'users', editUser.uid), {
      nom: editForm.nom, role: editForm.role,
    }, { merge: true });
    setEditUser(null);
    toast('Modifications enregistrées', 'success');
  }


  async function handleResetPwd(u) {
    if (!u.email) { toast('Cet utilisateur n\'a pas d\'email', 'error'); return; }
    try {
      const res = await auth.resetPassword(u.email);
      if (res.success) {
        toast(`Email de réinitialisation envoyé à ${u.email}`, 'success');
      } else {
        toast('Erreur : ' + (res.error || 'Impossible d\'envoyer l\'email'), 'error');
      }
    } catch (e) {
      toast('Erreur : ' + e.message, 'error');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {users.length} utilisateur(s)
        </div>
        {auth.isAdmin && (
          <div>
            <GestionUtilisateurs auth={auth} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {users.map((u, idx) => {
          const rm = ROLE_META[u.role] || ROLE_META.lecture;
          const initials = ((u.nom || u.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase()).substring(0, 2);
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const isActive = u.actif !== false;

          return (
            <div key={u.uid} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14,
              overflow: 'hidden', transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Header */}
              <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'Syne, sans-serif', flexShrink: 0,
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Syne, sans-serif' }}>{u.nom || u.email}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700,
                      color: rm.color, background: rm.bg, border: `1px solid ${rm.color}25`,
                    }}>{rm.label}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700,
                      color: isActive ? '#22c55e' : '#e63946',
                      background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(230,57,70,0.1)',
                    }}>{isActive ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '12px 18px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.85rem' }}>📧</span> {u.email || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.85rem' }}>📞</span> {u.telephone || u.tel || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.85rem' }}>🕒</span> {u.lastSeen ? new Date(u.lastSeen).toLocaleString('fr-FR') : 'Jamais connecté'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.85rem' }}>📅</span> Créé le {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                </div>
              </div>

              {/* Footer actions */}
              {auth.isAdmin && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => { setEditUser(u); setEditForm({ nom: u.nom || '', role: u.role || 'lecture' }); }} style={{
                    padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-page)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                  }}>✏️ Modifier</button>
                  <button onClick={() => setConfirmToggle(u)} style={{
                    padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-page)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'inherit',
                  }}>{isActive ? 'Désactiver' : 'Activer'}</button>
                  <button onClick={() => setConfirmPwdReset(u)} style={{
                    padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-page)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'inherit',
                  }}>🔑 Mdp</button>
                  {u.uid !== auth.user?.uid && u.role !== 'admin' && u.role !== 'super_admin' && (
                    <button onClick={() => setConfirmDelete(u)} style={{
                      padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(230,57,70,0.3)', background: 'rgba(230,57,70,0.06)',
                      cursor: 'pointer', fontSize: '0.78rem', color: '#e63946', marginLeft: 'auto', fontFamily: 'inherit',
                    }}>🗑️</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`✏️ Modifier — ${editUser?.nom || editUser?.email || ''}`} width={460}>
        <FormGroup label="Nom">
          <Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} />
        </FormGroup>
        <FormGroup label="Rôle">
          <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
            <option value="super_admin">🟣 Super Admin</option>
            <option value="admin">🔴 Admin</option>
            <option value="stock">🟡 Gestionnaire</option>
            <option value="lecture">🟢 Lecture seule</option>
          </Select>
        </FormGroup>
        <FormGroup label="Email">
          <Input value={editUser?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setEditUser(null)}>Annuler</Btn>
          <Btn variant="accent" onClick={handleEditSave}>💾 Enregistrer</Btn>
        </div>
      </Modal>

      {/* Confirm password reset modal */}
      <Confirm
        open={!!confirmPwdReset}
        onClose={() => setConfirmPwdReset(null)}
        variant="warning"
        title="Réinitialiser le mot de passe"
        message={`Un email de réinitialisation sera envoyé à ${confirmPwdReset?.email || ''}. L'utilisateur pourra choisir un nouveau mot de passe via le lien reçu.`}
        confirmLabel="📧 Envoyer l'email"
        onConfirm={() => { if (confirmPwdReset) handleResetPwd(confirmPwdReset); }}
      />

      <Confirm
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        variant="warning"
        title="Changer le statut"
        message={`Voulez-vous ${confirmToggle?.actif === false ? 'activer' : 'désactiver'} le compte de ${confirmToggle?.email || ''} ?`}
        confirmLabel={confirmToggle?.actif === false ? '✅ Activer' : '❌ Désactiver'}
        onConfirm={() => { if (confirmToggle) toggleActif(confirmToggle); }}
      />

      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        variant="danger"
        title="Supprimer un utilisateur"
        message={`La suppression du compte ${confirmDelete?.email || ''} est immédiate et irréversible.`}
        confirmLabel="🗑️ Supprimer définitivement"
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete); }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 : PERMISSIONS (MATRICE PAR RÔLE)
// ═══════════════════════════════════════════════════════════════════════════
const MATRIX_MODULES = [
  { key: 'produits',     label: 'Produits & Articles', desc: 'Gestion du catalogue' },
  { key: 'mouvements',   label: 'Mouvements',          desc: 'Entrées et sorties' },
  { key: 'fournisseurs', label: 'Fournisseurs',        desc: 'Répertoire' },
  { key: 'commandes',    label: 'Commandes',           desc: 'Bons de commande' },
  { key: 'rapports',     label: 'Rapports',            desc: 'Exports CSV' },
  { key: 'parametres',   label: 'Paramètres',          desc: 'Configuration' },
];
const MATRIX_ACTIONS = ['voir', 'creer', 'modifier', 'supprimer'];
const MATRIX_LABELS = { voir: 'VOIR', creer: 'CRÉER', modifier: 'MODIFIER', supprimer: 'SUPPRIMER' };

const DEFAULT_ROLE_PERMS = {
  super_admin: {
    produits:     { voir: true, creer: true, modifier: true, supprimer: true },
    mouvements:   { voir: true, creer: true, modifier: true, supprimer: true },
    fournisseurs: { voir: true, creer: true, modifier: true, supprimer: true },
    commandes:    { voir: true, creer: true, modifier: true, supprimer: true },
    rapports:     { voir: true, creer: true, modifier: true, supprimer: true },
    parametres:   { voir: true, creer: true, modifier: true, supprimer: true },
  },
  admin: {
    produits:     { voir: true, creer: true, modifier: true, supprimer: true },
    mouvements:   { voir: true, creer: true, modifier: true, supprimer: true },
    fournisseurs: { voir: true, creer: true, modifier: true, supprimer: false },
    commandes:    { voir: true, creer: true, modifier: true, supprimer: false },
    rapports:     { voir: true, creer: false, modifier: false, supprimer: false },
    parametres:   { voir: true, creer: false, modifier: true, supprimer: false },
  },
  stock: {
    produits:     { voir: true, creer: true, modifier: true, supprimer: false },
    mouvements:   { voir: true, creer: true, modifier: false, supprimer: false },
    fournisseurs: { voir: true, creer: true, modifier: true, supprimer: false },
    commandes:    { voir: true, creer: true, modifier: true, supprimer: false },
    rapports:     { voir: true, creer: false, modifier: false, supprimer: false },
    parametres:   { voir: false, creer: false, modifier: false, supprimer: false },
  },
  lecture: {
    produits:     { voir: true, creer: false, modifier: false, supprimer: false },
    mouvements:   { voir: true, creer: false, modifier: false, supprimer: false },
    fournisseurs: { voir: true, creer: false, modifier: false, supprimer: false },
    commandes:    { voir: true, creer: false, modifier: false, supprimer: false },
    rapports:     { voir: false, creer: false, modifier: false, supprimer: false },
    parametres:   { voir: false, creer: false, modifier: false, supprimer: false },
  },
};

function TabPermissions({ store }) {
  const [perms, setPerms] = useState(() => {
    return store.settings?.rolePermissions || JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMS));
  });
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  function togglePerm(role, mod, action) {
    setPerms(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[role]) next[role] = {};
      if (!next[role][mod]) next[role][mod] = {};
      next[role][mod][action] = !next[role][mod][action];
      return next;
    });
  }

  function setAllPerms(role, val) {
    setPerms(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      MATRIX_MODULES.forEach(m => {
        if (!next[role]) next[role] = {};
        next[role][m.key] = {};
        MATRIX_ACTIONS.forEach(a => { next[role][m.key][a] = val; });
      });
      return next;
    });
  }

  async function handleSave() {
    await store.setSettings({ rolePermissions: perms });
    setSaved(true);
    toast('Permissions sauvegardées avec succès', 'success');
    setTimeout(() => setSaved(false), 2500);
  }

  const thStyle = {
    padding: '10px 20px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700,
    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap',
  };
  const tdStyle = { padding: '14px 16px', borderBottom: '1px solid var(--border-color)' };

  const ROLE_DISPLAY = [
    { key: 'super_admin', label: 'Super Admin', color: '#7c3aed' },
    { key: 'admin',   label: 'Admin',        color: '#0369a1' },
    { key: 'stock',   label: 'Gestionnaire', color: '#f59e0b' },
    { key: 'lecture', label: 'Lecteur',      color: '#22c55e' },
  ];

  return (
    <div>
      <div style={{
        padding: '14px 18px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
        borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
        Les Super Admin ont tous les droits et ne peuvent pas être modifiés. Modifications sauvegardées immédiatement.
      </div>

      {ROLE_DISPLAY.map(role => (
        <div key={role.key} style={{ marginBottom: 28 }}>
          {/* Role header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: role.color, fontSize: '0.95rem' }}>
              {role.label}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setAllPerms(role.key, true)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-page)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'inherit',
              }}>Tout activer</button>
              <button onClick={() => setAllPerms(role.key, false)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-page)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', fontFamily: 'inherit',
              }}>Tout désactiver</button>
            </div>
          </div>

          {/* Permission matrix table */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  <th style={{ ...thStyle, textAlign: 'left', width: '36%', color: '#e2e8f0' }}>MODULE</th>
                  {MATRIX_ACTIONS.map(a => (
                    <th key={a} style={{ ...thStyle, color: '#e2e8f0' }}>{MATRIX_LABELS[a]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_MODULES.map(mod => (
                  <tr key={mod.key}>
                    <td style={{ ...tdStyle }}>
                      <div style={{ fontWeight: 600 }}>{mod.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mod.desc}</div>
                    </td>
                    {MATRIX_ACTIONS.map(action => (
                      <td key={action} style={{ ...tdStyle, textAlign: 'center' }}>
                        <Toggle
                          on={!!(perms[role.key]?.[mod.key]?.[action])}
                          onChange={() => togglePerm(role.key, mod.key, action)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn variant="accent" onClick={() => setConfirmSave(true)} icon="💾">Sauvegarder les permissions</Btn>
        {saved && <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>✅ Permissions sauvegardées !</span>}
      </div>

      <Confirm
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        variant="warning"
        title="Sauvegarder les permissions"
        message="Voulez-vous enregistrer ces nouveaux paramètres de permissions pour tous les rôles ?"
        confirmLabel="💾 Enregistrer"
        onConfirm={handleSave}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 : SAUVEGARDES
// ═══════════════════════════════════════════════════════════════════════════
function TabSauvegardes({ store }) {
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreMode, setRestoreMode] = useState(null);
  const [restoreText, setRestoreText] = useState('');
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmExport, setConfirmExport] = useState(false);
  const fileRef = useRef(null);

  function handleExport() {
    const backup = {
      version: '2.0', date: new Date().toISOString(),
      description: 'Sauvegarde SSC Flow',
      entreprise: store.settings?.entreprise || 'SSC',
      stats: {
        produits: store.produits.length, mouvements: store.mouvements.length,
        fournisseurs: store.fournisseurs.length, clients: store.clients.length,
      },
      data: {
        produits: store.produits, mouvements: store.mouvements,
        fournisseurs: store.fournisseurs, clients: store.clients,
        settings: store.settings,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Sauvegarde JSON téléchargée avec succès', 'success');
  }

  function loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRestoreText(ev.target.result);
    reader.readAsText(file);
  }

  function handleFileSelect(e) { loadFile(e.target.files[0]); }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.json')) loadFile(file);
  }

  async function handleRestore() {
    try {
      setRestoreMsg(null);
      const backup = JSON.parse(restoreText);
      if (!backup.data) throw new Error('Format de sauvegarde invalide.');
      await store.fullRestore(backup.data, restoreMode === 'overwrite');
      setRestoreMsg({ type: 'success', text: '✅ Restauration réussie avec succès !' });
      toast('Données restaurées avec succès', 'success');
      setRestoreText('');
      setTimeout(() => setRestoreModal(false), 2000);
    } catch (err) {
      setRestoreMsg({ type: 'error', text: `❌ Erreur : ${err.message}` });
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingsCard title="Créer une sauvegarde" icon="📤">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Téléchargez toutes vos données (produits, mouvements, clients, fournisseurs) dans un fichier JSON.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="accent" onClick={() => setConfirmExport(true)} icon="💾">Télécharger la sauvegarde (.json)</Btn>
            <Btn variant="blue" onClick={() => generateInventaire({ produits: store.produits, fournisseurs: store.fournisseurs })} icon="📄">
              Exporter inventaire PDF
            </Btn>
          </div>
          <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            💡 Automatisez : faites une sauvegarde JSON chaque fin de semaine.
          </div>
        </SettingsCard>

        <SettingsCard title="Statistiques de la sauvegarde" icon="📊">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Produits', val: store.produits?.length || 0, color: '#f59e0b' },
              { label: 'Mouvements', val: store.mouvements?.length || 0, color: '#0079c1' },
              { label: 'Fournisseurs', val: store.fournisseurs?.length || 0, color: '#7c3aed' },
              { label: 'Clients', val: store.clients?.length || 0, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '14px 10px', background: 'var(--bg-page)', borderRadius: 10 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingsCard title="Restaurer depuis fichier" icon="📥">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#f59e0b' : 'var(--border-color)'}`,
              borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s', background: dragOver ? 'rgba(245,158,11,0.06)' : 'var(--bg-page)',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{dragOver ? '📂' : '📁'}</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cliquez ou glissez un fichier .json</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Fichier de sauvegarde SSC Flow</p>
          </div>
          <input type="file" accept=".json" ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />

          {restoreText && (
            <div style={{ marginTop: 14 }}>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', color: '#22c55e', fontWeight: 500, marginBottom: 10 }}>
                ✅ Fichier chargé et prêt à restaurer.
              </div>
              <Btn variant="primary" onClick={() => setRestoreModal(true)} icon="⬆️">Lancer la restauration</Btn>
            </div>
          )}
        </SettingsCard>

        <SettingsCard title="Informations" icon="💡">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <p>Les données sont stockées dans <strong style={{ color: 'var(--text-main)' }}>Firebase Firestore</strong> — cloud sécurisé et synchronisé en temps réel.</p>
            <p style={{ marginTop: 8 }}>La restauration permet de réimporter des données depuis un fichier JSON. Vous pouvez choisir de <strong style={{ color: 'var(--text-main)' }}>fusionner</strong> ou <strong style={{ color: '#e63946' }}>remplacer</strong> les données actuelles.</p>
          </div>
        </SettingsCard>
      </div>

      <Modal open={restoreModal} onClose={() => setRestoreModal(false)} title="⚠️ Confirmer la restauration" width={500}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Choisissez le mode de restauration :
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            { mode: 'merge', title: 'Fusionner (Ajouter)', desc: 'Ajoute les données de la sauvegarde sans supprimer les données actuelles.', color: '#38bdf8' },
            { mode: 'overwrite', title: 'Remplacer tout (Écraser)', desc: 'Supprime toutes les données actuelles et les remplace par la sauvegarde.', color: '#e63946' },
          ].map(opt => (
            <label key={opt.mode} style={{
              display: 'flex', gap: 12, padding: 16, border: `1px solid ${restoreMode === opt.mode ? opt.color + '40' : 'var(--border-color)'}`,
              borderRadius: 10, cursor: 'pointer', background: restoreMode === opt.mode ? `${opt.color}08` : 'transparent', transition: 'all 0.15s',
            }}>
              <input type="radio" name="restoreMode" checked={restoreMode === opt.mode} onChange={() => setRestoreMode(opt.mode)} style={{ marginTop: 4, accentColor: opt.color }} />
              <div>
                <div style={{ fontWeight: 600, color: opt.mode === 'overwrite' ? '#e63946' : 'var(--text-main)', marginBottom: 4 }}>{opt.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {restoreMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: restoreMsg.type === 'success' ? 'rgba(0,168,120,0.1)' : 'rgba(230,57,70,0.1)', color: restoreMsg.type === 'success' ? '#00a878' : '#e63946', fontSize: '0.82rem' }}>
            {restoreMsg.text}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setRestoreModal(false)}>Annuler</Btn>
          <Btn variant={restoreMode === 'overwrite' ? 'danger' : 'primary'} onClick={handleRestore} disabled={!restoreMode}>
            ✅ Confirmer la restauration
          </Btn>
        </div>
      </Modal>

      <Confirm
        open={confirmExport}
        onClose={() => setConfirmExport(false)}
        variant="info"
        title="Exporter les données"
        message="Voulez-vous générer et télécharger un fichier de sauvegarde (.json) contenant l'intégralité de vos données ?"
        confirmLabel="⬇️ Télécharger"
        onConfirm={handleExport}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 : CATÉGORIES
// ═══════════════════════════════════════════════════════════════════════════
function TabCategories({ store }) {
  const [newCat, setNewCat] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmCatDelete, setConfirmCatDelete] = useState(null);
  const [confirmPurge, setConfirmPurge] = useState(null); // { key, label, count }
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmFullExport, setConfirmFullExport] = useState(false);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set();
    store.produits.forEach(p => { if (p.cat) cats.add(p.cat); });
    // Also add from settings if stored
    if (store.settings?.categories) store.settings.categories.forEach(c => cats.add(c));
    return [...cats].sort();
  }, [store.produits, store.settings]);

  async function addCategory() {
    if (!newCat.trim()) return;
    const existing = store.settings?.categories || [];
    if (!existing.includes(newCat.trim())) {
      await store.setSettings({ categories: [...existing, newCat.trim()] });
      setSaved(true);
      toast(`Catégorie "${newCat.trim()}" ajoutée`, 'success');
      setTimeout(() => setSaved(false), 2000);
    }
    setNewCat('');
  }

  async function removeCategory(cat) {
    const existing = store.settings?.categories || [];
    await store.setSettings({ categories: existing.filter(c => c !== cat) });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <SettingsCard title="Catégories de produits" icon="🏷️">
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." onKeyDown={e => e.key === 'Enter' && setConfirmAdd(true)} style={{ flex: 1 }} />
          <Btn variant="primary" onClick={() => setConfirmAdd(true)}>Ajouter</Btn>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(cat => (
            <div key={cat} style={{
              display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-page)',
              borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border-color)',
            }}>
              <span style={{ padding: '6px 14px', fontSize: '0.85rem', fontWeight: 500 }}>{cat}</span>
              <button
                onClick={() => setConfirmCatDelete(cat)}
                style={{
                  padding: '6px 10px', background: 'none', border: 'none', borderLeft: '1px solid var(--border-color)',
                  cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', transition: '0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e63946'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Supprimer"
              >×</button>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: 10 }}>Aucune catégorie définie</div>
          )}
        </div>
        <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {categories.length} catégorie(s) — Les catégories utilisées par les produits apparaissent automatiquement.
        </div>
        {saved && <div style={{ marginTop: 8, color: '#22c55e', fontSize: '0.82rem', fontWeight: 600 }}>✅ Catégorie ajoutée !</div>}
      </SettingsCard>

      <SettingsCard title="Réinitialisation des données" icon="⚠️">
        <div style={{
          padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span> Actions irréversibles — créez une sauvegarde avant.
        </div>

        {/* Export complet */}
        <div style={{ padding: '14px 16px', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>📦 Exporter toutes les données</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>Téléchargez une copie complète avant toute opération.</div>
          <Btn variant="outline" onClick={() => setConfirmFullExport(true)} icon="💾">Exporter tout (.json)</Btn>
        </div>

        {/* Purge par collection */}
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Purger par collection
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'produits',     label: 'Produits',     icon: '📦', count: store.produits?.length || 0,     color: '#f59e0b' },
            { key: 'mouvements',   label: 'Mouvements',   icon: '🔄', count: store.mouvements?.length || 0,   color: '#0079c1' },
            { key: 'fournisseurs', label: 'Fournisseurs', icon: '🏭', count: store.fournisseurs?.length || 0, color: '#7c3aed' },
            { key: 'clients',     label: 'Clients',      icon: '🏥', count: store.clients?.length || 0,      color: '#22c55e' },
          ].map(col => (
            <div key={col.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10, background: 'var(--bg-page)', border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{col.icon}</span>
                <span style={{ fontWeight: 600 }}>{col.label}</span>
                <span style={{
                  padding: '1px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700,
                  background: `${col.color}18`, color: col.color,
                }}>{col.count}</span>
              </div>
              <button
                onClick={() => setConfirmPurge(col)}
                disabled={col.count === 0}
                style={{
                  padding: '4px 12px', borderRadius: 7, border: '1px solid rgba(230,57,70,0.3)',
                  background: 'rgba(230,57,70,0.06)', color: col.count > 0 ? '#e63946' : '#64748b',
                  cursor: col.count > 0 ? 'pointer' : 'not-allowed', fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: 'inherit', opacity: col.count === 0 ? 0.5 : 1,
                }}
              >🗑️ Purger</button>
            </div>
          ))}
        </div>

        {/* Réinitialiser tout */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10,
              border: '1px solid rgba(230,57,70,0.4)', background: 'rgba(230,57,70,0.08)',
              color: '#e63946', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.08)'; }}
          >🚨 Réinitialiser toute l'application</button>
        </div>
      </SettingsCard>

      <Confirm
        open={confirmAdd}
        onClose={() => setConfirmAdd(false)}
        variant="info"
        title="Ajouter une catégorie"
        message={`Voulez-vous ajouter la catégorie "${newCat.trim()}" ?`}
        confirmLabel="➕ Ajouter"
        onConfirm={addCategory}
      />

      <Confirm
        open={!!confirmCatDelete}
        onClose={() => setConfirmCatDelete(null)}
        variant="warning"
        title="Supprimer la catégorie"
        message={`Voulez-vous vraiment supprimer la catégorie "${confirmCatDelete}" ? Les produits associés ne seront pas modifiés.`}
        confirmLabel="🗑️ Supprimer"
        onConfirm={() => { if (confirmCatDelete) removeCategory(confirmCatDelete); }}
      />
      <Confirm
        open={confirmFullExport}
        onClose={() => setConfirmFullExport(false)}
        variant="info"
        title="Exporter toutes les données"
        message="Voulez-vous générer et télécharger un fichier de sauvegarde (.json) complet ?"
        confirmLabel="⬇️ Télécharger"
        onConfirm={() => {
          const backup = { version: '2.0', date: new Date().toISOString(), data: { produits: store.produits, mouvements: store.mouvements, fournisseurs: store.fournisseurs, clients: store.clients, settings: store.settings } };
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = `ssc-full-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
          toast('Export JSON complet téléchargé avec succès !', 'success');
        }}
      />

      {/* Confirm purge modal */}
      <Confirm
        open={!!confirmPurge}
        onClose={() => setConfirmPurge(null)}
        variant="danger"
        title={`Purger ${confirmPurge?.label || ''}`}
        message={`Vous êtes sur le point de supprimer TOUS les ${(confirmPurge?.label || '').toLowerCase()} (${confirmPurge?.count || 0} éléments). Cette action est irréversible !`}
        confirmLabel="🗑️ Purger maintenant"
        onConfirm={() => {
          if (!confirmPurge) return;
          const clearData = {};
          clearData[confirmPurge.key] = [];
          store.fullRestore(clearData, false);
          toast(`${confirmPurge.label} purgés avec succès`, 'warning');
        }}
      />

      {/* Confirm reset all modal */}
      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        variant="danger"
        title="Réinitialisation complète"
        message="ATTENTION : Cela va supprimer TOUTES les données de l'application (produits, mouvements, fournisseurs, clients). Cette action est DÉFINITIVE et ne peut pas être annulée."
        confirmLabel="🚨 Tout supprimer"
        onConfirm={() => {
          store.fullRestore({ produits: [], mouvements: [], fournisseurs: [], clients: [] }, true);
          toast('Application réinitialisée — toutes les données ont été supprimées', 'warning');
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6 : JOURNAL D'ACTIVITÉ
// ═══════════════════════════════════════════════════════════════════════════
function TabJournal({ store }) {
  const [filter, setFilter] = useState('');
  const logs = store.auditLogs || [];

  const filtered = useMemo(() => {
    let list = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(l => l.action?.toLowerCase().includes(q) || l.module?.toLowerCase().includes(q) || l.user?.toLowerCase().includes(q) || l.desc?.toLowerCase().includes(q));
    }
    return list;
  }, [logs, filter]);

  const MODULE_COLORS = {
    PRODUITS: '#f59e0b', MOUVEMENTS: '#0079c1', FOURNISSEURS: '#7c3aed', COMMANDES: '#22c55e',
    FACTURES: '#ec4899', CLIENTS: '#06b6d4', PARAMÈTRES: '#64748b', LOTS: '#84cc16',
  };
  const ACTION_COLORS = {
    'CRÉATION': '#22c55e', 'MODIFICATION': '#0079c1', 'SUPPRESSION': '#e63946', 'RESTAURATION': '#f59e0b',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {filtered.length} action(s) enregistrée(s) (dernières 100)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Rechercher..." style={{ width: 220, padding: '6px 12px', fontSize: '0.82rem' }} />
        </div>
      </div>

      <SettingsCard>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}>📋</span>
              Aucune activité enregistrée
            </div>
          ) : filtered.map((log, i) => (
            <div key={log.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 4px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                background: ACTION_COLORS[log.action] || '#64748b',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <strong>{log.user || 'Système'}</strong> — {log.desc || log.action}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  {log.date ? new Date(log.date).toLocaleString('fr-FR') : '—'}
                </div>
              </div>
              <span style={{
                padding: '2px 10px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 700,
                color: MODULE_COLORS[log.module] || '#64748b',
                background: `${MODULE_COLORS[log.module] || '#64748b'}15`,
                textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0,
              }}>{log.module || '—'}</span>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 7 : SÉCURITÉ
// ═══════════════════════════════════════════════════════════════════════════
function TabSecurite({ auth }) {
  const [pwdSent, setPwdSent] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmResetPwd, setConfirmResetPwd] = useState(false);

  async function handleResetPwd() {
    if (!auth.user?.email) return;
    setPwdLoading(true);
    const res = await auth.resetPassword(auth.user.email);
    setPwdLoading(false);
    if (res.success) setPwdSent(true);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <SettingsCard title="Mon profil" icon="👤">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 12,
          background: 'var(--bg-page)', border: '1px solid var(--border-color)', marginBottom: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #f97316, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1.3rem', fontFamily: 'Syne, sans-serif',
          }}>
            {(auth.profile?.nom || auth.user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
              {auth.profile?.nom || 'Utilisateur'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{auth.user?.email}</div>
            <span style={{
              display: 'inline-block', marginTop: 6, padding: '3px 12px', borderRadius: 12,
              fontSize: '0.72rem', fontWeight: 700,
              background: (ROLE_META[auth.profile?.role] || ROLE_META.lecture).bg,
              color: (ROLE_META[auth.profile?.role] || ROLE_META.lecture).color,
            }}>
              {(ROLE_META[auth.profile?.role] || { label: auth.profile?.role }).label}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 2.2 }}>
          <div><strong style={{ color: 'var(--text-main)' }}>Email :</strong> {auth.user?.email}</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Rôle :</strong> {auth.profile?.role || 'N/A'}</div>
          <div><strong style={{ color: 'var(--text-main)' }}>UID :</strong> <span style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{auth.user?.uid?.substring(0, 16)}...</span></div>
          <div><strong style={{ color: 'var(--text-main)' }}>Compte créé :</strong> {auth.user?.metadata?.creationTime ? new Date(auth.user.metadata.creationTime).toLocaleDateString('fr-FR') : '—'}</div>
          <div><strong style={{ color: 'var(--text-main)' }}>Dernière connexion :</strong> {auth.user?.metadata?.lastSignInTime ? new Date(auth.user.metadata.lastSignInTime).toLocaleString('fr-FR') : '—'}</div>
        </div>
      </SettingsCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingsCard title="Changer mon mot de passe" icon="🔑">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Vous recevrez un email contenant un lien sécurisé pour choisir un nouveau mot de passe.
          </p>

          {pwdSent ? (
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
              borderRadius: 10, padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📧</div>
              <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>Email envoyé !</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Vérifiez votre boîte mail ({auth.user?.email}).
              </div>
              <Btn variant="outline" onClick={() => setPwdSent(false)} style={{ marginTop: 14 }}>Renvoyer</Btn>
            </div>
          ) : (
            <Btn variant="accent" onClick={() => setConfirmResetPwd(true)} disabled={pwdLoading} icon="📧">
              {pwdLoading ? '⏳ Envoi...' : 'Envoyer le lien de réinitialisation'}
            </Btn>
          )}
        </SettingsCard>

        <SettingsCard title="Sessions & Sécurité" icon="🔒">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 2.2 }}>
            <div><strong style={{ color: 'var(--text-main)' }}>Authentification :</strong> Firebase Auth (Google Cloud)</div>
            <div><strong style={{ color: 'var(--text-main)' }}>Chiffrement :</strong> TLS 1.3 / AES-256</div>
            <div><strong style={{ color: 'var(--text-main)' }}>Stockage :</strong> Firebase Firestore (cloud sécurisé)</div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn variant="danger" onClick={() => setConfirmLogout(true)} icon="🚪">Se déconnecter de cette session</Btn>
          </div>
        </SettingsCard>
      </div>

      <Confirm
        open={confirmResetPwd}
        onClose={() => setConfirmResetPwd(false)}
        variant="warning"
        title="Réinitialiser mon mot de passe"
        message={`Voulez-vous recevoir un email à ${auth.user?.email || 'votre adresse'} pour réinitialiser votre mot de passe ?`}
        confirmLabel="📧 Envoyer l'email"
        onConfirm={handleResetPwd}
      />

      <Confirm
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        variant="danger"
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de cette session ?"
        confirmLabel="🚪 Se déconnecter"
        onConfirm={() => auth.logout && auth.logout()}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PARAMÈTRES COMPLÈTE (7 ONGLETS)
// ═══════════════════════════════════════════════════════════════════════════
export default function Parametres({ store, auth }) {
  const [tab, setTab] = useState('societe');

  const tabs = [
    { id: 'societe',     label: '🏢 Société' },
    { id: 'users',       label: '👥 Utilisateurs' },
    ...(auth.isAdmin ? [{ id: 'permissions', label: '🔐 Permissions' }] : []),
    { id: 'backup',      label: '💾 Sauvegardes' },
    ...(auth.isAdmin ? [{ id: 'categories',  label: '🏷️ Catégories' }] : []),
    { id: 'journal',     label: '📋 Journal' },
    { id: 'securite',    label: '🔒 Sécurité' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="⚙️ Paramètres" />

      {/* TABS */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto', paddingBottom: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#f59e0b' : 'transparent'}`,
            cursor: 'pointer', background: 'none',
            color: tab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: tab === t.id ? 700 : 500,
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--text-main)'; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >{t.label}</button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === 'societe'     && <TabSociete store={store} />}
      {tab === 'users'       && <TabUtilisateurs auth={auth} />}
      {tab === 'permissions' && auth.isAdmin && <TabPermissions store={store} auth={auth} />}
      {tab === 'backup'      && <TabSauvegardes store={store} />}
      {tab === 'categories'  && auth.isAdmin && <TabCategories store={store} />}
      {tab === 'journal'     && <TabJournal store={store} />}
      {tab === 'securite'    && <TabSecurite auth={auth} />}
    </div>
  );
}

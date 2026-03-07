import React, { useState, useRef } from 'react';
import { Modal, Btn, Card, PageHeader, FormGroup, Input, Select, Textarea } from './UI';
import { generateInventaire } from '../utils/pdfUtils';
import { GestionUtilisateurs } from './Auth';

// ─── SAUVEGARDE / RESTAURATION ────────────────────────────────────────────────
function BackupRestore({ store }) {
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreMode,  setRestoreMode]  = useState(null);
  const [restoreText,  setRestoreText]  = useState('');
  const [restoreMsg,   setRestoreMsg]   = useState(null);
  const fileRef = useRef(null);

  function handleExport() {
    const backup = {
      version: '2.0',
      date: new Date().toISOString(),
      entreprise: 'Surgical Services Consulting',
      data: {
        produits:     store.produits,
        mouvements:   store.mouvements,
        fournisseurs: store.fournisseurs,
        clients:      store.clients,
        settings:     store.settings,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ssc-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRestoreText(ev.target.result);
    reader.readAsText(file);
  }

  async function handleRestore() {
    try {
      setRestoreMsg(null);
      const backup = JSON.parse(restoreText);
      if (!backup.data) throw new Error('Format de sauvegarde invalide.');
      
      await store.fullRestore(backup.data, restoreMode === 'overwrite');
      
      setRestoreMsg({ type: 'success', text: `✅ Restauration réussie avec succès !` });
      setRestoreText('');
      setTimeout(() => setRestoreModal(false), 2000);
    } catch (err) {
      setRestoreMsg({ type: 'error', text: `❌ Erreur : ${err.message}` });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* EXPORT */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>📤 Exporter une sauvegarde</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Téléchargez toutes vos données (produits, mouvements, clients, fournisseurs) dans un fichier JSON.
          Conservez ce fichier sur un disque externe ou en cloud.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="accent" onClick={handleExport} icon="💾">Télécharger la sauvegarde (.json)</Btn>
          <Btn variant="blue" onClick={() => generateInventaire({ produits: store.produits, fournisseurs: store.fournisseurs })} icon="📄">
            Exporter inventaire PDF
          </Btn>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          💡 Automatisez : faites une sauvegarde JSON chaque fin de semaine.
        </div>
      </div>

      {/* IMPORT */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>📥 Restaurer une sauvegarde</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Restaurez toutes vos données. Vous pourrez choisir de fusionner avec les données actuelles ou de tout remplacer.
        </p>
        <input type="file" accept=".json" ref={fileRef} style={{ display: 'none' }} onChange={handleFileSelect} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="outline" onClick={() => fileRef.current?.click()} icon="📂">Choisir un fichier .json</Btn>
          {restoreText && <Btn variant="primary" onClick={() => setRestoreModal(true)} icon="⬆️">Lancer la restauration</Btn>}
        </div>
        {restoreText && (
          <div style={{ marginTop: 10, background: 'var(--input-bg)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ✅ Fichier chargé. Cliquez sur "Lancer la restauration" pour confirmer.
          </div>
        )}
      </div>

      <Modal open={restoreModal} onClose={() => setRestoreModal(false)} title="⚠️ Confirmer la restauration" width={500}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          Vous êtes sur le point de restaurer des données. Veuillez choisir le mode de restauration :
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <label style={{ display: 'flex', gap: 12, padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', background: restoreMode === 'merge' ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
            <input type="radio" name="restoreMode" checked={restoreMode === 'merge'} onChange={() => setRestoreMode('merge')} style={{ marginTop: 4 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>Fusionner (Ajouter)</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ajoute les données de la sauvegarde à vos données actuelles. Ne supprime rien. Idéal pour synchroniser des données manquantes.</div>
            </div>
          </label>
          <label style={{ display: 'flex', gap: 12, padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', background: restoreMode === 'overwrite' ? 'rgba(230, 57, 70, 0.1)' : 'transparent', borderColor: restoreMode === 'overwrite' ? 'rgba(230, 57, 70, 0.3)' : 'var(--border-color)' }}>
            <input type="radio" name="restoreMode" checked={restoreMode === 'overwrite'} onChange={() => setRestoreMode('overwrite')} style={{ marginTop: 4 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#e63946', marginBottom: 4 }}>Remplacer tout (Écraser)</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supprime toutes vos données actuelles et les remplace intégralement par celles de la sauvegarde.</div>
            </div>
          </label>
        </div>

        {restoreMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: restoreMsg.type === 'success' ? 'rgba(0,168,120,0.1)' : 'rgba(230,57,70,0.1)', color: restoreMsg.type === 'success' ? '#00a878' : '#e63946', fontSize: '0.82rem' }}>
            {restoreMsg.text}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setRestoreModal(false)}>Annuler</Btn>
          <Btn variant={restoreMode === 'overwrite' ? "danger" : "primary"} onClick={handleRestore} disabled={!restoreMode}>
             ✅ Confirmer la restauration
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── PARAMÈTRES GÉNÉRAUX ─────────────────────────────────────────────────────
function ParametresGeneraux({ store }) {
  const [form, setForm] = useState({ ...store.settings });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    await store.setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 20 }}>⚙️ Paramètres généraux</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormGroup label="Nom de l'entreprise">
          <Input value={form.entreprise || ''} onChange={e => set('entreprise', e.target.value)} placeholder="Surgical Services Consulting" />
        </FormGroup>
        <FormGroup label="Devise">
          <Select value={form.devise || 'FCFA'} onChange={e => set('devise', e.target.value)}>
            <option value="FCFA">FCFA</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="MAD">MAD (Dirham)</option>
          </Select>
        </FormGroup>
        <FormGroup label="Opérateur par défaut">
          <Input value={form.operateur || ''} onChange={e => set('operateur', e.target.value)} placeholder="Nom affiché par défaut" />
        </FormGroup>
        <FormGroup label="Seuil d'alerte global par défaut">
          <Input type="number" min="1" value={form.seuil_defaut || 5} onChange={e => set('seuil_defaut', parseInt(e.target.value) || 5)} />
        </FormGroup>
        <FormGroup label="Adresse / Ville" style={{ gridColumn: '1 / -1' }}>
          <Input value={form.adresse || ''} onChange={e => set('adresse', e.target.value)} placeholder="Dakar, Sénégal" />
        </FormGroup>
        <FormGroup label="Téléphone de l'entreprise">
          <Input value={form.tel || ''} onChange={e => set('tel', e.target.value)} placeholder="+221 77 000 00 00" />
        </FormGroup>
        <FormGroup label="Email de l'entreprise">
          <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contact@ssc.sn" />
        </FormGroup>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn variant="accent" onClick={handleSave}>💾 Enregistrer les paramètres</Btn>
        {saved && <span style={{ color: '#00a878', fontSize: '0.85rem' }}>✅ Paramètres sauvegardés !</span>}
      </div>
    </div>
  );
}

// ─── PAGE PARAMÈTRES COMPLÈTE ─────────────────────────────────────────────────
export default function Parametres({ store, auth }) {
  const [tab, setTab] = useState('general');
  const tabs = [
    { id: 'general',   label: '⚙️ Général' },
    { id: 'backup',    label: '💾 Sauvegarde' },
    { id: 'users',     label: '👥 Utilisateurs' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="⚙️ Paramètres" />

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', borderRadius: 10, padding: 6, border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--text-main)' : 'transparent',
            color: tab === t.id ? '#fff' : 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: tab === t.id ? 600 : 400,
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'general' && <ParametresGeneraux store={store} />}
      {tab === 'backup'  && <BackupRestore store={store} />}
      {tab === 'users'   && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>👥 Gestion des utilisateurs</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            Créez des comptes pour votre équipe. Chaque utilisateur accède à l'app avec son email et mot de passe.
          </p>
          {auth.isAdmin
            ? <GestionUtilisateurs auth={auth} />
            : <div style={{ color: '#e63946', fontSize: '0.875rem' }}>⛔ Seul un administrateur peut gérer les utilisateurs.</div>
          }
        </div>
      )}
    </div>
  );
}

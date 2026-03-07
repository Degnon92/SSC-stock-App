import React, { useState } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Textarea, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Confirm, Empty, SectionCard } from './UI';

// ─── ALERTES ─────────────────────────────────────────────────────────────────
export function Alertes({ store, onNavigate }) {
  const { alertes, ruptures, stockFaible, expirationProche, predictionsRupture = [] } = store;

  const AlertItem = ({ p, type }) => {
    const isRupture = p.stock === 0;
    const isExpiration = type === 'expiration';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f0f4f8', borderLeft: `4px solid ${isRupture ? '#e63946' : isExpiration ? '#0079c1' : '#f4a261'}` }}>
        <span style={{ fontSize: '1.5rem' }}>{isRupture ? '🚨' : isExpiration ? '⏰' : '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.ref} — {p.nom}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {isExpiration
              ? `Date d'expiration: ${new Date(p.date_expiration).toLocaleDateString('fr-FR')} — Stock: ${p.stock} unités`
              : `Stock actuel: ${p.stock} unité(s) — Seuil: ${p.seuil} — ${isRupture ? 'RUPTURE TOTALE' : 'Stock insuffisant'}`}
          </div>
        </div>
        <Badge variant={isRupture ? 'danger' : isExpiration ? 'info' : 'warn'}>
          {isRupture ? 'Rupture' : isExpiration ? 'Expiration' : `Stock: ${p.stock}`}
        </Badge>
        <Btn variant="outline" size="sm" onClick={() => onNavigate('mouvements')}>Réapprovisionner</Btn>
      </div>
    );
  };

  const PredictionItem = ({ p }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f0f4f8', borderLeft: '4px solid #7c3aed' }}>
      <span style={{ fontSize: '1.5rem' }}>🔮</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.ref} — {p.nom}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
          Sortie moy. estimée : <strong>{p.vsj.toFixed(1)} / jour</strong> — Stock actuel : {p.stock}
        </div>
      </div>
      <Badge variant="warn" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
        Rupture dans ~{p.joursRestants} jour{p.joursRestants > 1 ? 's' : ''}
      </Badge>
      <Btn variant="outline" size="sm" onClick={() => onNavigate('commandes')}>Commander</Btn>
    </div>
  );

  const total = ruptures.length + stockFaible.length + expirationProche.length + predictionsRupture.length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🔔 Alertes de Stock">
        <span style={{ background: total > 0 ? '#e63946' : '#00a878', color: '#fff', borderRadius: 20, padding: '5px 14px', fontSize: '0.85rem', fontWeight: 700 }}>{total} alerte(s)</span>
      </PageHeader>

      {total === 0 ? (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#00a878', marginBottom: 8 }}>Tout est en ordre !</h3>
          <p style={{ color: 'var(--text-muted)' }}>Tous les niveaux de stock sont satisfaisants et aucune expiration proche.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ruptures.length > 0 && (
            <SectionCard title={`🚨 Ruptures de stock (${ruptures.length})`}>
              {ruptures.map(p => <AlertItem key={p.id} p={p} />)}
            </SectionCard>
          )}
          {stockFaible.length > 0 && (
            <SectionCard title={`⚠️ Stock faible (${stockFaible.length})`}>
              {stockFaible.map(p => <AlertItem key={p.id} p={p} />)}
            </SectionCard>
          )}
          {expirationProche.length > 0 && (
            <SectionCard title={`⏰ Expirations proches — 90 jours (${expirationProche.length})`}>
              {expirationProche.map(p => <AlertItem key={p.id} p={p} type="expiration" />)}
            </SectionCard>
          )}
          {predictionsRupture.length > 0 && (
            <SectionCard title={`🔮 Prédictions Intelligentes (Ruptures imminentes)`}>
              {predictionsRupture.map(p => <PredictionItem key={p.id} p={p} />)}
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FOURNISSEURS ─────────────────────────────────────────────────────────────
const EMPTY_F = { nom: '', contact: '', tel: '', email: '', pays: '', ville: '', spec: '' };

export function Fournisseurs({ store }) {
  const { fournisseurs, produits, addFournisseur, updateFournisseur, deleteFournisseur } = store;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_F);
  const [confirmId, setConfirmId] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = fournisseurs.filter(f => !search || f.nom.toLowerCase().includes(search.toLowerCase()) || (f.contact||'').toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditId(null); setForm(EMPTY_F); setModalOpen(true); }
  function openEdit(f) { setEditId(f.id); setForm({ ...f }); setModalOpen(true); }
  function save() {
    if (!form.nom) return alert('Le nom est obligatoire.');
    if (editId) updateFournisseur(editId, form);
    else addFournisseur(form);
    setModalOpen(false);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🏭 Fournisseurs">
        <Btn variant="accent" onClick={openAdd} icon="➕">Nouveau fournisseur</Btn>
      </PageHeader>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un fournisseur..." />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} fournisseur(s)</span>
        </Toolbar>
        <Table headers={['Société', 'Contact', 'Téléphone', 'Email', 'Localisation', 'Spécialités', 'Produits', 'Actions']}
          empty={filtered.length === 0 ? <Empty icon="🏭" message="Aucun fournisseur" action={<Btn variant="accent" size="sm" onClick={openAdd}>Ajouter</Btn>} /> : null}>
          {filtered.map(f => {
            const nbProd = produits.filter(p => p.fourn_id === f.id).length;
            return (
              <Tr key={f.id}>
                <Td><strong>{f.nom}</strong></Td>
                <Td>{f.contact || '—'}</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{f.tel || '—'}</Td>
                <Td style={{ color: '#0079c1' }}>{f.email || '—'}</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{[f.ville, f.pays].filter(Boolean).join(', ') || '—'}</Td>
                <Td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.spec || '—'}</span></Td>
                <Td><Badge variant="info">{nbProd} réf.</Badge></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => openEdit(f)}>✏️</Btn>
                    <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => setConfirmId(f.id)}>🗑️</Btn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Modifier fournisseur' : '➕ Nouveau fournisseur'} width={560}>
        <FormGrid cols={2}>
          <FormGroup label="Nom de la société *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Raison sociale" /></FormGroup>
          <FormGroup label="Contact"><Input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Responsable commercial" /></FormGroup>
          <FormGroup label="Téléphone"><Input value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+221 77 000 00 00" /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@..." /></FormGroup>
          <FormGroup label="Pays"><Input value={form.pays} onChange={e => set('pays', e.target.value)} placeholder="France, Sénégal..." /></FormGroup>
          <FormGroup label="Ville"><Input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris, Dakar..." /></FormGroup>
          <FormGroup label="Spécialités" full><Input value={form.spec} onChange={e => set('spec', e.target.value)} placeholder="ex: Prothèses de hanche, implants dentaires..." /></FormGroup>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModalOpen(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={save}>💾 Enregistrer</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => deleteFournisseur(confirmId)} message="Supprimer ce fournisseur ? Les produits associés ne seront pas affectés." />
    </div>
  );
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
const CLIENT_TYPES = ['Hôpital public', 'Clinique privée', 'Hôpital militaire', 'Cabinet médical', 'Autre'];
const EMPTY_C = { nom: '', contact: '', tel: '', email: '', type: 'Hôpital public', pays: 'Sénégal', ville: '', actif: true };

export function Clients({ store }) {
  const { clients, mouvements, addClient, updateClient, deleteClient } = store;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_C);
  const [confirmId, setConfirmId] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = clients.filter(c => !search || c.nom.toLowerCase().includes(search.toLowerCase()) || (c.contact||'').toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditId(null); setForm(EMPTY_C); setModalOpen(true); }
  function openEdit(c) { setEditId(c.id); setForm({ ...c }); setModalOpen(true); }
  function save() {
    if (!form.nom) return alert('Le nom est obligatoire.');
    if (editId) updateClient(editId, form);
    else addClient(form);
    setModalOpen(false);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🏥 Clients">
        <Btn variant="accent" onClick={openAdd} icon="➕">Nouveau client</Btn>
      </PageHeader>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un client, hôpital, clinique..." />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} client(s)</span>
        </Toolbar>
        <Table headers={['Établissement', 'Type', 'Contact', 'Téléphone', 'Email', 'Localisation', 'Commandes', 'Actions']}
          empty={filtered.length === 0 ? <Empty icon="🏥" message="Aucun client" action={<Btn variant="accent" size="sm" onClick={openAdd}>Ajouter</Btn>} /> : null}>
          {filtered.map(c => {
            const nbCmds = mouvements.filter(m => m.type === 'Sortie' && m.client_fourn === c.nom).length;
            const ca = mouvements.filter(m => m.type === 'Sortie' && m.client_fourn === c.nom).reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);
            return (
              <Tr key={c.id}>
                <Td><strong>{c.nom}</strong></Td>
                <Td><span style={{ background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem' }}>{c.type}</span></Td>
                <Td>{c.contact || '—'}</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{c.tel || '—'}</Td>
                <Td style={{ color: '#0079c1' }}>{c.email || '—'}</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{[c.ville, c.pays].filter(Boolean).join(', ') || '—'}</Td>
                <Td>
                  <div style={{ fontSize: '0.78rem' }}>
                    <Badge variant="info">{nbCmds} cmd.</Badge>
                    {ca > 0 && <div style={{ color: '#00a878', fontWeight: 600, marginTop: 2 }}>{ca.toLocaleString('fr-FR')} F</div>}
                  </div>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => openEdit(c)}>✏️</Btn>
                    <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => setConfirmId(c.id)}>🗑️</Btn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Modifier client' : '➕ Nouveau client'} width={560}>
        <FormGrid cols={2}>
          <FormGroup label="Nom de l'établissement *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="CHU de Dakar..." /></FormGroup>
          <FormGroup label="Type">
            <Select value={form.type} onChange={e => set('type', e.target.value)}>
              {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Contact"><Input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nom du responsable" /></FormGroup>
          <FormGroup label="Téléphone"><Input value={form.tel} onChange={e => set('tel', e.target.value)} /></FormGroup>
          <FormGroup label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></FormGroup>
          <FormGroup label="Pays"><Input value={form.pays} onChange={e => set('pays', e.target.value)} /></FormGroup>
          <FormGroup label="Ville"><Input value={form.ville} onChange={e => set('ville', e.target.value)} /></FormGroup>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModalOpen(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={save}>💾 Enregistrer</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => deleteClient(confirmId)} message="Supprimer ce client ?" />
    </div>
  );
}

// ─── RAPPORTS ─────────────────────────────────────────────────────────────────
export function Rapports({ store }) {
  const { produits, mouvements, clients, fournisseurs, valeurStock, valeurVente } = store;

  const caTotal = mouvements.filter(m => m.type === 'Sortie').reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);
  const achatTotal = mouvements.filter(m => m.type === 'Entrée').reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);

  // Top produits vendus
  const ventesPar = {};
  mouvements.filter(m => m.type === 'Sortie').forEach(m => {
    ventesPar[m.produit_nom] = (ventesPar[m.produit_nom] || { qte: 0, ca: 0 });
    ventesPar[m.produit_nom].qte += m.qte;
    ventesPar[m.produit_nom].ca += m.qte * (m.prix_unitaire || 0);
  });
  const topVentes = Object.entries(ventesPar).sort((a, b) => b[1].ca - a[1].ca).slice(0, 8);

  // Top clients
  const caParClient = {};
  mouvements.filter(m => m.type === 'Sortie').forEach(m => {
    if (!m.client_fourn) return;
    caParClient[m.client_fourn] = (caParClient[m.client_fourn] || 0) + m.qte * (m.prix_unitaire || 0);
  });
  const topClients = Object.entries(caParClient).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📊 Rapports & Analyses" />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'CA total (ventes)', value: caTotal.toLocaleString('fr-FR') + ' F', color: '#00a878' },
          { label: 'Achats total', value: achatTotal.toLocaleString('fr-FR') + ' F', color: '#e63946' },
          { label: 'Valeur stock actuel', value: valeurStock.toLocaleString('fr-FR') + ' F', color: '#0079c1' },
          { label: 'Valeur revente possible', value: valeurVente.toLocaleString('fr-FR') + ' F', color: '#7c3aed' },
          { label: 'Marge potentielle', value: (valeurVente - valeurStock).toLocaleString('fr-FR') + ' F', color: '#00a878' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '18px 20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* TOP PRODUITS */}
        <SectionCard title="🏆 Top produits (par chiffre d'affaires)">
          {topVentes.length === 0 ? <Empty icon="📦" message="Aucune vente enregistrée" /> : topVentes.map(([nom, d], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #f0f4f8' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: i < 3 ? '#f4a261' : '#a0aec0', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#00a878', fontSize: '0.85rem' }}>{d.ca.toLocaleString('fr-FR')} F</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.qte} unités</div>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* TOP CLIENTS */}
        <SectionCard title="🏥 Top clients (par CA)">
          {topClients.length === 0 ? <Empty icon="🏥" message="Aucun client avec ventes" /> : topClients.map(([nom, ca], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #f0f4f8' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: i < 3 ? '#0079c1' : '#a0aec0', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{nom}</div>
              <div style={{ fontWeight: 700, color: '#0079c1', fontSize: '0.85rem' }}>{ca.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export function AuditLogs({ store }) {
  const { auditLogs = [] } = store;
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter(l =>
    (l.user || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.module || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.desc || '').toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action) => {
    switch (action) {
      case 'CRÉATION': return { bg: 'rgba(0,168,120,0.15)', color: '#00a878' };
      case 'MODIFICATION': return { bg: 'rgba(0,121,193,0.15)', color: '#0079c1' };
      case 'SUPPRESSION': return { bg: 'rgba(230,57,70,0.15)', color: '#e63946' };
      case 'ALERTE': return { bg: 'rgba(244,162,97,0.15)', color: '#f4a261' };
      default: return { bg: 'rgba(148,163,184,0.15)', color: '#64748b' };
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🛡️ Historique d'Audit (Logs)">
        <Badge variant="info">{filtered.length} logs enregistrés</Badge>
      </PageHeader>
      <Card>
        <Toolbar>
          <SearchBar placeholder="Rechercher un log (utilisateur, action, module...)" value={search} onChange={setSearch} />
        </Toolbar>
        <Table headers={['Date & Heure', 'Utilisateur', 'Action', 'Module', 'Détails']}
          empty={filtered.length === 0 ? <Empty icon="🛡️" message={search ? 'Aucun log ne correspond à votre recherche.' : 'Aucune activité enregistrée pour le moment.'} /> : null}>
          {filtered.map(log => {
            const c = getActionColor(log.action);
            return (
              <Tr key={log.id} style={{ fontSize: '0.85rem' }}>
                <Td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(log.date).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleTimeString('fr-FR')}</div>
                </Td>
                <Td style={{ fontWeight: 600 }}>{log.user}</Td>
                <Td>
                  <span style={{ display: 'inline-block', background: c.bg, color: c.color, padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.5 }}>
                    {log.action}
                  </span>
                </Td>
                <Td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{log.module}</Td>
                <Td style={{ color: 'var(--text-main)' }}>{log.desc}</Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}


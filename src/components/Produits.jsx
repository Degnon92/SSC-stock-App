import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Textarea, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Confirm, Empty } from './UI';
import { CATEGORIES } from '../data/initialData';

function statusInfo(p) {
  if (p.stock === 0) return { label: 'Rupture', variant: 'danger' };
  if (p.stock <= p.seuil) return { label: 'Stock faible', variant: 'warn' };
  return { label: 'Disponible', variant: 'ok' };
}

const EMPTY_FORM = { ref: '', nom: '', cat: 'Prothèses', stock: 0, seuil: 5, prix_achat: 0, prix_vente: 0, fourn_id: '', desc: '', localisation: '', date_expiration: '' };

export default function Produits({ store }) {
  const { produits, fournisseurs, addProduit, updateProduit, deleteProduit } = store;

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState(null);
  const [detailProd, setDetailProd] = useState(null);

  const filtered = useMemo(() => {
    let arr = [...produits];
    if (search) arr = arr.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase()));
    if (catFilter) arr = arr.filter(p => p.cat === catFilter);
    if (statusFilter === 'rupture') arr = arr.filter(p => p.stock === 0);
    else if (statusFilter === 'faible') arr = arr.filter(p => p.stock > 0 && p.stock <= p.seuil);
    else if (statusFilter === 'ok') arr = arr.filter(p => p.stock > p.seuil);
    return arr;
  }, [produits, search, catFilter, statusFilter]);

  function openAdd() { setEditId(null); setForm(EMPTY_FORM); setModalOpen(true); }
  function openEdit(p) { setEditId(p.id); setForm({ ...p, fourn_id: p.fourn_id || '', date_expiration: p.date_expiration || '' }); setModalOpen(true); }

  function save() {
    if (!form.ref || !form.nom) return alert('Référence et désignation sont obligatoires.');
    if (editId) updateProduit(editId, form);
    else addProduit(form);
    setModalOpen(false);
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📦 Catalogue Produits">
        <Btn variant="accent" onClick={openAdd} icon="➕">Nouveau produit</Btn>
      </PageHeader>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un produit, référence..." />
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="ok">Disponible</option>
            <option value="faible">Stock faible</option>
            <option value="rupture">Rupture</option>
          </Select>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} produit(s)</span>
        </Toolbar>

        <Table headers={['Référence', 'Désignation', 'Catégorie', 'Stock', 'Seuil', 'Prix achat', 'Prix vente', 'Statut', 'Actions']}
          empty={filtered.length === 0 ? <Empty message="Aucun produit trouvé" action={<Btn variant="accent" size="sm" onClick={openAdd} icon="➕">Ajouter</Btn>} /> : null}>
          {filtered.map(p => {
            const s = statusInfo(p);
            const fourn = fournisseurs.find(f => f.id === p.fourn_id);
            return (
              <Tr key={p.id}>
                <Td><span style={{ fontFamily: 'monospace', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem' }}>{p.ref}</span></Td>
                <Td style={{ maxWidth: 220 }}>
                  <div style={{ fontWeight: 600 }}>{p.nom}</div>
                  {p.localisation && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {p.localisation}</div>}
                </Td>
                <Td><span style={{ background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem' }}>{p.cat}</span></Td>
                <Td><strong style={{ fontSize: '1rem' }}>{p.stock}</strong></Td>
                <Td style={{ color: 'var(--text-muted)' }}>{p.seuil}</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{p.prix_achat.toLocaleString()} F</Td>
                <Td style={{ fontWeight: 600, color: '#00a878' }}>{p.prix_vente.toLocaleString()} F</Td>
                <Td><Badge variant={s.variant}>{s.label}</Badge></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => setDetailProd(p)}>👁️</Btn>
                    <Btn variant="outline" size="sm" onClick={() => openEdit(p)}>✏️</Btn>
                    <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => setConfirmId(p.id)}>🗑️</Btn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      {/* ADD / EDIT MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Modifier le produit' : '➕ Nouveau produit'} width={620}>
        <FormGrid cols={2}>
          <FormGroup label="Référence *"><Input value={form.ref} onChange={e => set('ref', e.target.value)} placeholder="ex: PRO-001" /></FormGroup>
          <FormGroup label="Catégorie *">
            <Select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Désignation *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom complet du produit" /></FormGroup>
          <FormGroup label="Stock initial"><Input type="number" min="0" value={form.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)} /></FormGroup>
          <FormGroup label="Seuil d'alerte"><Input type="number" min="0" value={form.seuil} onChange={e => set('seuil', parseInt(e.target.value) || 0)} /></FormGroup>
          <FormGroup label="Prix achat (FCFA)"><Input type="number" min="0" value={form.prix_achat} onChange={e => set('prix_achat', parseFloat(e.target.value) || 0)} /></FormGroup>
          <FormGroup label="Prix vente (FCFA)"><Input type="number" min="0" value={form.prix_vente} onChange={e => set('prix_vente', parseFloat(e.target.value) || 0)} /></FormGroup>
          <FormGroup label="Fournisseur">
            <Select value={form.fourn_id} onChange={e => set('fourn_id', parseInt(e.target.value) || '')}>
              <option value="">— Aucun —</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Localisation (rayon)"><Input value={form.localisation} onChange={e => set('localisation', e.target.value)} placeholder="ex: Rayon A1" /></FormGroup>
          <FormGroup label="Date d'expiration"><Input type="date" value={form.date_expiration} onChange={e => set('date_expiration', e.target.value)} /></FormGroup>
          <FormGroup label="Description / Notes" full><Textarea value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Informations supplémentaires..." /></FormGroup>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModalOpen(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={save}>💾 Enregistrer</Btn>
        </div>
      </Modal>

      {/* DETAIL MODAL */}
      {detailProd && (
        <Modal open={!!detailProd} onClose={() => setDetailProd(null)} title={`📋 ${detailProd.ref} — ${detailProd.nom}`} width={500}>
          {[
            ['Catégorie', detailProd.cat],
            ['Stock actuel', <strong style={{ fontSize: '1.2rem' }}>{detailProd.stock} unités</strong>],
            ['Seuil alerte', detailProd.seuil],
            ['Prix achat', `${detailProd.prix_achat.toLocaleString()} FCFA`],
            ['Prix vente', `${detailProd.prix_vente.toLocaleString()} FCFA`],
            ['Marge unitaire', `${(detailProd.prix_vente - detailProd.prix_achat).toLocaleString()} FCFA (${detailProd.prix_vente > 0 ? (((detailProd.prix_vente - detailProd.prix_achat) / detailProd.prix_vente) * 100).toFixed(1) : 0}%)`],
            ['Valeur stock', `${(detailProd.stock * detailProd.prix_achat).toLocaleString()} FCFA`],
            ['Localisation', detailProd.localisation || '—'],
            ['Date expiration', detailProd.date_expiration ? new Date(detailProd.date_expiration).toLocaleDateString('fr-FR') : '—'],
            ['Notes', detailProd.desc || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f4f8', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{k}</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => { setDetailProd(null); openEdit(detailProd); }}>✏️ Modifier</Btn>
            <Btn variant="outline" onClick={() => setDetailProd(null)}>Fermer</Btn>
          </div>
        </Modal>
      )}

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => deleteProduit(confirmId)}
        message="Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible." />
    </div>
  );
}

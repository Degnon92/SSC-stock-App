import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Empty, SectionCard, Confirm } from './UI';

// ─── GESTION DES LOTS & TRAÇABILITÉ ─────────────────────────────────────────
export function Lots({ store }) {
  const { lots, produits, fournisseurs, clients, addLot, updateLot, deleteLot } = store;
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [editId,  setEditId]  = useState(null);
  const EMPTY = { produit_id: '', numero_lot: '', date_fabrication: '', date_expiration: '', quantite: 0, fourn_id: '', notes: '', statut: 'Actif' };
  const [form, setForm] = useState(EMPTY);
  const [confirmLotId, setConfirmLotId] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const arr = lots || [];
    if (!search) return arr;
    return arr.filter(l =>
      l.numero_lot?.toLowerCase().includes(search.toLowerCase()) ||
      (produits.find(p => p.id === l.produit_id)?.nom || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [lots, produits, search]);

  function openAdd() { setEditId(null); setForm(EMPTY); setModal(true); }
  function openEdit(l) { setEditId(l.id); setForm({ ...l }); setModal(true); }

  async function save() {
    if (!form.produit_id || !form.numero_lot) return alert('Produit et numéro de lot requis.');
    if (editId) await updateLot(editId, form);
    else await addLot(form);
    setModal(false);
  }

  function statusVariant(s) {
    return s === 'Actif' ? 'ok' : s === 'Épuisé' ? 'neutral' : 'danger';
  }

  // Lots bientôt expirés (< 90 jours)
  const expBientot = (lots || []).filter(l => {
    if (!l.date_expiration) return false;
    const diff = (new Date(l.date_expiration) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🔬 Lots & Traçabilité">
        <Btn variant="accent" onClick={openAdd} icon="➕">Enregistrer un lot</Btn>
      </PageHeader>

      {expBientot.length > 0 && (
        <div style={{ background: 'rgba(244,162,97,0.1)', border: '1px solid rgba(244,162,97,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.3rem' }}>⏰</span>
          <div style={{ fontSize: '0.85rem' }}>
            <strong>{expBientot.length} lot(s)</strong> expirent dans moins de 90 jours.{' '}
            {expBientot.map(l => <span key={l.id} style={{ background: 'rgba(244,162,97,0.2)', padding: '2px 8px', borderRadius: 4, margin: '0 3px', fontSize: '0.78rem' }}>{l.numero_lot}</span>)}
          </div>
        </div>
      )}

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un lot, produit..." />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} lot(s)</span>
        </Toolbar>
        <Table headers={['N° Lot', 'Produit', 'Quantité', 'Fabrication', 'Expiration', 'Fournisseur', 'Statut', 'Notes', 'Actions']}
          empty={filtered.length === 0 ? <Empty icon="🔬" message="Aucun lot enregistré" action={<Btn variant="accent" size="sm" onClick={openAdd}>Ajouter</Btn>} /> : null}>
          {filtered.map(l => {
            const prod  = produits.find(p => p.id === l.produit_id);
            const fourn = fournisseurs.find(f => f.id === l.fourn_id);
            const jours = l.date_expiration ? Math.round((new Date(l.date_expiration) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <Tr key={l.id}>
                <Td><span style={{ fontFamily: 'monospace', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700 }}>{l.numero_lot}</span></Td>
                <Td><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prod?.nom || '—'}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{prod?.ref}</div></Td>
                <Td><strong>{l.quantite}</strong> unités</Td>
                <Td style={{ color: 'var(--text-muted)' }}>{l.date_fabrication ? new Date(l.date_fabrication).toLocaleDateString('fr-FR') : '—'}</Td>
                <Td>
                  {l.date_expiration ? (
                    <div>
                      <div style={{ fontWeight: 600, color: jours !== null && jours <= 90 ? '#c07828' : 'var(--text-main)', fontSize: '0.82rem' }}>
                        {new Date(l.date_expiration).toLocaleDateString('fr-FR')}
                      </div>
                      {jours !== null && jours <= 90 && jours >= 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#c07828' }}>⏰ dans {jours}j</div>
                      )}
                      {jours !== null && jours < 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#e63946' }}>❌ Expiré</div>
                      )}
                    </div>
                  ) : '—'}
                </Td>
                <Td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fourn?.nom || '—'}</Td>
                <Td><Badge variant={statusVariant(l.statut)}>{l.statut}</Badge></Td>
                <Td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.notes || '—'}</Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => openEdit(l)}>✏️</Btn>
                    <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => setConfirmLotId(l.id)}>🗑️</Btn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? '✏️ Modifier le lot' : '🔬 Enregistrer un lot'} width={560}>
        <FormGrid cols={2}>
          <FormGroup label="Produit *" full>
            <Select value={form.produit_id} onChange={e => set('produit_id', parseInt(e.target.value) || '')}>
              <option value="">— Sélectionner —</option>
              {produits.map(p => <option key={p.id} value={p.id}>{p.ref} — {p.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Numéro de lot *">
            <Input value={form.numero_lot} onChange={e => set('numero_lot', e.target.value)} placeholder="ex: LOT-2025-001" />
          </FormGroup>
          <FormGroup label="Quantité">
            <Input type="number" min="0" value={form.quantite} onChange={e => set('quantite', parseInt(e.target.value) || 0)} />
          </FormGroup>
          <FormGroup label="Date de fabrication">
            <Input type="date" value={form.date_fabrication} onChange={e => set('date_fabrication', e.target.value)} />
          </FormGroup>
          <FormGroup label="Date d'expiration">
            <Input type="date" value={form.date_expiration} onChange={e => set('date_expiration', e.target.value)} />
          </FormGroup>
          <FormGroup label="Fournisseur">
            <Select value={form.fourn_id} onChange={e => set('fourn_id', parseInt(e.target.value) || '')}>
              <option value="">— Aucun —</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Statut">
            <Select value={form.statut} onChange={e => set('statut', e.target.value)}>
              <option value="Actif">Actif</option>
              <option value="Épuisé">Épuisé</option>
              <option value="Retiré">Retiré du marché</option>
            </Select>
          </FormGroup>
          <FormGroup label="Notes / Observations" full>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Remarques sur ce lot..." />
          </FormGroup>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={save}>💾 Enregistrer</Btn>
        </div>
      </Modal>

      {/* CONFIRM DELETE */}
      <Confirm open={!!confirmLotId} onClose={() => setConfirmLotId(null)} onConfirm={() => deleteLot(confirmLotId)} message="Voulez-vous vraiment supprimer ce lot ?" />
    </div>
  );
}

// ─── HISTORIQUE PRIX FOURNISSEURS ─────────────────────────────────────────────
export function HistoriquePrix({ store }) {
  const { historiquePrix, produits, fournisseurs, addHistoriquePrix } = store;
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const EMPTY = { produit_id: '', fourn_id: '', prix: 0, date: new Date().toISOString().slice(0, 10), notes: '' };
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const arr = (historiquePrix || []).sort((a, b) => b.date?.localeCompare(a.date));
    if (!search) return arr;
    return arr.filter(h =>
      (produits.find(p => p.id === h.produit_id)?.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (fournisseurs.find(f => f.id === h.fourn_id)?.nom || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [historiquePrix, produits, fournisseurs, search]);

  // Grouper par produit pour afficher l'évolution
  const parProduit = useMemo(() => {
    const groups = {};
    (historiquePrix || []).forEach(h => {
      if (!groups[h.produit_id]) groups[h.produit_id] = [];
      groups[h.produit_id].push(h);
    });
    return groups;
  }, [historiquePrix]);

  async function save() {
    if (!form.produit_id || !form.fourn_id || !form.prix) return alert('Produit, fournisseur et prix requis.');
    await addHistoriquePrix(form);
    setModal(false);
    setForm(EMPTY);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📉 Historique des Prix Fournisseurs">
        <Btn variant="accent" onClick={() => setModal(true)} icon="➕">Enregistrer un prix</Btn>
      </PageHeader>

      {/* Évolution résumée */}
      {Object.keys(parProduit).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 12 }}>
            📊 Évolution des prix par produit
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Object.entries(parProduit).slice(0, 6).map(([pid, entries]) => {
              const prod  = produits.find(p => p.id === parseInt(pid));
              const sorted = [...entries].sort((a, b) => a.date?.localeCompare(b.date));
              const first  = sorted[0]?.prix || 0;
              const last   = sorted[sorted.length - 1]?.prix || 0;
              const trend  = last > first ? '📈' : last < first ? '📉' : '➡️';
              const pct    = first > 0 ? (((last - first) / first) * 100).toFixed(1) : 0;
              return (
                <div key={pid} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod?.nom || `Produit #${pid}`}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Premier prix: <strong>{first.toLocaleString('fr-FR')} F</strong></span>
                    <span>Dernier: <strong>{last.toLocaleString('fr-FR')} F</strong></span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.85rem', fontWeight: 700, color: last > first ? '#e63946' : last < first ? '#00a878' : 'var(--text-muted)' }}>
                    {trend} {pct !== 0 ? `${pct > 0 ? '+' : ''}${pct}%` : 'Stable'} sur {entries.length} saisies
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par produit ou fournisseur..." />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} entrée(s)</span>
        </Toolbar>
        <Table headers={['Date', 'Produit', 'Fournisseur', 'Prix enregistré', 'Variation', 'Notes']}
          empty={filtered.length === 0 ? <Empty icon="📉" message="Aucun historique de prix" action={<Btn variant="accent" size="sm" onClick={() => setModal(true)}>Ajouter</Btn>} /> : null}>
          {filtered.map((h, i) => {
            const prod  = produits.find(p => p.id === h.produit_id);
            const fourn = fournisseurs.find(f => f.id === h.fourn_id);
            const prev  = filtered[i + 1];
            const hasPrev = prev && prev.produit_id === h.produit_id;
            const variation = hasPrev ? (((h.prix - prev.prix) / prev.prix) * 100).toFixed(1) : null;
            return (
              <Tr key={h.id}>
                <Td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h.date}</Td>
                <Td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{prod?.nom || '—'}<div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{prod?.ref}</div></Td>
                <Td style={{ color: 'var(--text-muted)' }}>{fourn?.nom || '—'}</Td>
                <Td><strong style={{ fontSize: '1rem' }}>{(h.prix || 0).toLocaleString('fr-FR')} FCFA</strong></Td>
                <Td>
                  {variation !== null ? (
                    <Badge variant={parseFloat(variation) > 0 ? 'danger' : parseFloat(variation) < 0 ? 'ok' : 'neutral'}>
                      {parseFloat(variation) > 0 ? '▲' : parseFloat(variation) < 0 ? '▼' : '='} {Math.abs(variation)}%
                    </Badge>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                </Td>
                <Td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h.notes || '—'}</Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="📉 Enregistrer un prix fournisseur" width={480}>
        <FormGrid cols={2}>
          <FormGroup label="Produit *" full>
            <Select value={form.produit_id} onChange={e => set('produit_id', parseInt(e.target.value) || '')}>
              <option value="">— Sélectionner —</option>
              {produits.map(p => <option key={p.id} value={p.id}>{p.ref} — {p.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Fournisseur *">
            <Select value={form.fourn_id} onChange={e => set('fourn_id', parseInt(e.target.value) || '')}>
              <option value="">— Sélectionner —</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Prix d'achat (FCFA) *">
            <Input type="number" min="0" value={form.prix} onChange={e => set('prix', parseFloat(e.target.value) || 0)} />
          </FormGroup>
          <FormGroup label="Date">
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGroup>
          <FormGroup label="Notes" full>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="ex: Tarif remisé commande >10, hausse matières premières..." />
          </FormGroup>
        </FormGrid>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={save}>💾 Enregistrer</Btn>
        </div>
      </Modal>
    </div>
  );
}

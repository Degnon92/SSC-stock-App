import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Empty, Confirm } from './UI';
import { generateFacture } from '../utils/pdfUtils';

const STATUTS = ['Brouillon', 'Émise', 'Payée', 'Annulée'];
const STATUS_VARIANT = { Brouillon: 'neutral', Émise: 'info', Payée: 'ok', Annulée: 'danger' };

export default function Facturation({ store }) {
  const { factures, produits, clients, fournisseurs, addFacture, updateFacture, deleteFacture } = store;
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal,       setModal]       = useState(false);
  const [detailId,    setDetailId]    = useState(null);
  const [confirmFactureId, setConfirmFactureId] = useState(null);

  const EMPTY_FACTURE = {
    client_id: '',
    date: new Date().toISOString().slice(0, 10),
    echeance: '',
    statut: 'Brouillon',
    lignes: [],
    remise: 0,
    notes: '',
    operateur: store.settings?.operateur || '',
  };
  const [form, setForm] = useState(EMPTY_FACTURE);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Ligne vide
  const EMPTY_LIGNE = { produit_id: '', ref: '', nom: '', qte: 1, prix_unitaire: 0 };

  function addLigne() {
    set('lignes', [...form.lignes, { ...EMPTY_LIGNE, _id: Date.now() }]);
  }
  function updateLigne(idx, field, value) {
    const lignes = [...form.lignes];
    lignes[idx] = { ...lignes[idx], [field]: value };
    if (field === 'produit_id') {
      const p = produits.find(x => x.id === parseInt(value));
      if (p) {
        lignes[idx].ref = p.ref;
        lignes[idx].nom = p.nom;
        lignes[idx].prix_unitaire = p.prix_vente || 0;
      }
    }
    set('lignes', lignes);
  }
  function removeLigne(idx) {
    set('lignes', form.lignes.filter((_, i) => i !== idx));
  }

  const sousTotal = form.lignes.reduce((s, l) => s + (l.qte || 0) * (l.prix_unitaire || 0), 0);
  const remiseAmt = sousTotal * ((form.remise || 0) / 100);
  const totalTTC  = sousTotal - remiseAmt;

  async function handleSave() {
    if (!form.client_id) return alert('Client obligatoire.');
    if (form.lignes.length === 0) return alert('Ajoutez au moins une ligne.');
    const num = `FAC-${new Date().getFullYear()}-${String((factures?.length || 0) + 1).padStart(4, '0')}`;
    await addFacture({ ...form, numero: num, sousTotal, remiseAmt, totalTTC });
    setModal(false);
    setForm(EMPTY_FACTURE);
  }

  async function handleUpdateStatut(id, statut) {
    await updateFacture(id, { statut });
  }

  async function handlePDF(facture) {
    const client = clients.find(c => c.id === facture.client_id);
    generateFacture({
      client,
      lignes: facture.lignes,
      operateur: facture.operateur,
      notes: facture.notes,
      remise: facture.remise || 0,
    });
  }

  const filtered = useMemo(() => {
    let arr = [...(factures || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (search) arr = arr.filter(f =>
      f.numero?.toLowerCase().includes(search.toLowerCase()) ||
      (clients.find(c => c.id === f.client_id)?.nom || '').toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter) arr = arr.filter(f => f.statut === statusFilter);
    return arr;
  }, [factures, clients, search, statusFilter]);

  const caTotal    = (factures || []).filter(f => f.statut === 'Payée').reduce((s, f) => s + (f.totalTTC || 0), 0);
  const nbEmises   = (factures || []).filter(f => f.statut === 'Émise').length;
  const nbBrouillons = (factures || []).filter(f => f.statut === 'Brouillon').length;
  const detailFac  = factures?.find(f => f.id === detailId);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🧾 Facturation">
        <Btn variant="accent" onClick={() => { setForm(EMPTY_FACTURE); setModal(true); }} icon="➕">Nouvelle facture</Btn>
      </PageHeader>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'CA encaissé', value: caTotal.toLocaleString('fr-FR') + ' F', color: '#00a878', icon: '💰' },
          { label: 'Factures émises', value: nbEmises, color: '#0079c1', icon: '📄' },
          { label: 'Brouillons', value: nbBrouillons, color: '#f4a261', icon: '✏️' },
          { label: 'Total factures', value: factures?.length || 0, color: 'var(--text-muted)', icon: '🧾' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '16px 20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.icon} {s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par numéro, client..." />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} facture(s)</span>
        </Toolbar>
        <Table headers={['N° Facture', 'Client', 'Date', 'Échéance', 'Montant TTC', 'Statut', 'Actions']}
          empty={filtered.length === 0 ? <Empty icon="🧾" message="Aucune facture" action={<Btn variant="accent" size="sm" onClick={() => setModal(true)}>Créer</Btn>} /> : null}>
          {filtered.map(f => {
            const client = clients.find(c => c.id === f.client_id);
            return (
              <Tr key={f.id}>
                <Td><span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'var(--bg-page)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{f.numero}</span></Td>
                <Td><strong>{client?.nom || '—'}</strong></Td>
                <Td style={{ color: 'var(--text-muted)' }}>{f.date}</Td>
                <Td style={{ color: f.echeance && new Date(f.echeance) < new Date() && f.statut === 'Émise' ? '#e63946' : 'var(--text-muted)' }}>
                  {f.echeance || '—'}
                  {f.echeance && new Date(f.echeance) < new Date() && f.statut === 'Émise' && <div style={{ fontSize: '0.7rem', color: '#e63946' }}>⚠️ En retard</div>}
                </Td>
                <Td><strong style={{ color: '#00a878' }}>{(f.totalTTC || 0).toLocaleString('fr-FR')} FCFA</strong></Td>
                <Td>
                  <Select value={f.statut} onChange={e => handleUpdateStatut(f.id, e.target.value)}
                    style={{ padding: '3px 8px', fontSize: '0.78rem', border: 'none', background: 'transparent', fontWeight: 600,
                      color: f.statut === 'Payée' ? '#00a878' : f.statut === 'Émise' ? '#0079c1' : f.statut === 'Annulée' ? '#e63946' : 'var(--text-muted)' }}>
                    {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => setDetailId(f.id)}>👁️</Btn>
                    <Btn variant="blue" size="sm" onClick={() => handlePDF(f)}>PDF</Btn>
                    <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => setConfirmFactureId(f.id)}>🗑️</Btn>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>

      {/* MODAL CRÉATION */}
      <Modal open={modal} onClose={() => setModal(false)} title="🧾 Nouvelle facture" width={700}>
        <FormGrid cols={3}>
          <FormGroup label="Client *">
            <Select value={form.client_id} onChange={e => set('client_id', parseInt(e.target.value) || '')}>
              <option value="">— Sélectionner —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Date">
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGroup>
          <FormGroup label="Date d'échéance">
            <Input type="date" value={form.echeance} onChange={e => set('echeance', e.target.value)} />
          </FormGroup>
          <FormGroup label="Opérateur">
            <Input value={form.operateur} onChange={e => set('operateur', e.target.value)} />
          </FormGroup>
          <FormGroup label="Remise globale (%)">
            <Input type="number" min="0" max="100" value={form.remise} onChange={e => set('remise', parseFloat(e.target.value) || 0)} />
          </FormGroup>
          <FormGroup label="Statut">
            <Select value={form.statut} onChange={e => set('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormGroup>
        </FormGrid>

        {/* LIGNES */}
        <div style={{ margin: '20px 0 10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>Lignes de facturation</div>
        {form.lignes.map((l, i) => (
          <div key={l._id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
            <FormGroup label={i === 0 ? 'Produit' : ''}>
              <Select value={l.produit_id} onChange={e => updateLigne(i, 'produit_id', e.target.value)}>
                <option value="">— Produit —</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.ref} — {p.nom}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label={i === 0 ? 'Qté' : ''}>
              <Input type="number" min="1" value={l.qte} onChange={e => updateLigne(i, 'qte', parseInt(e.target.value) || 1)} />
            </FormGroup>
            <FormGroup label={i === 0 ? 'Prix unit. (FCFA)' : ''}>
              <Input type="number" min="0" value={l.prix_unitaire} onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} />
            </FormGroup>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'right' }}>{(l.qte * l.prix_unitaire).toLocaleString('fr-FR')} F</div>
              <Btn variant="outline" size="sm" style={{ color: '#e63946' }} onClick={() => removeLigne(i)}>✕</Btn>
            </div>
          </div>
        ))}

        <Btn variant="outline" size="sm" onClick={addLigne} icon="➕" style={{ marginBottom: 16 }}>Ajouter une ligne</Btn>

        {form.lignes.length > 0 && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 8, padding: '12px 16px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-muted)' }}>
              <span>Sous-total</span><span>{sousTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {form.remise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#e63946' }}>
                <span>Remise ({form.remise}%)</span><span>- {remiseAmt.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 4 }}>
              <span>TOTAL TTC</span><span style={{ color: '#00a878' }}>{totalTTC.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        <FormGroup label="Notes / Conditions" style={{ marginTop: 16 }}>
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Conditions de paiement, remarques..." />
        </FormGroup>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn variant="primary" onClick={handleSave}>💾 Enregistrer</Btn>
          <Btn variant="accent" onClick={async () => { await handleSave(); }}>✅ Enregistrer & Émettre</Btn>
        </div>
      </Modal>

      {/* MODAL DÉTAIL */}
      {detailFac && (
        <Modal open={!!detailId} onClose={() => setDetailId(null)} title={`🧾 Facture ${detailFac.numero}`} width={600}>
          {(() => {
            const client = clients.find(c => c.id === detailFac.client_id);
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[['Client', client?.nom], ['Date', detailFac.date], ['Échéance', detailFac.echeance || '—'], ['Opérateur', detailFac.operateur], ['Statut', detailFac.statut]].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--input-bg)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{k}</div>
                      <div style={{ fontWeight: 600, marginTop: 4 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 16 }}>
                  <thead><tr style={{ background: 'var(--bg-page)' }}>
                    {['Produit', 'Qté', 'Prix unit.', 'Total'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(detailFac.lignes || []).map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{l.nom}</td>
                        <td style={{ padding: '10px 12px' }}>{l.qte}</td>
                        <td style={{ padding: '10px 12px' }}>{(l.prix_unitaire || 0).toLocaleString('fr-FR')} F</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{(l.qte * l.prix_unitaire).toLocaleString('fr-FR')} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#00a878' }}>
                  TOTAL : {(detailFac.totalTTC || 0).toLocaleString('fr-FR')} FCFA
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                  <Btn variant="blue" onClick={() => handlePDF(detailFac)} icon="📄">Télécharger PDF</Btn>
                  <Btn variant="outline" onClick={() => setDetailId(null)}>Fermer</Btn>
                </div>
              </>
            );
          })()}
        </Modal>
      )}

      {/* CONFIRM DELETE */}
      <Confirm open={!!confirmFactureId} onClose={() => setConfirmFactureId(null)} onConfirm={() => deleteFacture(confirmFactureId)} message="Voulez-vous vraiment supprimer cette facture ?" />
    </div>
  );
}

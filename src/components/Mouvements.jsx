import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Empty } from './UI';

const EMPTY_FORM = { produit_id: '', qte: 1, date: new Date().toISOString().slice(0,10), motif: '', operateur: '', client_fourn: '', prix_unitaire: 0 };

export default function Mouvements({ store }) {
  const { produits, mouvements, clients, fournisseurs, addMouvement, settings } = store;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalType, setModalType] = useState(null); // 'Entrée' | 'Sortie'
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    let arr = [...mouvements].reverse();
    if (search) arr = arr.filter(m => m.produit_nom.toLowerCase().includes(search.toLowerCase()) || (m.motif||'').toLowerCase().includes(search.toLowerCase()) || (m.client_fourn||'').toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) arr = arr.filter(m => m.type === typeFilter);
    return arr;
  }, [mouvements, search, typeFilter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function openModal(type) {
    setModalType(type);
    const defaultFourn = type === 'Entrée' ? (fournisseurs[0]?.nom || '') : '';
    const defaultClient = type === 'Sortie' ? (clients[0]?.nom || '') : '';
    setForm({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
      operateur: settings.operateur || '',
      client_fourn: type === 'Entrée' ? defaultFourn : defaultClient,
    });
  }

  function handleProduitChange(id) {
    const p = produits.find(x => x.id === parseInt(id));
    set('produit_id', id);
    if (p) set('prix_unitaire', modalType === 'Entrée' ? p.prix_achat : p.prix_vente);
  }

  function save() {
    if (!form.produit_id || !form.qte || form.qte < 1) return alert('Produit et quantité sont obligatoires.');
    const p = produits.find(x => x.id === parseInt(form.produit_id));
    if (!p) return;
    if (modalType === 'Sortie' && form.qte > p.stock) return alert(`Stock insuffisant ! Stock actuel: ${p.stock} unités.`);
    addMouvement({
      produit_id: p.id,
      produit_nom: p.nom,
      type: modalType,
      qte: parseInt(form.qte),
      date: form.date,
      motif: form.motif,
      operateur: form.operateur,
      client_fourn: form.client_fourn,
      prix_unitaire: parseFloat(form.prix_unitaire) || 0,
    });
    setModalType(null);
  }

  // Totals
  const totalEntrees = mouvements.filter(m => m.type === 'Entrée').reduce((s, m) => s + m.qte, 0);
  const totalSorties = mouvements.filter(m => m.type === 'Sortie').reduce((s, m) => s + m.qte, 0);
  const caTotal = mouvements.filter(m => m.type === 'Sortie').reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🔄 Mouvements de Stock">
        <Btn variant="accent" onClick={() => openModal('Entrée')} icon="▲">Entrée en stock</Btn>
        <Btn variant="danger" onClick={() => openModal('Sortie')} icon="▼">Sortie de stock</Btn>
      </PageHeader>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 22 }}>
        {[
          { label: 'Total entrées', value: totalEntrees + ' unités', color: '#00a878', icon: '▲' },
          { label: 'Total sorties', value: totalSorties + ' unités', color: '#e63946', icon: '▼' },
          { label: "Chiffre d'affaires", value: caTotal.toLocaleString('fr-FR') + ' FCFA', color: '#0079c1', icon: '💵' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '16px 20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.icon} {s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par produit, client, motif..." />
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="Entrée">Entrées uniquement</option>
            <option value="Sortie">Sorties uniquement</option>
          </Select>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} mouvement(s)</span>
        </Toolbar>

        <Table headers={['Date', 'Produit', 'Type', 'Quantité', 'Prix unit.', 'Montant', 'Client / Fournisseur', 'Motif', 'Opérateur']}
          empty={filtered.length === 0 ? <Empty icon="🔄" message="Aucun mouvement enregistré" /> : null}>
          {filtered.map(m => (
            <Tr key={m.id}>
              <Td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.date}</Td>
              <Td style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.produit_nom}</Td>
              <Td><Badge variant={m.type === 'Entrée' ? 'ok' : 'danger'}>{m.type === 'Entrée' ? '▲' : '▼'} {m.type}</Badge></Td>
              <Td><strong style={{ fontSize: '1rem' }}>{m.qte}</strong></Td>
              <Td style={{ color: 'var(--text-muted)' }}>{m.prix_unitaire ? m.prix_unitaire.toLocaleString() + ' F' : '—'}</Td>
              <Td style={{ fontWeight: 600, color: m.type === 'Sortie' ? '#00a878' : 'var(--text-muted)' }}>{m.prix_unitaire ? (m.qte * m.prix_unitaire).toLocaleString() + ' F' : '—'}</Td>
              <Td style={{ color: 'var(--text-muted)' }}>{m.client_fourn || '—'}</Td>
              <Td style={{ color: 'var(--text-muted)' }}>{m.motif || '—'}</Td>
              <Td style={{ color: 'var(--text-muted)' }}>{m.operateur || '—'}</Td>
            </Tr>
          ))}
        </Table>
      </Card>

      {/* MODAL ENTREE / SORTIE */}
      <Modal open={!!modalType} onClose={() => setModalType(null)}
        title={modalType === 'Entrée' ? '📦 Enregistrer une entrée en stock' : '🔻 Enregistrer une sortie de stock'}
        width={560}>
        <FormGrid cols={2}>
          <FormGroup label="Produit *" full>
            <Select value={form.produit_id} onChange={e => handleProduitChange(e.target.value)}>
              <option value="">— Sélectionner un produit —</option>
              {produits.map(p => <option key={p.id} value={p.id}>{p.ref} — {p.nom} (Stock: {p.stock})</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Quantité *">
            <Input type="number" min="1" value={form.qte} onChange={e => set('qte', parseInt(e.target.value) || 1)} />
          </FormGroup>
          <FormGroup label="Date">
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormGroup>
          <FormGroup label="Prix unitaire (FCFA)">
            <Input type="number" min="0" value={form.prix_unitaire} onChange={e => set('prix_unitaire', parseFloat(e.target.value) || 0)} />
          </FormGroup>
          <FormGroup label={modalType === 'Entrée' ? 'Fournisseur' : 'Client'} full>
            <Select value={form.client_fourn} onChange={e => set('client_fourn', e.target.value)}>
              <option value="">— Saisie manuelle —</option>
              {modalType === 'Entrée'
                ? fournisseurs.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)
                : clients.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)
              }
            </Select>
          </FormGroup>
          <FormGroup label="Motif / Référence commande">
            <Input value={form.motif} onChange={e => set('motif', e.target.value)} placeholder={modalType === 'Entrée' ? 'ex: Commande n°123' : 'ex: Chirurgie Dr. Fall'} />
          </FormGroup>
          <FormGroup label="Opérateur">
            <Input value={form.operateur} onChange={e => set('operateur', e.target.value)} placeholder="Votre nom" />
          </FormGroup>
        </FormGrid>
        {form.produit_id && form.qte > 0 && form.prix_unitaire > 0 && (
          <div style={{ background: 'var(--input-bg)', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: '0.85rem', color: 'var(--text-main)' }}>
            💵 Montant total: <strong>{(form.qte * form.prix_unitaire).toLocaleString()} FCFA</strong>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModalType(null)}>Annuler</Btn>
          <Btn variant={modalType === 'Entrée' ? 'accent' : 'danger'} onClick={save}>
            {modalType === 'Entrée' ? '✅ Valider l\'entrée' : '✅ Valider la sortie'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Btn, SearchBar, PageHeader, Card, StatCard, Empty } from './UI';
import { generatePremiumPDF, generatePremiumExcel } from '../utils/exportUtils';

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

  function handleExportPDF() {
    const columns = [
      { key: 'date', header: 'DATE' },
      { key: 'produit_nom', header: 'PRODUIT DESIGNATION' },
      { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QTE', align: 'center' },
      { key: 'prix_unitaire', header: 'P.UNIT', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT', isCurrency: true, align: 'right' },
      { key: 'client_fourn', header: 'TIERS' },
      { key: 'motif', header: 'MOTIF' },
      { key: 'operateur', header: 'OPERATEUR' },
    ];
    const data = filtered.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    generatePremiumPDF({ title: 'Historique des Mouvements', data, columns, filename: 'Mouvements_Stock' });
  }

  function handleExportExcel() {
    const columns = [
      { key: 'date', header: 'DATE' },
      { key: 'produit_nom', header: 'PRODUIT DESIGNATION' },
      { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QUANTITE', align: 'center' },
      { key: 'prix_unitaire', header: 'PRIX UNITAIRE', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT EXACT', isCurrency: true, align: 'right' },
      { key: 'client_fourn', header: 'CLIENT / FOURNISSEUR' },
      { key: 'motif', header: 'MOTIF' },
      { key: 'operateur', header: 'OPERATEUR' },
    ];
    const data = filtered.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    generatePremiumExcel({ title: 'HISTORIQUE DES MOUVEMENTS DE STOCK', data, columns, filename: 'Mouvements_Stock' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="🔄 Mouvements de Stock">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant="outline" icon="📄" onClick={handleExportPDF}>Rapport PDF</Btn>
          <Btn variant="outline" icon="📊" onClick={handleExportExcel}>Excel Premium</Btn>
          <Btn variant="accent" onClick={() => openModal('Entrée')} icon="▲">Entrée en stock</Btn>
          <Btn variant="danger" onClick={() => openModal('Sortie')} icon="▼">Sortie de stock</Btn>
        </div>
      </PageHeader>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 28 }}>
        <StatCard label="Total entrées" value={totalEntrees} sub="Unités stockées" color="green" icon="▲" />
        <StatCard label="Total sorties" value={totalSorties} sub="Unités sorties" color="danger" icon="▼" />
        <StatCard label="Chiffre d'affaires" value={caTotal.toLocaleString('fr-FR')} sub="FCFA" color="blue" icon="💵" />
      </div>

      {/* Barre d'outils / Filtres */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par produit, client, motif..." />
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ minWidth: 180, padding: '10px 16px', borderRadius: 12 }}>
          <option value="">Tous les types</option>
          <option value="Entrée">Entrées uniquement</option>
          <option value="Sortie">Sorties uniquement</option>
        </Select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto', paddingRight: 10 }}>{filtered.length} mouvement(s)</span>
      </div>

      {/* TIMELINE */}
      <style>{`
        .timeline-container { position: relative; padding-left: 24px; padding-top: 10px; }
        @media (min-width: 640px) { .timeline-container { padding-left: 48px; } }
        .timeline-line {
          position: absolute; left: 11px; top: 0; bottom: 0; width: 2px;
          background: linear-gradient(to bottom, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0.1) 100%);
          box-shadow: 0 0 10px rgba(99,102,241,0.3); z-index: 0;
        }
        @media (min-width: 640px) { .timeline-line { left: 23px; } }
        
        .glow-Entrée { box-shadow: inset 4px 0 0 0 #22c55e, 0 8px 32px 0 rgba(0,0,0,0.37), 0 0 20px -5px rgba(34,197,94,0.15); }
        .glow-Sortie { box-shadow: inset 4px 0 0 0 #ef4444, 0 8px 32px 0 rgba(0,0,0,0.37), 0 0 20px -5px rgba(239,68,68,0.15); }
        .glow-Ajustement { box-shadow: inset 4px 0 0 0 #f59e0b, 0 8px 32px 0 rgba(0,0,0,0.37), 0 0 20px -5px rgba(245,158,11,0.15); }

        @media (max-width: 639px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
      
      {filtered.length === 0 ? (
        <Empty icon="🔄" message="Aucun mouvement enregistré." />
      ) : (
        <div className="timeline-container">
          <div className="timeline-line hidden-mobile"></div>
          {filtered.map(m => {
            const isEntree = m.type === 'Entrée';
            const isSortie = m.type === 'Sortie';
            const typeColor = isEntree ? '#4ade80' : isSortie ? '#f87171' : '#fbbf24';
            const typeBg = isEntree ? 'rgba(34,197,94,0.1)' : isSortie ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
            const glowClass = `glow-${m.type}`;
            const dateStr = (m.date || '').substring(0, 10);
            
            return (
              <div key={m.id} style={{ position: 'relative', zIndex: 10, marginBottom: '24px' }}>
                 {/* Pastille chronologique */}
                 <div style={{ position: 'absolute', left: '-42px', top: '24px', width: '36px', height: '36px', borderRadius: '50%', background: '#020617', border: `2px solid ${typeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${typeBg}`, zIndex: 20 }} className="hidden-mobile">
                    {isEntree ? <span style={{ color: typeColor, fontSize: '1.2rem', lineHeight: 1 }}>↓</span> : isSortie ? <span style={{ color: typeColor, fontSize: '1.2rem', lineHeight: 1 }}>↑</span> : <span style={{ color: typeColor, fontSize: '1rem' }}>↻</span>}
                 </div>

                 <article className={`glass-card ${glowClass}`} style={{ 
                   background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px', 
                   padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)' 
                 }}>
                   
                   {/* Bloc Gauche : Produit & Date */}
                   <div style={{ flex: '1 1 250px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                       <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>{dateStr}</span>
                       <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 600, color: typeColor, background: typeBg, padding: '2px 8px', borderRadius: '6px', border: `1px solid ${typeColor}30`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.type}</span>
                     </div>
                     <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff', marginBottom: '4px', lineHeight: 1.2 }}>{m.produit_nom}</h3>
                     {m.motif && <p style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 500 }}>{m.motif}</p>}
                   </div>

                   {/* Bloc Centre : Quantité */}
                   <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ background: typeBg, border: `1px solid ${typeColor}20`, borderRadius: '16px', padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                       <span style={{ fontSize: '0.6rem', color: typeColor, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>{isEntree ? 'Entrée' : isSortie ? 'Sortie' : 'Quantité'}</span>
                       <span style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 800, color: typeColor }}>{isEntree ? '+' : isSortie ? '-' : ''}{m.qte}</span>
                     </div>
                   </div>

                   {/* Bloc Droit : Utilisateur & Montant */}
                   <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right', alignItems: 'flex-end' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                       <span style={{ fontWeight: 500 }}>{m.operateur || 'Système'}</span>
                       <span style={{ opacity: 0.5 }}>👤</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                       <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>{m.client_fourn || 'Interne'}</span>
                       <span style={{ opacity: 0.5 }}>🏢</span>
                     </div>
                     {m.prix_unitaire > 0 && (
                       <div style={{ marginTop: '4px', fontSize: '0.85rem', color: isSortie ? '#34d399' : '#f87171', fontWeight: 600 }}>
                         {(m.qte * m.prix_unitaire).toLocaleString()} FCFA
                       </div>
                     )}
                   </div>

                 </article>
              </div>
            );
          })}
        </div>
      )}

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

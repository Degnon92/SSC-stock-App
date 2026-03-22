import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Textarea, Btn, SearchBar, PageHeader, Confirm, Empty } from './UI';
import { CATEGORIES } from '../data/initialData';
import { generatePremiumPDF, generatePremiumExcel } from '../utils/exportUtils';

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

  function handleExportPDF() {
    const data = filtered.map(p => {
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      return { ...p, fourn_nom: fourn ? fourn.nom : '—', valeur_stock: p.stock * p.prix_achat };
    });
    const columns = [
      { key: 'ref', header: 'RÉF' },
      { key: 'nom', header: 'DÉSIGNATION' },
      { key: 'cat', header: 'CATÉGORIE' },
      { key: 'stock', header: 'STOCK', align: 'center' },
      { key: 'seuil', header: 'SEUIL', align: 'center' },
      { key: 'prix_achat', header: 'P.ACHAT', isCurrency: true, align: 'right' },
      { key: 'prix_vente', header: 'P.VENTE', isCurrency: true, align: 'right' },
      { key: 'fourn_nom', header: 'FOURNISSEUR' },
    ];
    generatePremiumPDF({ title: 'Rapport d\'Inventaire', data, columns, filename: 'Inventaire_Produits' });
  }

  function handleExportExcel() {
    const data = filtered.map(p => {
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      return { ...p, fourn_nom: fourn ? fourn.nom : '—', valeur_stock: p.stock * p.prix_achat };
    });
    const columns = [
      { key: 'ref', header: 'RÉF' },
      { key: 'nom', header: 'DÉSIGNATION' },
      { key: 'cat', header: 'CATÉGORIE' },
      { key: 'stock', header: 'STOCK', align: 'center' },
      { key: 'seuil', header: 'SEUIL', align: 'center' },
      { key: 'prix_achat', header: 'PRIX ACHAT', isCurrency: true, align: 'right' },
      { key: 'prix_vente', header: 'PRIX VENTE', isCurrency: true, align: 'right' },
      { key: 'fourn_nom', header: 'FOURNISSEUR' },
      { key: 'valeur_stock', header: 'VALEUR STOCK', isCurrency: true, align: 'right' }
    ];
    generatePremiumExcel({ title: 'INVENTAIRE DES PRODUITS', data, columns, filename: 'Inventaire_Produits' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📦 Catalogue Produits">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn variant="outline" icon="📄" onClick={handleExportPDF}>Rapport PDF</Btn>
          <Btn variant="outline" icon="📊" onClick={handleExportExcel}>Excel Premium</Btn>
          <Btn variant="accent" onClick={openAdd} icon="➕">Nouveau produit</Btn>
        </div>
      </PageHeader>

      {/* ═══ STATS RAPIDES (Style Hub Corporate) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <article style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #3b82f6, #60a5fa)' }} />
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Total Produits</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1 }}>{produits.length}</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>📦</span>
          </div>
        </article>

        <article style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #f59e0b, #fbbf24)' }} />
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Stock Faible</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', margin: 0, lineHeight: 1 }}>{produits.filter(p => p.stock > 0 && p.stock <= p.seuil).length}</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>⚠️</span>
          </div>
        </article>

        <article style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #ef4444, #f87171)' }} />
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>En Rupture</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: 0, lineHeight: 1 }}>{produits.filter(p => p.stock === 0).length}</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>❌</span>
          </div>
        </article>

        <article style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #10b981, #34d399)' }} />
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Valeur du Stock</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: 0, lineHeight: 1 }}>
              {produits.reduce((acc, p) => acc + (p.stock * p.prix_achat), 0).toLocaleString()} F
            </span>
            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>💰</span>
          </div>
        </article>
      </div>

      {/* ═══ BARRE D'OUTILS (Filtres) ═══ */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Réf médicale, nom, code-barres..." />
        <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ minWidth: 150, padding: '10px 16px', borderRadius: 12 }}>
          <option value="">Toutes Catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 150, padding: '10px 16px', borderRadius: 12 }}>
          <option value="">Tous les statuts</option>
          <option value="ok">Stock OK</option>
          <option value="faible">Stock faible</option>
          <option value="rupture">Rupture</option>
        </Select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto', paddingRight: '10px' }}>{filtered.length} produit(s)</span>
      </div>

      {/* ═══ MASONRY GRID : CARTES PRODUITS ═══ */}
      {filtered.length === 0 ? (
        <Empty message="Aucun produit trouvé." action={<Btn variant="accent" size="sm" onClick={openAdd} icon="➕">Créer un produit</Btn>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filtered.map(p => {
            // Determine Card Style based on status
            const isRupture = p.stock === 0;
            const isLow = p.stock > 0 && p.stock <= p.seuil;
            const isExpensive = p.prix_achat > 100000; // Arbitrary threshold for "Neon Blue"
            
            let borderColor = 'rgba(255,255,255,0.1)';
            let statusBadge = null;

            if (isRupture) {
              borderColor = '#ef4444'; // Neon Red
              statusBadge = <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', animation: 'pulse 2s infinite' }}>Rupture !</span>;
            } else if (isLow) {
              borderColor = '#eab308'; // Neon Yellow
            } else if (isExpensive) {
              borderColor = '#3b82f6'; // Neon Blue
            } else {
              borderColor = '#22c55e'; // Neon Green
            }

            const marge = p.prix_vente - p.prix_achat;
            const txMarge = p.prix_vente > 0 ? ((marge / p.prix_vente) * 100).toFixed(0) : 0;

            return (
              <article key={p.id} style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                backdropFilter: 'blur(20px)', 
                borderRadius: '24px', 
                padding: '20px', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: `4px solid ${borderColor}`,
                boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), -8px 0 20px -10px ${borderColor}60`, // glowing edge
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden'
              }}>
                {isLow && !isRupture && <div style={{ position: 'absolute', bottom: -10, right: -10, width: 100, height: 100, background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />}
                
                {/* Header (Ref + Badge) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', position: 'relative', zIndex: 10 }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 600, color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>{p.ref}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {statusBadge}
                    {isLow && !isRupture && <span style={{ fontSize: '1rem' }}>⚠️</span>}
                  </div>
                </div>

                {/* Nom & Catégorie */}
                <h3 style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, color: '#ffffff', marginBottom: '4px', position: 'relative', zIndex: 10 }}>{p.nom}</h3>
                <p style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 500, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', zIndex: 10 }}>{p.cat}</p>

                {/* Tarification */}
                <div style={{ flex: 1 }}>
                  {isRupture ? (
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                       <p>PA: <span style={{ color: '#e2e8f0' }}>{p.prix_achat.toLocaleString()} F</span></p>
                       <p style={{ textAlign: 'right' }}>PV: <span style={{ color: '#e2e8f0' }}>{p.prix_vente.toLocaleString()} F</span></p>
                     </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                      <div>
                         <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Prix Vente</p>
                         <p style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#ffffff' }}>{p.prix_vente.toLocaleString()} F</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Marge Brute</p>
                         <p style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{txMarge}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock & Seuil ProgressBar */}
                {isRupture ? (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, marginBottom: 4 }}>
                      <span>Seuil critique dépassé</span>
                      <span>0 / {p.seuil} U</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)' }}>
                       <div style={{ height: '100%', width: '0%', background: '#ef4444' }} />
                    </div>
                  </div>
                ) : isLow ? (
                  <div style={{ marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', textTransform: 'uppercase', color: '#eab308', fontWeight: 700, marginBottom: 4 }}>
                      <span>Alerte Seuil</span>
                      <span>{p.stock} / {p.seuil} U</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '999px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${Math.max(5, (p.stock / p.seuil) * 100)}%`, background: '#eab308', boxShadow: '0 0 10px rgba(234,179,8,0.8)' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Stock disponible</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: borderColor }}>{p.stock.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>U</span></p>
                    </div>
                  </div>
                )}

                {/* Actions Bottom */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', position: 'relative', zIndex: 10 }}>
                  {isRupture ? (
                     <button style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onClick={() => setDetailProd(p)}>
                       Voir Fiche Produit
                     </button>
                  ) : (
                    <>
                      <button style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onClick={() => setDetailProd(p)}>
                        Détails
                      </button>
                      <button style={{ flex: 1, padding: '8px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onClick={() => openEdit(p)}>
                        Modifier
                      </button>
                    </>
                  )}
                  
                  <button onClick={() => setConfirmId(p.id)} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                    🗑️
                  </button>
                </div>

              </article>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

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

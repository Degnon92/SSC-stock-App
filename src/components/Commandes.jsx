import React, { useState } from 'react';
import { Modal, FormGrid, FormGroup, Select, Input, Btn, Badge, Table, Tr, Td, SearchBar, PageHeader, Empty, Confirm } from './UI';
import { generateBonCommande } from '../utils/pdfUtils';

export default function Commandes({ store, auth }) {
  const { fournisseurs, produits, commandes, addCommande, updateCommande, addMouvement } = store;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [tab, setTab] = useState('encours');
  const [modalOpen, setModalOpen] = useState(false);
  const [receiving, setReceiving] = useState(null); // Reference to an order being received
  const [deleting, setDeleting] = useState(null); // Order to delete
  const [viewing, setViewing] = useState(null); // Order to view details
  
  // Create Form State
  const [fournisseurId, setFournisseurId] = useState('');
  const [lignes, setLignes] = useState([{ produit_id: '', qte: 1, prix_achat: 0 }]);
  const [loading, setLoading] = useState(false);

  const filtered = (commandes || []).filter(c => {
    const sStr = search || '';
    const matchSearch = c.numero?.toLowerCase().includes(sStr.toLowerCase()) || 
                      c.fournisseur_nom?.toLowerCase().includes(sStr.toLowerCase());
    const matchTab = tab === 'encours' ? (c.statut !== 'Réceptionnée') : (c.statut === 'Réceptionnée');
    const matchStatus = statusFilter === 'Tous' ? true : 
                        (statusFilter === 'En cours' ? c.statut !== 'Réceptionnée' : c.statut === statusFilter);
    return matchSearch && matchTab && matchStatus;
  });

  const totalAmount = lignes.reduce((s, l) => s + (l.qte * l.prix_achat), 0);

  const handleAddLigne = () => setLignes([...lignes, { produit_id: '', qte: 1, prix_achat: 0 }]);
  const handleRemoveLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));
  const updateLigne = (idx, field, val) => {
    const newLignes = [...lignes];
    newLignes[idx][field] = val;
    // Auto-fill price
    if (field === 'produit_id') {
      const p = produits.find(p => p.id === parseInt(val));
      if (p) newLignes[idx].prix_achat = p.prix_achat || 0;
    }
    setLignes(newLignes);
  };

  const handleCreate = async () => {
    if (!fournisseurId) return alert('Sélectionnez un fournisseur');
    const validLignes = lignes.filter(l => l.produit_id && l.qte > 0);
    if (validLignes.length === 0) return alert('Ajoutez au moins un produit valide');
    
    setLoading(true);
    const f = fournisseurs.find(f => f.id === parseInt(fournisseurId));
    
    await addCommande({
      numero: 'BC-' + Date.now().toString().slice(-6),
      fournisseur_id: f.id,
      fournisseur_nom: f.nom,
      lignes: validLignes,
      montant_total: validLignes.reduce((s, l) => s + (l.qte * l.prix_achat), 0),
      statut: 'Envoyée', // For simplicity, auto-send 
    });
    
    setLoading(false);
    setModalOpen(false);
    setFournisseurId('');
    setLignes([{ produit_id: '', qte: 1, prix_achat: 0 }]);
  };

  const handleReception = async () => {
    if (!receiving) return;
    setLoading(true);
    
    try {
      // Create Mouvements d'Entrée for each line
      for (const st of receiving.lignes) {
        await addMouvement({
          produit_id: parseInt(st.produit_id),
          produit_nom: produits.find(p => p.id === parseInt(st.produit_id))?.nom || 'Inconnu',
          type: 'Entrée',
          qte: st.qte,
          date: new Date().toISOString().slice(0, 10),
          motif: `Réception ${receiving.numero}`,
          operateur: auth.profile?.nom || 'Admin',
          client_fourn: receiving.fournisseur_nom,
          prix_unitaire: st.prix_achat
        });
      }
      
      // Update the Order status
      await updateCommande(receiving.id, { statut: 'Réceptionnée', date_reception: new Date().toISOString() });
      setReceiving(null);
    } catch (e) {
      alert("Erreur lors de la réception : " + e.message);
    }
    setLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (deleting) {
      await store.deleteCommande(deleting.id);
      setDeleting(null);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* HEADER DE PAGE & BARRE D'OUTILS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px', color: '#f8fafc' }}>
               Commandes & Réceptions
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Gérez les réapprovisionnements auprès de vos fournisseurs.</p>
          </div>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#6366f1', color: '#ffffff', boxShadow: '0 0 15px rgba(99,102,241,0.4)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            Nouveau Bon de Commande
          </button>
        </div>

        {/* Toolbar Filtres Vitrée */}
        <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° Commande (ex: BC-24-001), Fournisseur..." 
              style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 16px 8px 36px', fontSize: '0.875rem', color: '#ffffff', outline: 'none' }}
            />
          </div>
          <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.875rem', color: '#cbd5e1', outline: 'none', cursor: 'pointer' }}>
            <option value="Tous" style={{ backgroundColor: '#0f172a' }}>Tous les Statuts</option>
            <option value="En cours" style={{ backgroundColor: '#0f172a' }}>En Attente (En cours)</option>
            <option value="Réceptionnée" style={{ backgroundColor: '#0f172a' }}>Réceptionné (Clos)</option>
          </select>
        </div>

        {/* Mini Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
          <button 
            onClick={() => setTab('encours')}
            style={{ color: tab === 'encours' ? '#818cf8' : '#64748b', fontWeight: 600, fontSize: '0.875rem', borderBottom: tab === 'encours' ? '2px solid #818cf8' : 'none', padding: '0 4px 4px 4px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', marginBottom: '-9px' }}>
            Commandes en cours ({commandes.filter(c => c.statut !== 'Réceptionnée').length})
          </button>
          <button 
            onClick={() => setTab('historique')}
            style={{ color: tab === 'historique' ? '#818cf8' : '#64748b', fontWeight: 600, fontSize: '0.875rem', borderBottom: tab === 'historique' ? '2px solid #818cf8' : 'none', padding: '0 4px 4px 4px', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', marginBottom: '-9px' }}>
            Historique Réceptions
          </button>
        </div>
      </div>

      <style>{`
        .commandes-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 768px) { .commandes-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1280px) { .commandes-grid { grid-template-columns: repeat(3, 1fr); } }

        .border-l-blue { border-left: 4px solid #3b82f6; box-shadow: -10px 0 20px -10px rgba(59, 130, 246, 0.4); }
        .border-l-green { border-left: 4px solid #22c55e; box-shadow: -10px 0 20px -10px rgba(34, 197, 94, 0.4); }
        .border-l-orange { border-left: 4px solid #f97316; box-shadow: -10px 0 20px -10px rgba(249, 115, 22, 0.4); }
        .border-l-slate { border-left: 4px solid #64748b; box-shadow: -10px 0 20px -10px rgba(100, 116, 139, 0.4); }
      `}</style>

      {filtered.length === 0 ? (
        <Empty icon="📦" message="Aucune commande fournisseur" />
      ) : (
        <div className="commandes-grid">
          {filtered.map(c => {
            let borderColor = 'border-l-slate';
            let badgeBg = 'rgba(100,116,139,0.2)';
            let badgeText = '#94a3b8';
            let badgeBorder = 'rgba(100,116,139,0.3)';
            let badgeIcon = '⏳';
            let badgeShadow = 'none';

            if (c.statut === 'Réceptionnée') {
              borderColor = 'border-l-green';
              badgeBg = 'rgba(34,197,94,0.2)';
              badgeText = '#4ade80';
              badgeBorder = 'rgba(34,197,94,0.3)';
              badgeIcon = '✅';
              badgeShadow = '0 0 10px rgba(34,197,94,0.3)';
            } else if (c.statut === 'Envoyée') {
              borderColor = 'border-l-blue';
              badgeBg = 'rgba(59,130,246,0.2)';
              badgeText = '#60a5fa';
              badgeBorder = 'rgba(59,130,246,0.3)';
              badgeIcon = '🚀';
              badgeShadow = '0 0 10px rgba(59,130,246,0.3)';
            } else if (c.statut === 'Brouillon') {
              borderColor = 'border-l-orange';
              badgeBg = 'rgba(249,115,22,0.2)';
              badgeText = '#fb923c';
              badgeBorder = 'rgba(249,115,22,0.3)';
              badgeIcon = '📝';
              badgeShadow = '0 0 10px rgba(249,115,22,0.3)';
            }

            const progress = c.statut === 'Réceptionnée' ? 100 : c.statut === 'Envoyée' ? 50 : 10;
            const progressColor = c.statut === 'Réceptionnée' ? '#22c55e' : c.statut === 'Envoyée' ? '#3b82f6' : '#f97316';

            return (
              <article key={c.id} className={`glass-card ${borderColor}`} style={{
                background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px',
                padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', overflow: 'hidden'
              }}>
                {/* Filigrane */}
                <div style={{ position: 'absolute', bottom: '-24px', right: '-24px', fontSize: '120px', opacity: 0.05, transform: 'rotate(12deg)', pointerEvents: 'none' }}>
                  📦
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {c.numero}
                      </span>
                      <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff', marginTop: '6px', lineHeight: 1.2 }}>{c.fournisseur_nom}</h3>
                    </div>
                    <span style={{ background: badgeBg, color: badgeText, border: `1px solid ${badgeBorder}`, fontSize: '0.625rem', padding: '4px 10px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: badgeShadow }}>
                      {badgeIcon} {c.statut}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Créé le</p>
                      <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#cbd5e1' }}>{new Date(c.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: c.statut === 'Réceptionnée' ? '#22c55e' : '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                        {c.statut === 'Réceptionnée' ? 'Réceptionnée le' : 'Livraison prévue'}
                      </p>
                      <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: c.statut === 'Réceptionnée' ? '#4ade80' : '#ffffff', fontWeight: c.statut === 'Réceptionnée' ? 700 : 400 }}>
                        {c.date_reception ? new Date(c.date_reception).toLocaleDateString() : 'A venir'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Articles</p>
                      <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#cbd5e1' }}>{c.lignes?.length || 0} Référence(s)</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Montant Total</p>
                      <p style={{ fontSize: '1rem', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8' }}>{c.montant_total?.toLocaleString()} F</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                      <span>{c.statut === 'Réceptionnée' ? 'Terminé' : 'Préparation'}</span>
                      <span>{c.statut === 'Réceptionnée' ? 'Réceptionné' : 'Expédition'}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: progressColor, width: `${progress}%`, boxShadow: `0 0 8px ${progressColor}` }}></div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                  <button onClick={() => setViewing(c)} style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    👁️ Détail
                  </button>
                  <button onClick={() => {
                      const fourn = fournisseurs.find(f => f.id === c.fournisseur_id);
                      generateBonCommande({
                        fournisseur: fourn,
                        produits: (c.lignes || []).map(l => {
                          const p = produits.find(x => x.id === l.produit_id || x.id === parseInt(l.produit_id));
                          return { ref: l.ref || p?.ref || '', nom: l.nom || p?.nom || '', qte_commande: l.qte, prix_achat: l.prix_achat };
                        }),
                        operateur: c.operateur || '',
                        numero: c.numero
                      });
                    }} style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    📄 PDF
                  </button>
                  {c.statut === 'Envoyée' && (
                    <button onClick={() => setReceiving(c)} style={{ flex: 2, padding: '8px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxShadow: '0 0 15px rgba(34,197,94,0.1)' }}>
                      📥 Réceptionner
                    </button>
                  )}
                  {c.statut === 'Brouillon' && (
                    <button onClick={() => updateCommande(c.id, { statut: 'Envoyée' })} style={{ flex: 2, padding: '8px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                      🚀 Envoyer
                    </button>
                  )}
                  {c.statut !== 'Réceptionnée' && (
                    <button onClick={() => setDeleting(c)} style={{ flex: 0, padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Annuler/Supprimer">
                      🗑️
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="📝 Nouveau Bon de Commande (BC)" width={700}>
        <FormGroup label="Fournisseur ciblé *">
          <Select value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}>
            <option value="">— Sélectionner un fournisseur —</option>
            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </Select>
        </FormGroup>

        <div style={{ marginTop: 24, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Produits à commander</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Vous pouvez ajouter plusieurs produits à cette commande</div>
          </div>
          <Btn variant="primary" size="sm" onClick={handleAddLigne} icon="➕">Ajouter un produit</Btn>
        </div>

        {lignes.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 40px', gap: 10, marginBottom: 12, alignItems: 'end', background: 'var(--input-bg)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <FormGroup label={`Produit ${i + 1}`}>
              <Select value={l.produit_id} onChange={e => updateLigne(i, 'produit_id', e.target.value)}>
                <option value="">— Produit —</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.ref} — {p.nom} (Stock: {p.stock})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Qté">
              <Input type="number" min="1" value={l.qte} onChange={e => updateLigne(i, 'qte', parseInt(e.target.value) || 1)} />
            </FormGroup>
            <FormGroup label="Prix U. (F)">
              <Input type="number" min="0" value={l.prix_achat} onChange={e => updateLigne(i, 'prix_achat', parseFloat(e.target.value) || 0)} />
            </FormGroup>
            {lignes.length > 1 ? (
              <Btn variant="danger" size="sm" onClick={() => handleRemoveLigne(i)} style={{ height: 42 }}>✖</Btn>
            ) : <div />}
          </div>
        ))}

        <div style={{ background: 'var(--bg-sidebar)', padding: '16px 20px', borderRadius: 10, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Montant Total Estimé</span>
           <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#0079c1' }}>{totalAmount.toLocaleString()} F</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Btn variant="outline" onClick={() => setModalOpen(false)}>Annuler</Btn>
          <Btn variant="accent" onClick={handleCreate} disabled={loading}>{loading ? '⏳ Création...' : '🚀 Valider et Envoyer le BC'}</Btn>
        </div>
      </Modal>

      {/* RECEPTION CONFIRM MODAL */}
      <Modal open={!!receiving} onClose={() => setReceiving(null)} title="📥 Confirmation de Réception" width={500}>
        {receiving && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Vous êtes sur le point de rendre effective la réception de la commande <strong>{receiving.numero}</strong> fournie par <strong>{receiving.fournisseur_nom}</strong>.
            </p>
            <div style={{ background: 'rgba(0,168,120,0.08)', padding: 16, borderRadius: 10, border: '1px solid rgba(0,168,120,0.2)', marginBottom: 24, fontSize: '0.85rem' }}>
              ℹ️ Cette action va automatiquement créer <strong>{receiving.lignes.length} mouvement(s) d'entrée en stock</strong> et calculer le nouveau PUMP pour les articles concernés.
    </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Btn variant="outline" onClick={() => setReceiving(null)}>Annuler</Btn>
              <Btn variant="primary" onClick={handleReception} disabled={loading}>{loading ? '⏳ Traitement...' : '✅ Confirmer l\'entrée en stock'}</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`📋 Détail du BC ${viewing?.numero || ''}`} width={650}>
        {viewing && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--input-bg)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Fournisseur</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{viewing.fournisseur_nom}</div>
              </div>
              <div style={{ background: 'var(--input-bg)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Statut</div>
                <Badge variant={viewing.statut === 'Réceptionnée' ? 'ok' : viewing.statut === 'Brouillon' ? 'warn' : 'info'}>
                  {viewing.statut === 'Réceptionnée' ? '✅' : '⏳'} {viewing.statut}
                </Badge>
              </div>
              <div style={{ background: 'var(--input-bg)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Date de commande</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(viewing.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style={{ background: 'var(--input-bg)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Montant Total</div>
                <div style={{ fontWeight: 800, color: '#0079c1', fontFamily: 'Syne, sans-serif', fontSize: '1.1rem' }}>{viewing.montant_total?.toLocaleString()} F</div>
              </div>
            </div>

            <div style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif', marginBottom: 12 }}>Produits commandés ({viewing.lignes?.length || 0})</div>
            <Table headers={['Réf', 'Produit', 'Qté', 'Prix Unit. (F)', 'Sous-total (F)']}>
              {(viewing.lignes || []).map((l, i) => {
                const p = produits.find(x => x.id === l.produit_id || x.id === parseInt(l.produit_id));
                return (
                  <Tr key={i}>
                    <Td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{l.ref || p?.ref || '—'}</Td>
                    <Td style={{ fontWeight: 600 }}>{l.nom || p?.nom || 'Produit inconnu'}</Td>
                    <Td style={{ fontWeight: 700 }}>{l.qte}</Td>
                    <Td>{(l.prix_achat || 0).toLocaleString()}</Td>
                    <Td style={{ fontWeight: 700, color: '#0079c1' }}>{((l.qte || 0) * (l.prix_achat || 0)).toLocaleString()}</Td>
                  </Tr>
                );
              })}
            </Table>

            {viewing.date_reception && (
              <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(0,168,120,0.08)', borderRadius: 8, border: '1px solid rgba(0,168,120,0.2)', fontSize: '0.85rem', color: '#00a878' }}>
                ✅ Réceptionnée le {new Date(viewing.date_reception).toLocaleDateString('fr-FR')}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="outline" icon="📄" onClick={() => {
                const fourn = fournisseurs.find(f => f.id === viewing.fournisseur_id);
                generateBonCommande({
                  fournisseur: fourn,
                  produits: (viewing.lignes || []).map(l => {
                    const p = produits.find(x => x.id === l.produit_id);
                    return { ref: l.ref || p?.ref || '', nom: l.nom || p?.nom || '', qte_commande: l.qte, prix_achat: l.prix_achat };
                  }),
                  operateur: viewing.operateur || '',
                });
              }}>Télécharger PDF</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Confirm 
        open={!!deleting} 
        message={`Voulez-vous vraiment supprimer le Bon de Commande ${deleting?.numero} ? Cette action est irréversible.`} 
        onConfirm={handleConfirmDelete} 
        onClose={() => setDeleting(null)} 
      />

    </div>
  );
}

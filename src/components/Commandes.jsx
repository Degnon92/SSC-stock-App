import React, { useState } from 'react';
import { Modal, FormGrid, FormGroup, Input, Select, Btn, Badge, Table, Tr, Td, SearchBar, Toolbar, PageHeader, Card, Empty, SectionCard, Confirm } from './UI';

export default function Commandes({ store, auth }) {
  const { fournisseurs, produits, commandes, addCommande, updateCommande, addMouvement } = store;
  
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [receiving, setReceiving] = useState(null); // Reference to an order being received
  const [deleting, setDeleting] = useState(null); // Order to delete
  const [viewing, setViewing] = useState(null); // Order to view details
  
  // Create Form State
  const [fournisseurId, setFournisseurId] = useState('');
  const [lignes, setLignes] = useState([{ produit_id: '', qte: 1, prix_achat: 0 }]);
  const [loading, setLoading] = useState(false);

  const filtered = (commandes || []).filter(c => 
    c.numero?.toLowerCase().includes(search.toLowerCase()) || 
    c.fournisseur_nom?.toLowerCase().includes(search.toLowerCase())
  );

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
      <PageHeader title="📦 Commandes Fournisseurs (Réassort)">
        <Btn variant="accent" onClick={() => setModalOpen(true)} icon="➕">Créer un Bon de Commande</Btn>
      </PageHeader>

      <Card>
        <Toolbar>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un BC (numéro, fournisseur)..." />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} commande(s)</span>
        </Toolbar>

        <Table headers={['Date', 'N° Commande', 'Fournisseur', 'Montant', 'Statut', 'Actions']}
          empty={filtered.length === 0 ? <Empty icon="📦" message="Aucune commande fournisseur" /> : null}>
          {filtered.map(c => (
            <Tr key={c.id}>
              <Td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.date).toLocaleDateString()}</Td>
              <Td style={{ fontWeight: 700 }}>{c.numero}</Td>
              <Td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.fournisseur_nom}</Td>
              <Td style={{ fontWeight: 700, color: '#0079c1' }}>{c.montant_total?.toLocaleString()} F</Td>
              <Td>
                <Badge variant={c.statut === 'Réceptionnée' ? 'ok' : c.statut === 'Brouillon' ? 'warn' : 'info'}>
                  {c.statut === 'Réceptionnée' ? '✅' : '⏳'} {c.statut}
                </Badge>
              </Td>
              <Td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn variant="outline" size="sm" onClick={() => setViewing(c)}>👁️ Détail</Btn>
                  {c.statut === 'Brouillon' && (
                    <Btn variant="primary" size="sm" onClick={() => updateCommande(c.id, { statut: 'Envoyée' })}>🚀 Envoyer</Btn>
                  )}
                  {c.statut === 'Envoyée' && (
                    <Btn variant="outline" size="sm" onClick={() => setReceiving(c)}>📥 Réceptionner</Btn>
                  )}
                  {c.statut === 'Réceptionnée' && (
                    <span style={{ fontSize: '0.75rem', color: '#00a878', fontWeight: 600 }}>✅ {new Date(c.date_reception).toLocaleDateString()}</span>
                  )}
                  {c.statut !== 'Réceptionnée' && (
                    <Btn variant="danger" size="sm" onClick={() => setDeleting(c)}>🗑️</Btn>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>

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

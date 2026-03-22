import React, { useState, useMemo } from 'react';
import { Modal, FormGrid, FormGroup, Select, Input, Btn, Badge, Table, Tr, Td, SearchBar, PageHeader, Empty, Confirm, StatCard } from './UI';
import { generateFacture } from '../utils/pdfUtils';

const STATUTS = ['Brouillon', 'Émise', 'Payée', 'Annulée'];
const STATUS_VARIANT = { Brouillon: 'neutral', Émise: 'info', Payée: 'ok', Annulée: 'danger' };

export default function Facturation({ store }) {
  const { factures, produits, clients, addFacture, updateFacture, deleteFacture } = store;
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [typeFilter, setTypeFilter] = useState('Tous');
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

    if (typeFilter === 'Factures Définitives') arr = arr.filter(f => f.statut !== 'Brouillon');
    if (typeFilter === 'Proformas / Devis') arr = arr.filter(f => f.statut === 'Brouillon');

    if (statusFilter === 'Payées') arr = arr.filter(f => f.statut === 'Payée');
    if (statusFilter === 'En attente / Impayées') arr = arr.filter(f => f.statut === 'Émise');
    if (statusFilter === 'En retard') arr = arr.filter(f => f.statut === 'Émise' && f.echeance && new Date(f.echeance) < new Date());
    return arr;
  }, [factures, clients, search, statusFilter, typeFilter]);

  const caTotal    = (factures || []).filter(f => f.statut === 'Payée').reduce((s, f) => s + (f.totalTTC || 0), 0);
  const totalAttente = (factures || []).filter(f => f.statut === 'Émise').reduce((s, f) => s + (f.totalTTC || 0), 0);
  const totalRetard = (factures || []).filter(f => f.statut === 'Émise' && f.echeance && new Date(f.echeance) < new Date()).reduce((s, f) => s + (f.totalTTC || 0), 0);
  const detailFac  = factures?.find(f => f.id === detailId);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* HEADER DE PAGE & KPIs FINANCIERS */}
      <div style={{ marginBottom: '32px' }}>
         <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', alignItems: window.innerWidth < 768 ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px', color: '#f8fafc' }}>
              🧾 Facturation Clients
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Gérez les proformas, devis, et le recouvrement des factures cliniques.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setForm(EMPTY_FACTURE); setModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              📝 Nouveau Proforma
            </button>
            <button onClick={() => { setForm({ ...EMPTY_FACTURE, statut: 'Émise' }); setModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#6366f1', color: '#ffffff', boxShadow: '0 0 15px rgba(99,102,241,0.4)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              🧾 Créer Facture
            </button>
          </div>
        </div>

        {/* Mini Dashboard Santé Financière */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '4px solid #22c55e', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Encaissé (Ce mois)</p>
              <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>{caTotal.toLocaleString('fr-FR')} F</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '1.25rem' }}>✅</div>
          </div>
          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '4px solid #eab308', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>En Attente (À recouvrer)</p>
              <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, color: '#facc15' }}>{(totalAttente + totalRetard).toLocaleString('fr-FR')} F</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15', fontSize: '1.25rem' }}>⏳</div>
          </div>
          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '4px solid #94a3b8', background: 'rgba(255,255,255,0.02)', opacity: 0.8 }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Proformas en cours</p>
              <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0' }}>{((factures || []).filter(f => f.statut === 'Brouillon').reduce((s,f) => s+(f.totalTTC||0),0)).toLocaleString('fr-FR')} F</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.25rem' }}>📝</div>
          </div>
        </div>

        {/* Toolbar Filtres Vitrée */}
        <div className="glass-card" style={{ borderRadius: '16px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° Facture, Nom Client..." 
              style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 16px 8px 36px', fontSize: '0.875rem', color: '#ffffff', outline: 'none' }}
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.875rem', color: '#cbd5e1', outline: 'none', cursor: 'pointer' }}>
            <option value="Tous" style={{ backgroundColor: '#0f172a' }}>Type : Tous</option>
            <option value="Factures Définitives" style={{ backgroundColor: '#0f172a' }}>Factures Définitives</option>
            <option value="Proformas / Devis" style={{ backgroundColor: '#0f172a' }}>Proformas / Devis</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 16px', fontSize: '0.875rem', color: '#cbd5e1', outline: 'none', cursor: 'pointer' }}>
            <option value="Tous" style={{ backgroundColor: '#0f172a' }}>Statut : Tous</option>
            <option value="Payées" style={{ backgroundColor: '#0f172a' }}>Payées</option>
            <option value="En attente / Impayées" style={{ backgroundColor: '#0f172a' }}>En attente / Impayées</option>
            <option value="En retard" style={{ backgroundColor: '#0f172a' }}>En retard</option>
          </select>
        </div>
      </div>

      <style>{`
        .factures-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 640px) { .factures-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .factures-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .factures-grid { grid-template-columns: repeat(4, 1fr); } }

        .border-t-green { border-top: 3px solid #22c55e; box-shadow: 0 -10px 20px -10px rgba(34, 197, 94, 0.3); }
        .border-t-yellow { border-top: 3px solid #eab308; box-shadow: 0 -10px 20px -10px rgba(234, 179, 8, 0.3); }
        .border-t-red { border-top: 3px solid #ef4444; box-shadow: 0 -10px 20px -10px rgba(239, 68, 68, 0.3); }
        .border-t-slate { border-top: 3px solid #94a3b8; box-shadow: 0 -10px 20px -10px rgba(148, 163, 184, 0.2); }
        .dashed-divider { border-top: 1px dashed rgba(255,255,255,0.1); width: 100%; margin: 12px 0; }
        
        @keyframes pulse-red {
          0%, 100% { opacity: 1; border-color: rgba(239, 68, 68, 0.6); }
          50% { opacity: 0.7; border-color: rgba(239, 68, 68, 0.2); }
        }
        .animate-pulse-red { animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {filtered.length === 0 ? (
        <Empty icon="🧾" message="Aucune facture trouvée" />
      ) : (
        <div className="factures-grid">
          {filtered.map(f => {
            const client = clients.find(c => c.id === f.client_id);
            const isRetard = f.statut === 'Émise' && f.echeance && new Date(f.echeance) < new Date();
            
            let borderColor = 'border-t-slate';
            let badgeBg = 'rgba(148,163,184,0.1)';
            let badgeText = '#cbd5e1';
            let badgeBorder = 'rgba(148,163,184,0.2)';
            let statusText = 'Proforma';
            let iconText = '📝';

            if (f.statut === 'Payée') {
              borderColor = 'border-t-green';
              badgeBg = 'rgba(34,197,94,0.1)';
              badgeText = '#4ade80';
              badgeBorder = 'rgba(34,197,94,0.2)';
              statusText = 'Payée';
              iconText = '✅';
            } else if (isRetard) {
              borderColor = 'border-t-red';
              badgeBg = 'rgba(239,68,68,0.1)';
              badgeText = '#f87171';
              badgeBorder = 'rgba(239,68,68,0.2)';
              statusText = 'Retard Paiement';
              iconText = '⚠️';
            } else if (f.statut === 'Émise') {
              borderColor = 'border-t-yellow';
              badgeBg = 'rgba(234,179,8,0.1)';
              badgeText = '#facc15';
              badgeBorder = 'rgba(234,179,8,0.2)';
              statusText = 'En Attente';
              iconText = '⏳';
            } else if (f.statut === 'Annulée') {
               borderColor = 'border-t-slate';
               badgeText = '#ef4444';
               statusText = 'Annulée';
               iconText = '❌';
            }

            return (
              <article key={f.id} className={`glass-card ${borderColor}`} style={{
                background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px',
                padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                opacity: f.statut === 'Brouillon' || f.statut === 'Annulée' ? 0.8 : 1
              }}>
                {f.statut === 'Payée' && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '60px', fontWeight: 800, color: 'rgba(34,197,94,0.05)', border: '4px solid rgba(34,197,94,0.05)', padding: '8px', borderRadius: '8px', pointerEvents: 'none', letterSpacing: '0.1em', zIndex: 0 }}>
                    PAYÉ
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative', zIndex: 10 }}>
                  <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     {iconText} {f.numero}
                  </span>
                  <span className={isRetard ? 'animate-pulse-red' : ''} style={{ background: badgeBg, color: badgeText, border: `1px solid ${badgeBorder}`, fontSize: '0.5625rem', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {statusText}
                  </span>
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff', lineHeight: 1.2, position: 'relative', zIndex: 10 }}>{client?.nom || 'Client inconnu'}</h3>
                <p style={{ fontSize: '0.625rem', color: '#94a3b8', marginTop: '4px', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                  {f.statut === 'Brouillon' ? 'Créé le ' : 'Émise le '} {new Date(f.date).toLocaleDateString('fr-FR')}
                </p>

                <div style={{ background: f.statut === 'Payée' ? 'rgba(0,0,0,0.2)' : isRetard ? 'rgba(239,68,68,0.05)' : f.statut === 'Émise' ? 'rgba(234,179,8,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', border: `1px solid ${f.statut === 'Payée' ? 'rgba(255,255,255,0.05)' : isRetard ? 'rgba(239,68,68,0.1)' : f.statut === 'Émise' ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.05)'}`, marginBottom: '12px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                  <p style={{ fontSize: '0.625rem', color: isRetard ? 'rgba(248,113,113,0.8)' : f.statut === 'Émise' ? 'rgba(250,204,21,0.8)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                    {f.statut === 'Payée' ? 'Montant TTC' : isRetard ? 'Créance due' : f.statut === 'Émise' ? 'Reste à payer' : 'Montant Estimé'}
                  </p>
                  <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, color: f.statut === 'Payée' ? '#ffffff' : isRetard ? '#f87171' : f.statut === 'Émise' ? '#facc15' : '#cbd5e1' }}>
                    {(f.totalTTC || 0).toLocaleString('fr-FR')} F
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', color: isRetard ? '#f87171' : '#94a3b8', position: 'relative', zIndex: 10, fontWeight: isRetard ? 600 : 400 }}>
                  {f.statut === 'Brouillon' ? (
                    <><span>Validité: 30 jours</span><span>Non facturé</span></>
                  ) : f.statut === 'Payée' ? (
                    <><span>Réf. Paiement: VIR-{f.id?.toString().slice(-4)}</span><span style={{ color: '#4ade80' }}>Reçu le {(f.date_reception ? new Date(f.date_reception) : new Date()).toLocaleDateString('fr-FR').slice(0,5)}</span></>
                  ) : (
                    <>
                      <span>{isRetard ? 'Échéance dépassée :' : 'Échéance :'} {f.echeance ? new Date(f.echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
                      <span>
                        {f.echeance ? (
                          isRetard ? `(Retard : ${Math.floor((new Date() - new Date(f.echeance)) / (1000 * 60 * 60 * 24))}j)` : `(Dans ${Math.floor((new Date(f.echeance) - new Date()) / (1000 * 60 * 60 * 24))}j)`
                        ) : ''}
                      </span>
                    </>
                  )}
                </div>

                <div className="dashed-divider" style={{ position: 'relative', zIndex: 10 }}></div>

                <div style={{ flex: 1 }}></div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setDetailId(f.id)} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '40px' }} title="Voir/Éditer">
                    👁️
                  </button>
                  
                  {f.statut === 'Brouillon' && (
                    <button onClick={() => handleUpdateStatut(f.id, 'Émise')} style={{ flex: 4, padding: '10px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      🚀 Émettre Facture
                    </button>
                  )}

                  {f.statut === 'Émise' && (
                    <button onClick={() => handleUpdateStatut(f.id, 'Payée')} style={{ flex: 4, padding: '10px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      💰 Encaisser
                    </button>
                  )}

                  {f.statut === 'Payée' && (
                    <button onClick={() => handlePDF(f)} style={{ flex: 4, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      📄 PDF Reçu
                    </button>
                  )}
                  
                  {isRetard && (
                     <button onClick={() => alert("Transmission au recouvrement: " + f.numero)} style={{ flex: 4, padding: '10px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.625rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Transmettre au Recouvrement">
                       🔨 Recouvrement
                     </button>
                  )}
                  
                  {(f.statut !== 'Payée' && f.statut !== 'Annulée' && !isRetard) && (
                    <button onClick={() => setConfirmFactureId(f.id)} style={{ flex: 0, padding: '10px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Supprimer">
                      🗑️
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

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

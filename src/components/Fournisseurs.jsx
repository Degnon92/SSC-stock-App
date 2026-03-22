import React, { useState } from 'react';
import { Modal, FormGrid, FormGroup, Input, Btn, Empty, Confirm } from './UI';
import { generatePremiumPDF, generatePremiumExcel } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── FOURNISSEURS (Enterprise Edition) ───────────────────────────────────────
const EMPTY_F = { nom: '', contact: '', tel: '', email: '', pays: '', ville: '', spec: '', actif: true, score: 0 };

export default function Fournisseurs({ store }) {
  const { fournisseurs, produits, addFournisseur, updateFournisseur, deleteFournisseur } = store;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_F);
  const [confirmId, setConfirmId] = useState(null);

  // Onglet actif
  const [activeTab, setActiveTab] = useState('tous');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Filtrage par recherche
  let filtered = fournisseurs.filter(f => !search || f.nom.toLowerCase().includes(search.toLowerCase()) || (f.contact||'').toLowerCase().includes(search.toLowerCase()) || (f.spec||'').toLowerCase().includes(search.toLowerCase()));

  // Filtrage par onglet
  if (activeTab === 'locaux') {
      filtered = filtered.filter(f => (f.pays || '').toLowerCase().includes('sénégal') || (f.pays || '').toLowerCase().includes('senegal'));
  } else if (activeTab === 'internationaux') {
      filtered = filtered.filter(f => f.pays && !f.pays.toLowerCase().includes('sénégal') && !f.pays.toLowerCase().includes('senegal'));
  } else if (activeTab === 'inactifs') {
      filtered = filtered.filter(f => f.actif === false);
  }

  function openAdd() { setEditId(null); setForm(EMPTY_F); setModalOpen(true); }
  function openEdit(f) { setEditId(f.id); setForm({ ...EMPTY_F, ...f }); setModalOpen(true); }
  function save() {
    if (!form.nom) return alert('Le nom est obligatoire.');
    if (editId) updateFournisseur(editId, form);
    else addFournisseur(form);
    setModalOpen(false);
  }

  // --- KPIs ---
  const totalFournisseurs = fournisseurs.length;
  const fournisseursActifs = fournisseurs.filter(f => f.actif !== false).length;

  // --- Données pour le Graphique (Top 5 Fournisseurs par valeur stock) ---
  const volFourn = {};
  produits.forEach(p => {
    const fourn = fournisseurs.find(f => f.id === p.fourn_id);
    if (fourn) volFourn[fourn.nom] = (volFourn[fourn.nom] || 0) + p.stock * (p.prix_achat || 0);
  });
  const topFournData = Object.entries(volFourn)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, val]) => ({ name: name.length > 10 ? name.substring(0, 10)+'...' : name, fullName: name, valeur: val }));

  // --- Exports Premium ---
  function exportLocalPDF() {
    const columns = [
      { key: 'nom', header: 'SOCIÉTÉ' }, { key: 'contact', header: 'CONTACT' }, { key: 'tel', header: 'TÉLÉPHONE' },
      { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' },
      { key: 'spec', header: 'SPÉCIALITÉ' }, { key: 'statut', header: 'STATUT' }
    ];
    const dataToExport = filtered.map(f => ({ ...f, statut: f.actif === false ? 'INACTIF' : 'ACTIF' }));
    generatePremiumPDF({ title: 'Annuaire des Fournisseurs', data: dataToExport, columns, filename: 'Annuaire_Fournisseurs' });
  }

  function exportLocalExcel() {
    const columns = [
      { key: 'id', header: 'ID FOURNISSEUR' }, { key: 'nom', header: 'SOCIÉTÉ' }, { key: 'contact', header: 'CONTACT PRINCIPAL' },
      { key: 'tel', header: 'TÉLÉPHONE' }, { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' },
      { key: 'spec', header: 'SPÉCIALITÉ' }, { key: 'statut', header: 'STATUT' }, { key: 'score', header: 'NOTE /5' }
    ];
    const dataToExport = filtered.map(f => ({ ...f, statut: f.actif === false ? 'INACTIF' : 'ACTIF', score: f.score || 0 }));
    generatePremiumExcel({ title: 'BASE DE DONNÉES FOURNISSEURS', data: dataToExport, columns, filename: 'Fournisseurs_BDD' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER & ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '0 0 6px 0', color: '#818cf8', letterSpacing: '-0.5px' }}>
            Annuaire Fournisseurs
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Gérez vos laboratoires, distributeurs et évaluez vos partenaires.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportLocalPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(225, 29, 72, 0.1)', color: '#f43f5e', border: '1px solid rgba(225, 29, 72, 0.2)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'} title="Exporter en PDF Premium">
            📄 PDF
          </button>
          <button onClick={exportLocalExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'} title="Exporter en Excel Premium">
            📊 Excel
          </button>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)' }} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'}} onMouseLeave={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.3)'}}>
            <span style={{ fontSize: '1.2rem', fontWeight: 300, color: '#c7d2fe' }}>+</span> Nouveau Partenaire
          </button>
        </div>
      </div>

      {/* TOP SECTION: KPIs (Left) & Graph (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>

        {/* KPI 1 : Total */}
        <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px', borderLeft: '3px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>🏭</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Partenaires</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{totalFournisseurs}</div>
        </div>

        {/* KPI 2 : Actifs */}
        <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px', borderLeft: '3px solid #10b981', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ color: '#10b981', fontSize: '1rem' }}>⚡</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fournisseurs Actifs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{fournisseursActifs}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 20 }}>
              {(totalFournisseurs ? (fournisseursActifs/totalFournisseurs)*100 : 0).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* GRAPHIQUE ANALYTIQUE (Prend 2 colonnes) */}
        <div style={{ gridColumn: 'span 2', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem', color: '#818cf8' }}>📊</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Partenaires (Valeur Stock en F)</span>
          </div>
          <div style={{ flex: 1, minHeight: 80 }}>
            {topFournData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFournData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: '0.8rem', color: '#f8fafc' }} formatter={(val) => [`${val.toLocaleString('fr-FR')} F`, 'Valeur Stock']} labelFormatter={(label) => `Fournisseur : ${label}`} />
                  <Bar dataKey="valeur" radius={[4, 4, 0, 0]}>
                    {topFournData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: '#64748b', fontSize: '0.8rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucune donnée de stock suffisante.</div>}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER (Table & Toolbar) */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 16, overflow: 'hidden' }}>

        {/* TOOLBAR (Onglets & Recherche) */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: 10 }}>
             {[ { id: 'tous', label: 'Tous' }, { id: 'locaux', label: 'Locaux' }, { id: 'internationaux', label: 'Internationaux' }, { id: 'inactifs', label: 'Inactifs' } ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                     background: activeTab === tab.id ? '#334155' : 'transparent',
                     color: activeTab === tab.id ? '#f8fafc' : '#94a3b8',
                     border: 'none', padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                     boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                 }}>
                     {tab.label}
                 </button>
             ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '300px' }}>
             <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>🔍</span>
             <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, contact, spécialité..."
               style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', padding: '10px 14px 10px 40px', borderRadius: 20, fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
               onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#1e293b' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.background = '#0f172a' }}
             />
          </div>
        </div>

        {/* ═══ MASONRY GRID : CARTES FOURNISSEURS ═══ */}
        <div style={{ padding: '0 20px 24px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
               <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>🏭</div>
               <div style={{ fontSize: '0.9rem' }}>Aucun fournisseur trouvé avec ces critères.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filtered.map(f => {
                  const nbProd = produits.filter(p => p.fourn_id === f.id).length;
                  const isActif = f.actif !== false;
                  let borderColor = isActif ? (f.score >= 4 ? '#3b82f6' : '#22c55e') : '#ef4444';

                  return (
                    <article key={f.id} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '24px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderLeft: `4px solid ${borderColor}`,
                      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), -8px 0 20px -10px ${borderColor}60`,
                      display: 'flex', flexDirection: 'column',
                      position: 'relative', overflow: 'hidden',
                      opacity: isActif ? 1 : 0.6
                    }}>
                      {/* Header -> Name + Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 46, height: 46, borderRadius: '14px', background: isActif ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: isActif ? '#60a5fa' : '#f87171', border: `1px solid ${isActif ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                               {(f.nom || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.2 }}>{f.nom}</h3>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: 10, alignItems: 'center' }}>
                                ID: {(f.id || '').toString().substring(0, 8)}
                                {!isActif && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>INACTIF</span>}
                              </div>
                            </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', flex: 1, marginBottom: '20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: '0.75rem' }}>👤</div>
                           <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{f.contact || 'Non renseigné'}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: '0.75rem' }}>📍</div>
                           <span style={{ color: '#cbd5e1' }}>{[f.ville, f.pays].filter(Boolean).join(', ') || 'Localisation inconnue'}</span>
                         </div>
                         {f.tel && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#be185d', fontSize: '0.75rem' }}>📞</div> <span style={{ color: '#cbd5e1' }}>{f.tel}</span></div>}
                         {f.email && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>✉️</div> <span style={{ color: '#60a5fa' }}>{f.email}</span></div>}
                      </div>

                      {/* Specialties & Performance */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                            {f.spec ? f.spec.split(',').slice(0, 3).map((s, idx) => (
                                <span key={idx} style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{s.trim()}</span>
                            )) : <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Aucune spécialité</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>📦 {nbProd} produit{nbProd > 1 ? 's' : ''} liés</span>
                           <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                               {f.score > 0 ? [1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= f.score ? 1 : 0.2 }}>⭐</span>) : <span style={{ color: '#64748b' }}>Non évalué</span>}
                           </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                         <button style={{ flex: 1, padding: '12px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onClick={() => openEdit(f)}>
                            ✏️ Modifier les infos
                         </button>
                         <button onClick={() => setConfirmId(f.id)} style={{ padding: '12px', width: 44, background: 'rgba(239,68,68,0.05)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}>
                            🗑️
                         </button>
                      </div>
                    </article>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJOUT/EDITION */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Éditer le Partenaire' : '➕ Ajouter un Partenaire'} width={650}>
        <div style={{ background: 'rgba(59,130,246,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(59,130,246,0.2)', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, flex: 1 }}>Les informations saisies ici permettront de lier ce fournisseur aux produits du catalogue et aux bons de commande.</p>
            {/* Toggle Actif/Inactif */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', marginLeft: 16 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: form.actif !== false ? '#10b981' : '#f43f5e' }}>{form.actif !== false ? '🟢 ACTIF' : '🔴 INACTIF'}</span>
                <input type="checkbox" checked={form.actif !== false} onChange={e => set('actif', e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
            </label>
        </div>

        <FormGrid cols={2}>
          <FormGroup label="Nom de la société *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Raison sociale (ex: Sanofi, Medtronic...)" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Contact Principal"><Input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nom du responsable" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Téléphone"><Input value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+33 1 00 00 00 00" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Email de contact"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@laboratoire.com" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Pays"><Input value={form.pays} onChange={e => set('pays', e.target.value)} placeholder="France, Sénégal..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Ville / Adresse"><Input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris, Dakar..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Spécialités (séparées par une virgule)" full><Input value={form.spec} onChange={e => set('spec', e.target.value)} placeholder="Cardiologie, Consommables, Implants..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Évaluation (Score de fiabilité)">
             <select value={form.score || 0} onChange={e => set('score', Number(e.target.value))} style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
                <option value={0}>Non évalué</option>
                <option value={1}>⭐ (Critique)</option>
                <option value={2}>⭐⭐ (Passable)</option>
                <option value={3}>⭐⭐⭐ (Correct)</option>
                <option value={4}>⭐⭐⭐⭐ (Très bon)</option>
                <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
             </select>
          </FormGroup>
        </FormGrid>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Annuler</button>
          <button onClick={save} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{editId ? '💾 Mettre à jour' : '💾 Enregistrer'}</button>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => { deleteFournisseur(confirmId); setConfirmId(null); }} message="Êtes-vous sûr de vouloir supprimer définitivement ce partenaire ? Les produits déjà associés conserveront leur historique." />
    </div>
  );
}

import React, { useState } from 'react';
import { Modal, FormGrid, FormGroup, Input, Confirm } from './UI';
import { generatePremiumPDF, generatePremiumExcel } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const CLIENT_TYPES = ['Hôpital public', 'Clinique privée', 'Hôpital militaire', 'Cabinet médical', 'Autre'];
const EMPTY_C = { nom: '', contact: '', tel: '', email: '', type: 'Hôpital public', pays: 'Sénégal', ville: '', actif: true, score: 0 };

export default function Clients({ store }) {
  const { clients, mouvements, addClient, updateClient, deleteClient } = store;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_C);
  const [confirmId, setConfirmId] = useState(null);
  
  // Onglet actif
  const [activeTab, setActiveTab] = useState('tous');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Filtrage par recherche
  let filtered = clients.filter(c => !search || c.nom.toLowerCase().includes(search.toLowerCase()) || (c.contact||'').toLowerCase().includes(search.toLowerCase()) || (c.type||'').toLowerCase().includes(search.toLowerCase()));

  // Filtrage par onglet
  if (activeTab === 'public') {
      filtered = filtered.filter(c => c.type === 'Hôpital public' || c.type === 'Hôpital militaire');
  } else if (activeTab === 'prive') {
      filtered = filtered.filter(c => c.type === 'Clinique privée' || c.type === 'Cabinet médical');
  } else if (activeTab === 'inactifs') {
      filtered = filtered.filter(c => c.actif === false);
  }

  function openAdd() { setEditId(null); setForm(EMPTY_C); setModalOpen(true); }
  function openEdit(c) { setEditId(c.id); setForm({ ...EMPTY_C, ...c }); setModalOpen(true); }
  function save() {
    if (!form.nom) return alert('Le nom est obligatoire.');
    if (editId) updateClient(editId, form);
    else addClient(form);
    setModalOpen(false);
  }

  // --- KPIs ---
  const totalClients = clients.length;
  const clientsActifs = clients.filter(c => c.actif !== false).length;

  // --- Données pour le Graphique (Top 5 Clients par CA) ---
  const caClient = {};
  mouvements.filter(m => m.type === 'Sortie').forEach(m => {
    const ca = m.qte * (m.prix_unitaire || 0);
    if (m.client_fourn) {
        caClient[m.client_fourn] = (caClient[m.client_fourn] || 0) + ca;
    }
  });
  
  const topClientsData = Object.entries(caClient)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, val]) => ({ name: name.length > 10 ? name.substring(0, 10)+'...' : name, fullName: name, valeur: val }));

  // --- Exports Premium ---
  function exportLocalPDF() {
    const columns = [
      { key: 'nom', header: 'ÉTABLISSEMENT' }, { key: 'type', header: 'TYPE' }, { key: 'contact', header: 'CONTACT' }, { key: 'tel', header: 'TÉLÉPHONE' },
      { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' }
    ];
    const dataToExport = filtered.map(c => ({ ...c, statut: c.actif === false ? 'INACTIF' : 'ACTIF' }));
    generatePremiumPDF({ title: 'Annuaire des Clients', data: dataToExport, columns, filename: 'Annuaire_Clients' });
  }

  function exportLocalExcel() {
    const columns = [
      { key: 'id', header: 'ID CLIENT' }, { key: 'nom', header: 'ÉTABLISSEMENT' }, { key: 'type', header: 'TYPE' }, { key: 'contact', header: 'CONTACT PRINCIPAL' }, 
      { key: 'tel', header: 'TÉLÉPHONE' }, { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' },
      { key: 'statut', header: 'STATUT' }
    ];
    const dataToExport = filtered.map(c => ({ ...c, statut: c.actif === false ? 'INACTIF' : 'ACTIF', score: c.score || 0 }));
    generatePremiumExcel({ title: 'BASE DE DONNÉES CLIENTS', data: dataToExport, columns, filename: 'Clients_BDD' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER & ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: '0 0 6px 0', color: '#818cf8', letterSpacing: '-0.5px' }}>
            Annuaire Clients
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Gérez vos hôpitaux, cliniques et autres établissements partenaires.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportLocalPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(225, 29, 72, 0.1)', color: '#f43f5e', border: '1px solid rgba(225, 29, 72, 0.2)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)'} title="Exporter en PDF Premium">
            📄 PDF
          </button>
          <button onClick={exportLocalExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'} title="Exporter en Excel Premium">
            📊 Excel
          </button>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)' }} onMouseEnter={e => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)'}} onMouseLeave={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.3)'}}>
            <span style={{ fontSize: '1.2rem', fontWeight: 300, color: '#c7d2fe' }}>+</span> Nouveau Client
          </button>
        </div>
      </div>

      {/* TOP SECTION: KPIs (Left) & Graph (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        
        {/* KPI 1 : Total */}
        <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px', borderLeft: '3px solid #3b82f6', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>🏥</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Établissements</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{totalClients}</div>
        </div>

        {/* KPI 2 : Actifs */}
        <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '24px', borderLeft: '3px solid #10b981', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ color: '#10b981', fontSize: '1rem' }}>⚡</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clients Actifs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{clientsActifs}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 20 }}>
              {(totalClients ? (clientsActifs/totalClients)*100 : 0).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* GRAPHIQUE ANALYTIQUE (Prend 2 colonnes) */}
        <div style={{ gridColumn: 'span 2', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem', color: '#818cf8' }}>📈</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Clients (Chiffre d'Affaires en F)</span>
          </div>
          <div style={{ flex: 1, minHeight: 80 }}>
            {topClientsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: '0.8rem', color: '#f8fafc' }} formatter={(val) => [`${val.toLocaleString('fr-FR')} F`, "Chiffre d'Affaires"]} labelFormatter={(label) => `Client : ${label}`} />
                  <Bar dataKey="valeur" radius={[4, 4, 0, 0]}>
                    {topClientsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#34d399'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: '#64748b', fontSize: '0.8rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Aucun mouvement de sortie pour générer le graphique.</div>}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER (Table & Toolbar) */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 16, overflow: 'hidden' }}>
        
        {/* TOOLBAR (Onglets & Recherche) */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: 10 }}>
             {[ { id: 'tous', label: 'Tous' }, { id: 'public', label: 'Public & Militaire' }, { id: 'prive', label: 'Privé & Cabinets' }, { id: 'inactifs', label: 'Inactifs' } ].map(tab => (
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
             <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, établissement, type..." 
               style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc', padding: '10px 14px 10px 40px', borderRadius: 20, fontSize: '0.85rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
               onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#1e293b' }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.05)'; e.target.style.background = '#0f172a' }}
             />
          </div>
        </div>

        {/* ═══ MASONRY GRID : CARTES CLIENTS ═══ */}
        <div style={{ padding: '0 20px 24px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
               <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>🏥</div>
               <div style={{ fontSize: '0.9rem' }}>Aucun client trouvé avec ces critères.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filtered.map(c => {
                  const nbCmds = mouvements.filter(m => m.type === 'Sortie' && m.client_fourn === c.nom).length;
                  const ca = mouvements.filter(m => m.type === 'Sortie' && m.client_fourn === c.nom).reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);
                  const isActif = c.actif !== false;
                  let borderColor = isActif ? (c.type.includes('priv') || c.type.includes('medical') || c.type.includes('Cabinet') ? '#a855f7' : '#10b981') : '#ef4444';

                  return (
                    <article key={c.id} style={{ 
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
                            <div style={{ width: 46, height: 46, borderRadius: '14px', background: isActif ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isActif ? '#34d399' : '#f87171', border: `1px solid ${isActif ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
                               {(c.nom || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.2 }}>{c.nom}</h3>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: 10, alignItems: 'center' }}>
                                ID: {(c.id || '').toString().substring(0, 8)}
                                {!isActif && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>INACTIF</span>}
                              </div>
                            </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', flex: 1, marginBottom: '20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontSize: '0.75rem' }}>🏥</div> 
                           <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{c.type}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>👤</div> 
                           <span style={{ color: '#cbd5e1' }}>{c.contact || 'Non renseigné'}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>📍</div> 
                           <span style={{ color: '#cbd5e1' }}>{[c.ville, c.pays].filter(Boolean).join(', ') || 'Localisation inconnue'}</span>
                         </div>
                         {c.tel && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>📞</div> <span style={{ color: '#cbd5e1' }}>{c.tel}</span></div>}
                      </div>

                      {/* CA & Performance */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Commandes</div>
                           <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>{nbCmds} trans.</div>
                        </div>
                        {ca > 0 && (
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Chiffre d'Affaires</div>
                             <div style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{ca.toLocaleString('fr-FR')} F</div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                         <button style={{ flex: 1, padding: '12px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onClick={() => openEdit(c)}>
                            ✏️ Éditer Dossier
                         </button>
                         <button onClick={() => setConfirmId(c.id)} style={{ padding: '12px', width: 44, background: 'rgba(239,68,68,0.05)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? '✏️ Éditer le Client' : '➕ Ajouter un Client'} width={650}>
        <div style={{ background: 'rgba(59,130,246,0.1)', padding: 16, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(59,130,246,0.2)', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, flex: 1 }}>Les informations saisies ici permettront de suivre l'historique des sorties et la facturation.</p>
            {/* Toggle Actif/Inactif */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', marginLeft: 16 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: form.actif !== false ? '#10b981' : '#f43f5e' }}>{form.actif !== false ? '🟢 ACTIF' : '🔴 INACTIF'}</span>
                <input type="checkbox" checked={form.actif !== false} onChange={e => set('actif', e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
            </label>
        </div>
        
        <FormGrid cols={2}>
          <FormGroup label="Nom de l'établissement *" full><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="CHU de Dakar, Clinique Pasteur..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Type d'établissement">
            <select value={form.type || 'Hôpital public'} onChange={e => set('type', e.target.value)} style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none' }}>
              {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Contact Principal"><Input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Nom du responsable / Acheteur" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Téléphone"><Input value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+221 ..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Email de contact"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@hopital.com" style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Pays"><Input value={form.pays} onChange={e => set('pays', e.target.value)} placeholder="Sénégal..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Ville / Adresse"><Input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Dakar..." style={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} /></FormGroup>
          <FormGroup label="Évaluation (Score client)">
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
          <button onClick={save} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{editId ? '💾 Mettre à jour' : '💾 Enregistrer'}</button>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => { deleteClient(confirmId); setConfirmId(null); }} message="Êtes-vous sûr de vouloir supprimer définitivement ce client ? Les historiques de sorties associés seront conservés." />
    </div>
  );
}

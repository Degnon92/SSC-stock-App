import React, { useMemo, useState } from 'react';
import { PageHeader, SectionCard, Empty } from '../UI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export function Analyses({ store }) {
  const { produits, mouvements, fournisseurs, valeurStock, valeurVente } = store;
  const [periode, setPeriode] = useState('30'); // '7', '30', '90', 'all'

  // ⚡ OPTIMISATION : tous les calculs lourds mis en cache + filtrage temporel
  const {
    caTotal, achatTotal, marge, txMarge,
    topVentes, topClients, topCategories, topFourn,
    donneesEvolution, donneesCategories
  } = useMemo(() => {

    // Filtrage des mouvements selon la période
    const now = new Date();
    const joursFiltre = periode === 'all' ? Infinity : parseInt(periode, 10);
    const msFiltre = joursFiltre * 24 * 60 * 60 * 1000;

    const mouvementsFiltres = mouvements.filter(m => {
      if (joursFiltre === Infinity) return true;
      const mDate = m.date ? new Date(m.date) : new Date(m.timestamp || Date.now());
      return (now - mDate) <= msFiltre;
    });

    let ca = 0;
    let achat = 0;
    const ventes = {};
    const clientsCA = {};
    const evolutionParJour = {}; // Pour le graphique d'évolution

    mouvementsFiltres.forEach(m => {
      const montant = m.qte * (m.prix_unitaire || 0);

      // Date pour l'évolution
      const dateObj = m.date ? new Date(m.date) : new Date(m.timestamp || Date.now());
      const dateJour = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

      if (!evolutionParJour[dateJour]) {
        evolutionParJour[dateJour] = { date: dateJour, ventes: 0, achats: 0 };
      }

      if (m.type === 'Sortie') {
        ca += montant;
        ventes[m.produit_nom] = ventes[m.produit_nom] || { qte: 0, ca: 0 };
        ventes[m.produit_nom].qte += m.qte;
        ventes[m.produit_nom].ca += montant;
        evolutionParJour[dateJour].ventes += montant;

        if (m.client_fourn) {
          clientsCA[m.client_fourn] = (clientsCA[m.client_fourn] || 0) + montant;
        }
      } else if (m.type === 'Entrée') {
        achat += montant;
        evolutionParJour[dateJour].achats += montant;
      }
    });

    // Marge actuelle = valeurVente globale - valeurStock global (Indépendant de la période)
    const mrg = valeurVente - valeurStock;
    const tx = valeurVente > 0 ? ((mrg / valeurVente) * 100).toFixed(1) : 0;

    const tVentes = Object.entries(ventes).sort((a, b) => b[1].ca - a[1].ca).slice(0, 5);
    const tClients = Object.entries(clientsCA).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const parCat = {};
    const volFourn = {};
    produits.forEach(p => {
      const val = p.stock * (p.prix_achat || 0);
      const cat = p.cat || 'Non classé';
      parCat[cat] = (parCat[cat] || 0) + val;
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      if (fourn) volFourn[fourn.nom] = (volFourn[fourn.nom] || 0) + val;
    });

    const tCat = Object.entries(parCat).sort((a, b) => b[1] - a[1]);
    const tFourn = Object.entries(volFourn).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Formatage des données pour les graphiques
    // 1. Évolution chronologique
    const chartEvolution = Object.values(evolutionParJour).sort((a, b) => {
        // Simple tri, à améliorer si les années sont différentes, mais pour 30 jours c'est OK
        const [dayA, monthA] = a.date.split(' ');
        const [dayB, monthB] = b.date.split(' ');
        const monthOrder = { 'janv.': 1, 'févr.': 2, 'mars': 3, 'avr.': 4, 'mai': 5, 'juin': 6, 'juil.': 7, 'août': 8, 'sept.': 9, 'oct.': 10, 'nov.': 11, 'déc.': 12 };
        if (monthOrder[monthA] !== monthOrder[monthB]) return monthOrder[monthA] - monthOrder[monthB];
        return parseInt(dayA) - parseInt(dayB);
    });

    // 2. Répartition graphique catégories
    const chartCategories = tCat.map(([name, value]) => ({ name, value })).filter(c => c.value > 0);

    return {
      caTotal: ca,
      achatTotal: achat,
      marge: mrg,
      txMarge: tx,
      topVentes: tVentes,
      topClients: tClients,
      topCategories: tCat,
      topFourn: tFourn,
      donneesEvolution: chartEvolution,
      donneesCategories: chartCategories
    };
  }, [mouvements, produits, fournisseurs, valeurStock, valeurVente, periode]);

  const catColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Custom Tooltip pour le graphique
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: entry.color }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }}></span>
              <span style={{ fontSize: '0.85rem' }}>{entry.name}: {entry.value.toLocaleString('fr-FR')} F</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <PageHeader title="📊 Tableau de Bord Analytique" />

        {/* Filtre de Période (Glassmorphism) */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          padding: 4,
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid var(--border-color)'
        }}>
          {[
            { id: '7', label: '7 Jours' },
            { id: '30', label: '30 Jours' },
            { id: '90', label: '3 Mois' },
            { id: 'all', label: 'Global' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriode(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: periode === p.id ? 'var(--primary-color)' : 'transparent',
                color: periode === p.id ? 'white' : 'var(--text-main)',
                fontWeight: periode === p.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards (Glassmorphism Premium) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Chiffre d\'Affaires', value: caTotal.toLocaleString('fr-FR') + ' F', color: '#10b981', bgGrad: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)', icon: '💰', sub: `Sur ${periode === 'all' ? 'tout l\'historique' : periode + ' jours'}` },
          { label: 'Achats (Dépenses)', value: achatTotal.toLocaleString('fr-FR') + ' F', color: '#ef4444', bgGrad: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%)', icon: '🛒', sub: `Sur ${periode === 'all' ? 'tout l\'historique' : periode + ' jours'}` },
          { label: 'Valeur Stock Actuel', value: valeurStock.toLocaleString('fr-FR') + ' F', color: '#3b82f6', bgGrad: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)', icon: '📦', sub: 'Immobilisation courante' },
          { label: 'Marge Potentielle', value: marge.toLocaleString('fr-FR') + ' F', color: '#8b5cf6', bgGrad: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)', icon: '📈', sub: `${txMarge}% de rentabilité globale` },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            backgroundImage: s.bgGrad,
            borderRadius: 16,
            padding: '20px',
            border: `1px solid ${s.color}30`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '4rem', opacity: 0.05 }}>{s.icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {s.icon}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <SectionCard title="📈 Évolution des Flux (Ventes & Achats)">
          {donneesEvolution.length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty icon="📉" message={`Aucun mouvement sur les ${periode === 'all' ? 'archives' : periode + ' derniers jours'}`} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={donneesEvolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAchats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={60} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                  <Area type="monotone" dataKey="ventes" name="Ventes (CA)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
                  <Area type="monotone" dataKey="achats" name="Achats" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAchats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="📊 Répartition du Stock (Valeur)">
           {donneesCategories.length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty icon="pie" message="Aucune donnée" />
            </div>
          ) : (
            <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donneesCategories}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {donneesCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: '-20px' }}>
                {donneesCategories.slice(0, 4).map((cat, i) => (
                   <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }}></span>
                     {cat.name}
                   </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Top Produits & Clients (Nouveau Design) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Top Produits */}
        <SectionCard title="🏆 Top Ventes">
          {topVentes.length === 0 ? <Empty icon="📦" message="Aucune vente" /> : topVentes.map(([nom, d], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === topVentes.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: i===0 ? '#fef3c7' : i===1 ? '#f3f4f6' : i===2 ? '#ffedd5' : 'var(--input-bg)', color: i===0 ? '#d97706' : i===1 ? '#4b5563' : i===2 ? '#c2410c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.qte} unités vendues</div>
              </div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>{d.ca.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>

        {/* Top Clients */}
        <SectionCard title="⭐ Top Clients">
          {topClients.length === 0 ? <Empty icon="🏥" message="Aucun client" /> : topClients.map(([nom, ca], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === topClients.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                {nom.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
              <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.9rem' }}>{ca.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>

         {/* Top Fournisseurs */}
         <SectionCard title="🏭 Partenaires (Fournisseurs)">
          {topFourn.length === 0 ? <Empty icon="🏭" message="Aucun fournisseur" /> : topFourn.map(([nom, val], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === topFourn.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
               <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                {nom.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
              <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.9rem' }}>{val.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>

      </div>
    </div>
  );
}

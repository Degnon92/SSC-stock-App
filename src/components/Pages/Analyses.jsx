import React, { useMemo } from 'react';
import { PageHeader, SectionCard, Empty } from '../UI';

export function Analyses({ store }) {
  const { produits, mouvements, fournisseurs, valeurStock, valeurVente } = store;

  // ⚡ OPTIMISATION : tous les calculs lourds mis en cache
  const { caTotal, achatTotal, marge, txMarge, topVentes, topClients, topCategories, topFourn } = useMemo(() => {
    let ca = 0;
    let achat = 0;
    const ventes = {};
    const clientsCA = {};

    mouvements.forEach(m => {
      const montant = m.qte * (m.prix_unitaire || 0);
      if (m.type === 'Sortie') {
        ca += montant;
        ventes[m.produit_nom] = ventes[m.produit_nom] || { qte: 0, ca: 0 };
        ventes[m.produit_nom].qte += m.qte;
        ventes[m.produit_nom].ca += montant;
        if (m.client_fourn) {
          clientsCA[m.client_fourn] = (clientsCA[m.client_fourn] || 0) + montant;
        }
      } else if (m.type === 'Entrée') {
        achat += montant;
      }
    });

    const mrg = valeurVente - valeurStock;
    const tx = valeurVente > 0 ? ((mrg / valeurVente) * 100).toFixed(1) : 0;
    const tVentes = Object.entries(ventes).sort((a, b) => b[1].ca - a[1].ca).slice(0, 8);
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

    return { caTotal: ca, achatTotal: achat, marge: mrg, txMarge: tx, topVentes: tVentes, topClients: tClients, topCategories: tCat, topFourn: tFourn };
  }, [mouvements, produits, fournisseurs, valeurStock, valeurVente]);

  const catColors = ['#7c3aed', '#0079c1', '#00a878', '#f4a261', '#e63946', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📈 Analyses & Statistiques" />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'CA total (ventes)', value: caTotal.toLocaleString('fr-FR') + ' F', color: '#00a878', icon: '💰' },
          { label: 'Achats total', value: achatTotal.toLocaleString('fr-FR') + ' F', color: '#e63946', icon: '🛒' },
          { label: 'Valeur stock actuel', value: valeurStock.toLocaleString('fr-FR') + ' F', color: '#0079c1', icon: '📦' },
          { label: 'Valeur revente possible', value: valeurVente.toLocaleString('fr-FR') + ' F', color: '#7c3aed', icon: '💎' },
          { label: 'Marge potentielle', value: `${marge.toLocaleString('fr-FR')} F (${txMarge}%)`, color: '#00a878', icon: '📊' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(10,37,64,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Catégories & Fournisseurs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <SectionCard title="📊 Répartition par Catégorie (valeur stock)">
          {topCategories.length === 0 ? <Empty icon="📊" message="Aucune donnée" /> : topCategories.map(([cat, val], i) => {
            const total = topCategories.reduce((s, [, v]) => s + v, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return (
              <div key={cat} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat}</span>
                  <span style={{ fontSize: '0.78rem', color: catColors[i % catColors.length], fontWeight: 700 }}>{val.toLocaleString('fr-FR')} F ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: catColors[i % catColors.length], borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </SectionCard>

        <SectionCard title="🏭 Top Fournisseurs (par valeur stock)">
          {topFourn.length === 0 ? <Empty icon="🏭" message="Aucun fournisseur" /> : topFourn.map(([nom, val], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: i < 3 ? '#f4a261' : '#a0aec0', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{nom}</div>
              <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.85rem' }}>{val.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Top Produits & Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SectionCard title="🏆 Top produits (par chiffre d'affaires)">
          {topVentes.length === 0 ? <Empty icon="📦" message="Aucune vente enregistrée" /> : topVentes.map(([nom, d], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: i < 3 ? '#f4a261' : '#a0aec0', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#00a878', fontSize: '0.85rem' }}>{d.ca.toLocaleString('fr-FR')} F</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.qte} unités</div>
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="🏥 Top clients (par CA)">
          {topClients.length === 0 ? <Empty icon="🏥" message="Aucun client avec ventes" /> : topClients.map(([nom, ca], i) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: i < 3 ? '#0079c1' : '#a0aec0', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{nom}</div>
              <div style={{ fontWeight: 700, color: '#0079c1', fontSize: '0.85rem' }}>{ca.toLocaleString('fr-FR')} F</div>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

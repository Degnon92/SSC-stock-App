import React from 'react';
import { PageHeader } from '../UI';
import { generatePremiumPDF, generatePremiumExcel, exportCompletExcel } from '../../utils/exportUtils';
import { generateRapportFlash } from '../../utils/pdfUtils';

// ─── HELPER ───────────────────────────────────────────────────────────────────
const ExportCard = ({ icon, title, description, color, onClick, format }) => (
  <div
    className="export-card-hover"
    onClick={onClick}
    style={{
      '--hover-color': color,
      '--hover-shadow': `${color}25`,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 16,
      padding: '20px 22px',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ display: 'inline-block', background: `${color}20`, color, padding: '3px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{format}</span>
      <span style={{ fontSize: '0.8rem', color }}>Télécharger →</span>
    </div>
  </div>
);

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export function Rapports({ store }) {
  const { produits, mouvements, fournisseurs, alertes, auditLogs = [] } = store;

  // ── PDF ──
  function exportInventairePDF() {
    const data = produits.map(p => {
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      return { ...p, fourn_nom: fourn ? fourn.nom : '—', valeur_stock: p.stock * p.prix_achat };
    });
    const columns = [
      { key: 'ref', header: 'RÉF' }, { key: 'nom', header: 'DÉSIGNATION' }, { key: 'cat', header: 'CATÉGORIE' },
      { key: 'stock', header: 'STOCK', align: 'center' }, { key: 'seuil', header: 'SEUIL', align: 'center' },
      { key: 'prix_achat', header: 'P.ACHAT', isCurrency: true, align: 'right' }, { key: 'prix_vente', header: 'P.VENTE', isCurrency: true, align: 'right' },
      { key: 'fourn_nom', header: 'FOURNISSEUR' },
    ];
    generatePremiumPDF({ title: 'Inventaire Complet', data, columns, filename: 'Inventaire' });
  }

  function exportMouvementsPDF() {
    const data = mouvements.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    const columns = [
      { key: 'date', header: 'DATE' }, { key: 'produit_nom', header: 'PRODUIT' }, { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QTE', align: 'center' }, { key: 'prix_unitaire', header: 'P.UNIT', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT', isCurrency: true, align: 'right' }, { key: 'client_fourn', header: 'TIERS' },
      { key: 'motif', header: 'MOTIF' }, { key: 'operateur', header: 'OPERATEUR' },
    ];
    generatePremiumPDF({ title: 'Journal des Mouvements', data, columns, filename: 'Mouvements' });
  }

  function exportAlertesPDF() {
    const data = (alertes || []).map(a => {
      const typeAlerte = a.stock === 0 ? 'Rupture' : (a.date_expiration ? 'Expiration' : 'Stock Faible');
      return { ...a, type_alerte: typeAlerte };
    });
    const columns = [
      { key: 'ref', header: 'RÉF' }, { key: 'nom', header: 'PRODUIT' }, { key: 'cat', header: 'CATÉGORIE' },
      { key: 'type_alerte', header: 'TYPE ALERTE' }, { key: 'stock', header: 'STOCK ACTUEL', align: 'center' },
      { key: 'seuil', header: 'SEUIL', align: 'center' },
    ];
    generatePremiumPDF({ title: 'Rapport des Alertes Stock', data, columns, filename: 'Alertes_Stock' });
  }

  function exportFournsPDF() {
    const columns = [
      { key: 'nom', header: 'SOCIÉTÉ' }, { key: 'contact', header: 'CONTACT' }, { key: 'tel', header: 'TÉLÉPHONE' },
      { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' },
      { key: 'spec', header: 'SPÉCIALITÉ' },
    ];
    generatePremiumPDF({ title: 'Répertoire Fournisseurs', data: fournisseurs, columns, filename: 'Fournisseurs' });
  }

  // ── EXCEL ──
  function exportInventaireXLS() {
    const data = produits.map(p => {
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      return { ...p, fourn_nom: fourn ? fourn.nom : '—', valeur_stock: p.stock * p.prix_achat };
    });
    const columns = [
      { key: 'ref', header: 'RÉF' }, { key: 'nom', header: 'DÉSIGNATION' }, { key: 'cat', header: 'CATÉGORIE' },
      { key: 'stock', header: 'STOCK', align: 'center' }, { key: 'seuil', header: 'SEUIL', align: 'center' },
      { key: 'prix_achat', header: 'PRIX ACHAT', isCurrency: true, align: 'right' }, { key: 'prix_vente', header: 'PRIX VENTE', isCurrency: true, align: 'right' },
      { key: 'fourn_nom', header: 'FOURNISSEUR' }, { key: 'valeur_stock', header: 'VALEUR STOCK', isCurrency: true, align: 'right' },
    ];
    generatePremiumExcel({ title: 'INVENTAIRE DES PRODUITS', data, columns, filename: 'Inventaire' });
  }

  function exportMouvementsXLS() {
    const data = mouvements.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    const columns = [
      { key: 'date', header: 'DATE' }, { key: 'produit_nom', header: 'PRODUIT' }, { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QUANTITÉ', align: 'center' }, { key: 'prix_unitaire', header: 'P.UNIT', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT', isCurrency: true, align: 'right' }, { key: 'client_fourn', header: 'TIERS' },
      { key: 'motif', header: 'MOTIF' }, { key: 'operateur', header: 'OPERATEUR' },
    ];
    generatePremiumExcel({ title: 'HISTORIQUE DES MOUVEMENTS', data, columns, filename: 'Mouvements' });
  }

  function exportAuditXLS() {
    const columns = [
      { key: 'timestamp', header: 'DATE - HEURE', render: a => new Date(a.timestamp).toLocaleString('fr-FR') },
      { key: 'userEmail', header: 'UTILISATEUR' }, { key: 'action', header: 'ACTION' },
      { key: 'module', header: 'MODULE' }, { key: 'details', header: 'DÉTAILS' },
    ];
    generatePremiumExcel({ title: "JOURNAL D'AUDIT", data: auditLogs, columns, filename: 'Audit_Logs' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <PageHeader title="📤 Rapports & Exports" />

      {/* ═══ EXPORTS PDF ═══ */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: 'rgba(230,57,70,0.15)', color: '#e63946', padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800 }}>PDF</span>
        Exports Document Premium
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <ExportCard icon="⚡" title="Rapport Flash" description="Synthèse: alertes, marge, performance" color="#7c3aed" format="PDF" onClick={() => generateRapportFlash({ storeVal: store })} />
        <ExportCard icon="📦" title="Inventaire PDF" description={`${produits.length} produits — modèle Premium`} color="#0079c1" format="PDF HD" onClick={exportInventairePDF} />
        <ExportCard icon="🔄" title="Mouvements PDF" description={`${mouvements.length} mouvements enregistrés`} color="#00a878" format="PDF HD" onClick={exportMouvementsPDF} />
        <ExportCard icon="🚨" title="Alertes Stock PDF" description={`${(alertes || []).length} alertes actives`} color="#e63946" format="PDF HD" onClick={exportAlertesPDF} />
        <ExportCard icon="🏭" title="Fournisseurs PDF" description={`${fournisseurs.length} fournisseurs référencés`} color="#f4a261" format="PDF HD" onClick={exportFournsPDF} />
      </div>

      {/* ═══ EXPORTS EXCEL ═══ */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: 'rgba(0,168,120,0.15)', color: '#00a878', padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800 }}>XLSX</span>
        Exports Excel Premium
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        <ExportCard icon="📋" title="Rapport Complet (Défaut)" description="Archive système brute (Multi-onglets)" color="#00a878" format="XLSX" onClick={() => exportCompletExcel({ produits, fournisseurs, mouvements, auditLogs })} />
        <ExportCard icon="📦" title="Inventaire Excel" description={`${produits.length} produits avec format auto-fit`} color="#0079c1" format="XLSX Premium" onClick={exportInventaireXLS} />
        <ExportCard icon="🔄" title="Mouvements Excel" description={`${mouvements.length} mouvements avec totaux`} color="#7c3aed" format="XLSX Premium" onClick={exportMouvementsXLS} />
        <ExportCard icon="🛡️" title="Audit Logs Excel" description={`${auditLogs.length} entrées d'audit`} color="#f4a261" format="XLSX Premium" onClick={exportAuditXLS} />
      </div>
    </div>
  );
}

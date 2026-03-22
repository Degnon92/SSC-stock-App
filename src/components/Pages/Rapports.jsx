import React, { useState } from 'react';
import { PageHeader } from '../UI';
import { generatePremiumPDF, generatePremiumExcel, exportCompletExcel } from '../../utils/exportUtils';
import { generateRapportFlash } from '../../utils/pdfUtils';

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

const ExportCard = ({ icon, title, description, color, onClick, format, popular }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isHovered ? color + '50' : 'var(--border-color)'}`,
        borderRadius: 20,
        padding: '24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: isHovered ? `0 12px 24px -10px ${color}40, 0 4px 10px -5px rgba(0,0,0,0.1)` : '0 2px 10px rgba(0,0,0,0.02)',
      }}
    >
      {/* Background Gradient Effect on Hover */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        background: `radial-gradient(circle at top right, ${color}15, transparent 60%)`,
        opacity: isHovered ? 1 : 0.4,
        transition: 'opacity 0.3s ease'
      }} />

      {/* Popular Badge */}
      {popular && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          color: 'white', fontSize: '0.65rem', fontWeight: 800,
          padding: '4px 8px', borderRadius: 10,
          boxShadow: '0 2px 4px rgba(234,88,12,0.3)',
          letterSpacing: 0.5, textTransform: 'uppercase'
        }}>
          Recommandé
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: isHovered ? color : `${color}15`,
            color: isHovered ? 'white' : color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', flexShrink: 0,
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? `0 4px 12px ${color}40` : 'none'
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 'auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `${color}10`, color: color,
            padding: '4px 12px', borderRadius: 20,
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.5
          }}>
            {format.includes('PDF') ? '📄' : '📊'} {format}
          </span>
          <span style={{
            fontSize: '0.85rem', fontWeight: 700, color: color,
            transform: isHovered ? 'translateX(4px)' : 'none',
            transition: 'transform 0.3s ease',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            Générer <span style={{ fontSize: '1.2rem' }}>→</span>
          </span>
        </div>
      </div>
    </div>
  );
};

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
    generatePremiumPDF({ title: 'Inventaire Complet', data, columns, filename: 'Inventaire_Complet' });
  }

  function exportMouvementsPDF() {
    const data = mouvements.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    const columns = [
      { key: 'date', header: 'DATE' }, { key: 'produit_nom', header: 'PRODUIT' }, { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QTE', align: 'center' }, { key: 'prix_unitaire', header: 'P.UNIT', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT', isCurrency: true, align: 'right' }, { key: 'client_fourn', header: 'TIERS' },
      { key: 'motif', header: 'MOTIF' }, { key: 'operateur', header: 'OPERATEUR' },
    ];
    generatePremiumPDF({ title: 'Journal des Mouvements', data, columns, filename: 'Mouvements_Journal' });
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
    generatePremiumPDF({ title: 'Répertoire Fournisseurs', data: fournisseurs, columns, filename: 'Repertoire_Fournisseurs' });
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
    generatePremiumExcel({ title: 'INVENTAIRE DES PRODUITS', data, columns, filename: 'Inventaire_Details' });
  }

  function exportMouvementsXLS() {
    const data = mouvements.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
    const columns = [
      { key: 'date', header: 'DATE' }, { key: 'produit_nom', header: 'PRODUIT' }, { key: 'type', header: 'TYPE', align: 'center' },
      { key: 'qte', header: 'QUANTITÉ', align: 'center' }, { key: 'prix_unitaire', header: 'P.UNIT', isCurrency: true, align: 'right' },
      { key: 'montant', header: 'MONTANT', isCurrency: true, align: 'right' }, { key: 'client_fourn', header: 'TIERS' },
      { key: 'motif', header: 'MOTIF' }, { key: 'operateur', header: 'OPERATEUR' },
    ];
    generatePremiumExcel({ title: 'HISTORIQUE DES MOUVEMENTS', data, columns, filename: 'Mouvements_Historique' });
  }

  function exportAuditXLS() {
    const columns = [
      { key: 'timestamp', header: 'DATE - HEURE', render: a => new Date(a.timestamp).toLocaleString('fr-FR') },
      { key: 'userEmail', header: 'UTILISATEUR' }, { key: 'action', header: 'ACTION' },
      { key: 'module', header: 'MODULE' }, { key: 'details', header: 'DÉTAILS' },
    ];
    generatePremiumExcel({ title: "JOURNAL D'AUDIT", data: auditLogs, columns, filename: 'Logs_Securite' });
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ marginBottom: 32 }}>
        <PageHeader title="📤 Centre d'Exports & Rapports" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: -15, marginLeft: 2 }}>
          Générez des documents professionnels et analysez vos données en profondeur.
        </p>
      </div>

      {/* ═══ EXPORTS PDF ═══ */}
      <div style={{
        background: 'linear-gradient(to right, rgba(239,68,68,0.05), transparent)',
        borderLeft: '4px solid #ef4444',
        padding: '12px 20px',
        borderRadius: '0 12px 12px 0',
        marginBottom: 24,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ width: 32, height: 32, background: '#ef4444', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>PDF</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Documents Premium (Impression)</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 40 }}>
        <ExportCard popular icon="⚡" title="Rapport Flash Synthétique" description="Un résumé visuel de l'état actuel : KPI, alertes, marges. Idéal pour les réunions." color="#8b5cf6" format="PDF HD" onClick={() => generateRapportFlash({ storeVal: store })} />
        <ExportCard icon="📦" title="État de l'Inventaire" description={`Liste complète valorisée de vos ${produits.length} produits en stock.`} color="#3b82f6" format="PDF A4" onClick={exportInventairePDF} />
        <ExportCard icon="🔄" title="Livre des Mouvements" description={`Historique détaillé des ${mouvements.length} entrées et sorties récentes.`} color="#10b981" format="PDF A4" onClick={exportMouvementsPDF} />
        <ExportCard icon="🚨" title="Rapport d'Alertes" description={`Extraction des ${(alertes || []).length} produits nécessitant votre attention (ruptures, etc).`} color="#ef4444" format="PDF A4" onClick={exportAlertesPDF} />
        <ExportCard icon="🏭" title="Annuaire Fournisseurs" description={`Coordonnées complètes de vos ${fournisseurs.length} partenaires.`} color="#f59e0b" format="PDF A4" onClick={exportFournsPDF} />
      </div>

      {/* ═══ EXPORTS EXCEL ═══ */}
      <div style={{
        background: 'linear-gradient(to right, rgba(16,185,129,0.05), transparent)',
        borderLeft: '4px solid #10b981',
        padding: '12px 20px',
        borderRadius: '0 12px 12px 0',
        marginBottom: 24,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{ width: 32, height: 32, background: '#10b981', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>XLS</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Données Brutes (Analyse)</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        <ExportCard popular icon="📋" title="Archive Complète (Multi-onglets)" description="Export total du système (Produits, Mouvements, Fournisseurs) dans un seul fichier." color="#10b981" format="XLSX Complet" onClick={() => exportCompletExcel({ produits, fournisseurs, mouvements, auditLogs })} />
        <ExportCard icon="📦" title="Inventaire Analytique" description={`Export des ${produits.length} produits avec colonnes de calcul de valorisation.`} color="#3b82f6" format="XLSX" onClick={exportInventaireXLS} />
        <ExportCard icon="🔄" title="Analyse des Mouvements" description={`Export des ${mouvements.length} flux avec filtres Excel pré-activés.`} color="#8b5cf6" format="XLSX" onClick={exportMouvementsXLS} />
        <ExportCard icon="🛡️" title="Journal de Sécurité (Audit)" description={`Traçabilité des ${auditLogs.length} dernières actions utilisateurs.`} color="#64748b" format="XLSX" onClick={exportAuditXLS} />
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: 40, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
         <div style={{ fontSize: '2rem' }}>💡</div>
         <div>
           <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Conseil d'utilisation</div>
           <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Utilisez les exports <strong>PDF</strong> pour la présentation et l'impression (bilans, réunions). Préférez les exports <strong>Excel (XLSX)</strong> si vous devez retraiter les données, faire des graphiques croisés dynamiques ou transmettre à votre comptable.</div>
         </div>
      </div>
    </div>
  );
}

// ============================================================
// SSC — pdfUtils.js  (jsPDF + autoTable)
// Génère des PDFs professionnels pour :
//   - Bon de commande fournisseur
//   - Rapport de mouvements
//   - Facture client
//   - Fiche produit / inventaire
// ============================================================

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BRAND = {
  primary:  [10,  37,  64],   // #0a2540
  accent:   [0,  168, 120],   // #00a878
  muted:    [107, 124, 147],  // #6b7c93
  light:    [240, 244, 248],  // #f0f4f8
  white:    [255, 255, 255],
  danger:   [230,  57,  70],  // #e63946
};

function header(doc, title, subtitle = '') {
  // Bande supérieure
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, 210, 28, 'F');

  // Logo / titre entreprise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.white);
  doc.text('SSC', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 200, 220);
  doc.text('Surgical Services Consulting', 14, 19);

  // Titre du document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text(title, 210 - 14, 13, { align: 'right' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 220);
    doc.text(subtitle, 210 - 14, 20, { align: 'right' });
  }

  // Ligne accent
  doc.setFillColor(...BRAND.accent);
  doc.rect(0, 28, 210, 1.5, 'F');

  return 38; // y position after header
}

function footer(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...BRAND.light);
    doc.rect(0, 283, 210, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text('SSC — Surgical Services Consulting  |  Document généré automatiquement', 14, 291);
    doc.text(`Page ${i} / ${pageCount}  |  ${new Date().toLocaleDateString('fr-FR')}`, 196, 291, { align: 'right' });
  }
}

function infoBox(doc, y, items) {
  doc.setFillColor(...BRAND.light);
  doc.roundedRect(14, y, 182, items.length * 7 + 8, 3, 3, 'F');
  doc.setFontSize(8.5);
  items.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.muted);
    doc.text(label + ':', 20, y + 8 + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.primary);
    doc.text(String(value || '—'), 65, y + 8 + i * 7);
  });
  return y + items.length * 7 + 16;
}

// ── 1. BON DE COMMANDE FOURNISSEUR ──────────────────────────────────────────
export function generateBonCommande({ fournisseur, produits, operateur, notes = '' }) {
  const doc = new jsPDF();
  const num = `BC-${Date.now().toString().slice(-6)}`;
  let y = header(doc, 'BON DE COMMANDE', `N° ${num}`);

  y = infoBox(doc, y, [
    ['Fournisseur',  fournisseur?.nom],
    ['Contact',      fournisseur?.contact],
    ['Téléphone',    fournisseur?.tel],
    ['Email',        fournisseur?.email],
    ['Date',         new Date().toLocaleDateString('fr-FR')],
    ['Opérateur',    operateur],
  ]);

  doc.autoTable({
    startY: y,
    head: [['Référence', 'Désignation', 'Qté commandée', 'Prix unitaire', 'Total estimé']],
    body: produits.map(p => [
      p.ref,
      p.nom,
      p.qte_commande,
      `${(p.prix_achat || 0).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`,
      `${((p.prix_achat || 0) * p.qte_commande).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`,
    ]),
    foot: [[
      '', '', '', 'TOTAL ESTIMÉ :',
      `${produits.reduce((s, p) => s + (p.prix_achat || 0) * p.qte_commande, 0).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`
    ]],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    footStyles: { fillColor: BRAND.accent, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 25 }, 4: { halign: 'right' } },
  });

  if (notes) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.muted);
    doc.text('Notes :', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.primary);
    doc.text(notes, 14, finalY + 7, { maxWidth: 182 });
  }

  footer(doc);
  doc.save(`bon-commande-${num}.pdf`);
}

// ── 2. RAPPORT DE MOUVEMENTS ─────────────────────────────────────────────────
export function generateRapportMouvements({ mouvements, dateDebut, dateFin, titre = 'Rapport de Mouvements' }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  let y = header(doc, titre, `Période : ${dateDebut || '—'} → ${dateFin || '—'}`);

  const totalEntrees = mouvements.filter(m => m.type === 'Entrée').reduce((s, m) => s + m.qte, 0);
  const totalSorties = mouvements.filter(m => m.type === 'Sortie').reduce((s, m) => s + m.qte, 0);
  const caTotal = mouvements.filter(m => m.type === 'Sortie').reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0);

  y = infoBox(doc, y, [
    ['Total entrées',   `${totalEntrees} unités`],
    ['Total sorties',   `${totalSorties} unités`],
    ["Chiffre d'affaires", `${caTotal.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
    ['Nombre de mouvements', mouvements.length],
  ]);

  doc.autoTable({
    startY: y,
    head: [['Date', 'Produit', 'Type', 'Qté', 'Prix unit.', 'Montant', 'Client/Fourn.', 'Motif', 'Opérateur']],
    body: mouvements.map(m => [
      m.date,
      m.produit_nom,
      m.type,
      m.qte,
      m.prix_unitaire ? `${m.prix_unitaire.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F` : '—',
      m.prix_unitaire ? `${(m.qte * m.prix_unitaire).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F` : '—',
      m.client_fourn || '—',
      m.motif || '—',
      m.operateur || '—',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = data.cell.text[0] === 'Entrée' ? BRAND.accent : BRAND.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  footer(doc);
  doc.save(`mouvements-${dateDebut}-${dateFin}.pdf`);
}

// ── 3. FACTURE CLIENT ─────────────────────────────────────────────────────────
export function generateFacture({ client, lignes, operateur, notes = '', remise = 0 }) {
  const doc = new jsPDF();
  const num = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  let y = header(doc, 'FACTURE', `N° ${num}`);

  y = infoBox(doc, y, [
    ['Client',       client?.nom],
    ['Contact',      client?.contact],
    ['Téléphone',    client?.tel],
    ['Email',        client?.email],
    ['Date facture', new Date().toLocaleDateString('fr-FR')],
    ['Opérateur',    operateur],
  ]);

  const sousTotal = lignes.reduce((s, l) => s + l.qte * l.prix_unitaire, 0);
  const remiseAmt = sousTotal * (remise / 100);
  const totalTTC  = sousTotal - remiseAmt;

  doc.autoTable({
    startY: y,
    head: [['Référence', 'Désignation', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: lignes.map(l => [
      l.ref || '—',
      l.nom,
      l.qte,
      `${l.prix_unitaire.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`,
      `${(l.qte * l.prix_unitaire).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`,
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 4: { halign: 'right' } },
  });

  let finalY = doc.lastAutoTable.finalY + 8;

  // Totaux
  const totaux = [
    ['Sous-total HT', `${sousTotal.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
    ...(remise > 0 ? [[`Remise (${remise}%)`, `- ${remiseAmt.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`]] : []),
    ['TOTAL À PAYER', `${totalTTC.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
  ];

  totaux.forEach(([label, val], i) => {
    const isLast = i === totaux.length - 1;
    if (isLast) {
      doc.setFillColor(...BRAND.accent);
      doc.roundedRect(120, finalY - 2, 76, 10, 2, 2, 'F');
      doc.setTextColor(...BRAND.white);
    } else {
      doc.setTextColor(...BRAND.primary);
    }
    doc.setFont('helvetica', isLast ? 'bold' : 'normal');
    doc.setFontSize(isLast ? 10 : 8.5);
    doc.text(label, 125, finalY + 5);
    doc.text(val, 193, finalY + 5, { align: 'right' });
    finalY += 12;
  });

  if (notes) {
    finalY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    doc.text('Conditions / Notes :', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.primary);
    doc.text(notes, 14, finalY + 7, { maxWidth: 100 });
  }

  footer(doc);
  doc.save(`facture-${num}.pdf`);
  return num;
}

// ── 4. INVENTAIRE COMPLET ──────────────────────────────────────────────────
export function generateInventaire({ produits, fournisseurs }) {
  const doc = new jsPDF({ orientation: 'landscape' });
  let y = header(doc, 'INVENTAIRE DU STOCK', `Au ${new Date().toLocaleDateString('fr-FR')}`);

  const valeurTotal = produits.reduce((s, p) => s + p.stock * p.prix_achat, 0);
  const ruptures    = produits.filter(p => p.stock === 0).length;
  const alertes     = produits.filter(p => p.stock > 0 && p.stock <= p.seuil).length;

  y = infoBox(doc, y, [
    ['Total références', produits.length],
    ['Ruptures de stock', `${ruptures} produit(s)`],
    ['Stock faible', `${alertes} produit(s)`],
    ['Valeur totale du stock', `${valeurTotal.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
  ]);

  doc.autoTable({
    startY: y,
    head: [['Référence', 'Désignation', 'Catégorie', 'Stock', 'Seuil', 'Prix achat', 'Valeur stock', 'Prix vente', 'Fournisseur', 'Statut']],
    body: produits.map(p => {
      const fourn = fournisseurs.find(f => f.id === p.fourn_id);
      const status = p.stock === 0 ? 'Rupture' : p.stock <= p.seuil ? 'Faible' : 'OK';
      return [
        p.ref, p.nom, p.cat, p.stock, p.seuil,
        `${(p.prix_achat || 0).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F`,
        `${(p.stock * p.prix_achat).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F`,
        `${(p.prix_vente || 0).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F`,
        fourn?.nom || '—', status,
      ];
    }),
    foot: [['', '', '', '', '', 'TOTAL VALEUR :', `${valeurTotal.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} F`, '', '', '']],
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    footStyles: { fillColor: BRAND.accent, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = data.cell.text[0];
        if (val === 'Rupture') data.cell.styles.textColor = BRAND.danger;
        else if (val === 'Faible') data.cell.styles.textColor = [200, 120, 40];
        else data.cell.styles.textColor = BRAND.accent;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  footer(doc);
  doc.save(`inventaire-ssc-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── 5. RAPPORT FLASH (SYNTHÈSE) ────────────────────────────────────────────────
export function generateRapportFlash({ storeVal }) {
  const { produits, ruptures, alertes, expirationProche, valeurStock, valeurVente, caParMois } = storeVal;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('fr-FR');
  let y = header(doc, 'RAPPORT FLASH (SYNTHÈSE)', `Au ${dateStr}`);

  y = infoBox(doc, y, [
    ['Total Références', produits.length],
    ['Valeur en Stock (Achat)', `${valeurStock.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
    ['Valeur Estimée (Vente)', `${valeurVente.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
    ['Marge brute potentielle', `${(valeurVente - valeurStock).toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
  ]);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.primary);
  doc.text('Alerte & Criticité du Stock', 14, y + 10);
  y += 15;

  doc.autoTable({
    startY: y,
    head: [['Type d\'Alerte', 'Quantité', 'Niveau de gravité']],
    body: [
      ['Ruptures Totales (Stock = 0)', ruptures.length, ruptures.length > 0 ? 'CRITIQUE' : 'OK'],
      ['Stocks Faibles (<= Seuil)', alertes.length, alertes.length > 0 ? 'ATTENTION' : 'OK'],
      ['Expirations Proches (< 90j)', expirationProche.length, expirationProche.length > 0 ? 'À SURVEILLER' : 'OK'],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const lastMois = caParMois && caParMois.length > 0 ? caParMois[caParMois.length - 1] : null;
  if (lastMois) {
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.primary);
    doc.text('Performances du Mois en Cours', 14, finalY);
    
    infoBox(doc, finalY + 5, [
      ['Mois en cours', lastMois.label],
      ['Chiffre d\'Affaires Réalisé', `${lastMois.ca.toLocaleString('fr-FR').replace(/[\s\u202F\u00A0]/g, ' ')} FCFA`],
    ]);
  }

  footer(doc);
  doc.save(`Rapport-Flash-SSC.pdf`);
}

// ── 6. RAPPORT D'ALERTES STOCK ──────────────────────────────────────────────
export function generateAlertesPDF({ alertes, ruptures = [], stockFaible = [], expirationProche = [] }) {
  const doc = new jsPDF();
  let y = header(doc, 'RAPPORT D\'ALERTES STOCK', `Au ${new Date().toLocaleDateString('fr-FR')}`);

  y = infoBox(doc, y, [
    ['Ruptures totales (stock = 0)', `${ruptures.length} produit(s)`],
    ['Stock faible (≤ seuil)', `${stockFaible.length} produit(s)`],
    ['Expirations proches (<90j)', `${expirationProche.length} produit(s)`],
    ['Total alertes', alertes.length],
  ]);

  if (!alertes.length) {
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('✅ Aucune alerte — tous les stocks sont OK !', 14, y + 10);
  } else {
    doc.autoTable({
      startY: y,
      head: [['Référence', 'Désignation', 'Catégorie', 'Stock', 'Seuil', 'Statut']],
      body: alertes.map(p => [
        p.ref, p.nom, p.cat || '—',
        `${p.stock} ${p.unite || 'unité(s)'}`,
        `${p.seuil}`,
        p.stock === 0 ? 'RUPTURE' : 'FAIBLE',
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: BRAND.danger, textColor: BRAND.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          data.cell.styles.textColor = data.cell.text[0] === 'RUPTURE' ? BRAND.danger : [200, 120, 40];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  footer(doc);
  doc.save(`alertes-stock-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── 7. LISTE DES FOURNISSEURS ──────────────────────────────────────────────
export function generateFournisseursPDF({ fournisseurs, produits }) {
  const doc = new jsPDF();
  let y = header(doc, 'LISTE DES FOURNISSEURS', `Au ${new Date().toLocaleDateString('fr-FR')}`);

  y = infoBox(doc, y, [
    ['Total fournisseurs', fournisseurs.length],
    ['Produits référencés', produits.length],
  ]);

  doc.autoTable({
    startY: y,
    head: [['Nom / Société', 'Contact', 'Téléphone', 'Email', 'Localisation', 'Spécialités', 'Nb produits']],
    body: fournisseurs.map(f => {
      const nbProd = produits.filter(p => p.fourn_id === f.id).length;
      return [
        f.nom, f.contact || '—', f.tel || '—', f.email || '—',
        [f.ville, f.pays].filter(Boolean).join(', ') || '—',
        f.spec || '—', nbProd,
      ];
    }),
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    headStyles: { fillColor: BRAND.primary, textColor: BRAND.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  footer(doc);
  doc.save(`fournisseurs-ssc-${new Date().toISOString().slice(0, 10)}.pdf`);
}

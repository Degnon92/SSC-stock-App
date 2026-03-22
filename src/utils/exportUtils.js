import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Générer un export Excel premium pour l'inventaire
 */
export async function generatePremiumExcel({ data, columns, title = 'RAPPORT D\'INVENTAIRE DES PRODUITS', companyName = 'SSC Flow', filename = 'Inventaire_Premium' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companyName;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Inventaire', {
    views: [{ state: 'frozen', ySplit: 4 }] // 3 lignes d'en-tête de page + 1 ligne d'en-tête de colonnes
  });

  // 1. En-tête principal (fusionné, fond gris clair)
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  worksheet.mergeCells('A2:G2');
  const companyCell = worksheet.getCell('A2');
  companyCell.value = companyName;
  companyCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF334155' } };
  companyCell.alignment = { vertical: 'middle', horizontal: 'center' };
  companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  worksheet.mergeCells('A3:G3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
  dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
  dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

  worksheet.addRow([]); // Ligne vide

  // 2. Ligne d'en-tête du tableau de données (fond bleu foncé, texte blanc)
  const headerRow = worksheet.addRow(columns.map(c => c.header));
  
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Bleu nuit
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  worksheet.columns = columns.map(col => ({ key: col.key, width: col.width || 20 }));

  // 3. Tableau de données
  data.forEach((item) => {
    const rowData = {};
    columns.forEach(c => rowData[c.key] = item[c.key] !== undefined ? item[c.key] : (c.render ? c.render(item) : ''));
    const row = worksheet.addRow(rowData);

    row.eachCell((cell, colNumber) => {
      // Bordures fines pour chaque cellule
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
      
      const colDef = columns[colNumber - 1];
      
      cell.alignment = { vertical: 'middle', horizontal: colDef.align || 'left' };

      // Format monétaire pour FCFA si défini
      if (colDef.isCurrency) {
        cell.numFmt = '#,##0 "FCFA"';
      }

      // Format conditionnel simulé (Rupture ou Alerte)
      if (item.qte !== undefined && item.seuil !== undefined) {
        if (item.qte === 0) {
          // Rupture en rouge
          cell.font = { color: { argb: 'FFE63946' }, bold: true };
        } else if (item.qte <= item.seuil && colDef.key === 'qte') {
          // Alerte qte en orange
          cell.font = { color: { argb: 'FFF59E0B' }, bold: true };
        }
      }
    });
  });

  // 4. Ajustement automatique précis des largeurs de colonnes (Chasse pondérée + Clamping)
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      // Ignorer l'en-tête de la page fusionné
      if (cell.row > 4 && cell.value) {
        let textLength = cell.value.toString().length;
        // Si c'est du texte long avec espaces, accorder une pénalité légère de chasse
        if (cell.value.toString().match(/[WwMmA@]/g)) {
            textLength += (cell.value.toString().match(/[WwMmA@]/g).length * 0.2); // Ces lettres sont plus larges
        }
        if (textLength > maxLength) {
          maxLength = textLength;
        }
      }
    });

    // Formule: (MaxLongueur * 1.2 compensateur) + 2 padding
    const calculatedWidth = (maxLength * 1.2) + 2;
    // Clamping obligatoire: entre 10 (minimum absolu) et 50 (maximum toléré)
    column.width = Math.min(Math.max(calculatedWidth, 10), 50);

    // Si on atteint la limite de 50, on active le retour à la ligne automatique (wrapText)
    if (column.width === 50) {
        column.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.row > 4) {
               cell.alignment = { ...cell.alignment, wrapText: true };
            }
        });
    }
  });

  // Téléchargement
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Générer un export PDF premium (avec images de graphiques et beaux tableaux zébrés)
 */
export async function generatePremiumPDF({ title = 'Rapport Complet', data = [], columns = [], companyName = 'SSC Flow', chartElementId = null, filename = 'Rapport_Premium' }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Fonction pour l'en-tête et pied de page
  const addHeaderFooter = (currentPage, totalPages) => {
    // Header
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 20, pageWidth - 14, 20); // Trait de séparation
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(companyName, 14, 15);
    doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 14, 15, { align: 'right' });
    
    // Footer
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20); // Trait de séparation
    doc.setFontSize(8);
    doc.text('Document Confidentiel', 14, pageHeight - 12);
    doc.text(`Page ${currentPage} / ${totalPages}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
  };

  // --- 1. Page de Couverture ---
  doc.setFillColor(15, 23, 42); // Bleu nuit pour la bande du haut
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageWidth / 2, 25, { align: 'center' });

  // Titre principal centré
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.text(title, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, pageHeight / 2, { align: 'center' });

  // --- 2. Insertion graphique Haute Résolution (html2canvas) ---
  let startY = 30; 
  
  if (chartElementId) {
    const chartEl = document.getElementById(chartElementId);
    if (chartEl) {
      try {
        doc.addPage();
        
        // 1. Cloner le nœud pour ne pas affecter l'UI de l'utilisateur
        const clone = chartEl.cloneNode(true);
        
        // 2. L'injecter dans un conteneur invisible avec des dimensions HD forcées
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.top = '-9999px';
        printContainer.style.left = '-9999px';
        printContainer.style.width = '1200px'; 
        printContainer.style.height = '800px';
        printContainer.style.background = '#ffffff'; // S'assurer que le fond n'est pas transparent
        
        printContainer.appendChild(clone);
        document.body.appendChild(printContainer);
        
        // Laisser le navigateur appliquer les styles React/Recharts au clone
        await new Promise(resolve => setTimeout(resolve, 50)); 
        
        // 3. Capturer à haute résolution (scale: 3 = 3600x2400)
        const canvas = await html2canvas(printContainer, { 
            scale: 3, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // 4. Nettoyer le DOM
        document.body.removeChild(printContainer);
        
        const imgData = canvas.toDataURL('image/png', 1.0); // Qualité max
        
        // Calculer les dimensions pour tenir parfaitement dans la largeur de la page A4
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Aperçu Graphique', 14, 30);
        
        // Insérer l'image HD
        doc.addImage(imgData, 'PNG', 14, 35, imgWidth, imgHeight, undefined, 'FAST');
        startY = 35 + imgHeight + 20;
      } catch (err) {
        console.error('Erreur lors de la capture du graphique Haute Résolution', err);
      }
    }
  } else {
    // Page 2 pour les données s'il n'y a pas de graphique
    doc.addPage(); 
  }

  // --- 3. Tableau de données (jspdf-autotable) ---
  if (startY > pageHeight - 40 && data.length > 0) {
    doc.addPage();
    startY = 30;
  }

  if (data.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Données Détaillées', 14, startY - 5);

    autoTable(doc, {
      startY: startY,
      head: [columns.map(c => c.header)],
      body: data.map(item => columns.map(c => item[c.key] !== undefined ? item[c.key] : (c.render ? c.render(item) : ''))),
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      columnStyles: columns.reduce((acc, col, idx) => {
        if (col.align) {
          acc[idx] = { halign: col.align };
        }
        return acc;
      }, {})
    });
  }

  // Application du Header & Footer sur les pages utiles
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1 || totalPages === 1) { // On évite la couverture, sauf si c'est la seule page (rare)
      addHeaderFooter(i, totalPages);
    }
  }

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Générer un export complet du système (Multi-onglets)
 */
export async function exportCompletExcel({ produits = [], fournisseurs = [], mouvements = [], auditLogs = [], companyName = 'SSC Flow', filename = 'Archive_Systeme_Complete' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companyName;
  workbook.created = new Date();

  // Helper pour styliser une feuille
  const styleSheet = (ws, columns, data) => {
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    const headerRow = ws.addRow(columns.map(c => c.header));
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.columns = columns.map(col => ({ key: col.key, width: col.width || 15 }));
    data.forEach(item => {
      const rowData = {};
      columns.forEach(c => rowData[c.key] = item[c.key] !== undefined ? item[c.key] : (c.render ? c.render(item) : ''));
      ws.addRow(rowData);
    });
    ws.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        if (cell.row > 1 && cell.value) {
          let textLength = cell.value.toString().length;
          if (cell.value.toString().match(/[WwMmA@]/g)) textLength += (cell.value.toString().match(/[WwMmA@]/g).length * 0.2);
          if (textLength > maxLength) maxLength = textLength;
        }
      });
      column.width = Math.min(Math.max((maxLength * 1.2) + 2, 10), 50);
    });
  };

  // Onglet 1: Inventaire
  const wsInv = workbook.addWorksheet('Inventaire');
  const dInv = produits.map(p => {
    const f = fournisseurs.find(x => x.id === p.fourn_id);
    return { ...p, fourn_nom: f ? f.nom : '—' };
  });
  const cInv = [
    { key: 'ref', header: 'RÉF' }, { key: 'nom', header: 'DÉSIGNATION' }, { key: 'cat', header: 'CATÉGORIE' },
    { key: 'stock', header: 'STOCK' }, { key: 'seuil', header: 'SEUIL' }, { key: 'prix_achat', header: 'PRIX ACHAT' },
    { key: 'prix_vente', header: 'PRIX VENTE' }, { key: 'fourn_nom', header: 'FOURNISSEUR' }
  ];
  styleSheet(wsInv, cInv, dInv);

  // Onglet 2: Mouvements
  const wsMvt = workbook.addWorksheet('Mouvements');
  const dMvt = mouvements.map(m => ({ ...m, montant: m.qte * (m.prix_unitaire || 0) }));
  const cMvt = [
    { key: 'date', header: 'DATE' }, { key: 'produit_nom', header: 'PRODUIT' }, { key: 'type', header: 'TYPE' },
    { key: 'qte', header: 'QUANTITÉ' }, { key: 'prix_unitaire', header: 'P.UNIT' }, { key: 'montant', header: 'MONTANT' },
    { key: 'client_fourn', header: 'TIERS' }, { key: 'motif', header: 'MOTIF' }, { key: 'operateur', header: 'OPERATEUR' }
  ];
  styleSheet(wsMvt, cMvt, dMvt);

  // Onglet 3: Fournisseurs
  const wsFourn = workbook.addWorksheet('Fournisseurs');
  const cFourn = [
    { key: 'nom', header: 'SOCIÉTÉ' }, { key: 'contact', header: 'CONTACT' }, { key: 'tel', header: 'TÉLÉPHONE' },
    { key: 'email', header: 'EMAIL' }, { key: 'ville', header: 'VILLE' }, { key: 'pays', header: 'PAYS' }
  ];
  styleSheet(wsFourn, cFourn, fournisseurs);

  // Onglet 4: Audit
  const wsAudit = workbook.addWorksheet('Journal d\'Audit');
  const cAudit = [
    { key: 'timestamp', header: 'DATE - HEURE', render: a => new Date(a.timestamp).toLocaleString('fr-FR') }, 
    { key: 'userEmail', header: 'UTILISATEUR' }, { key: 'action', header: 'ACTION' },
    { key: 'module', header: 'MODULE' }, { key: 'details', header: 'DÉTAILS' }
  ];
  styleSheet(wsAudit, cAudit, auditLogs);

  // Téléchargement
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

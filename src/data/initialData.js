// ============================================================
// SSC — Surgical Services Consulting
// Données initiales de démonstration
// ============================================================

export const CATEGORIES = [
  "Prothèses",
  "Implants",
  "Instruments chirurgicaux",
  "Consommables",
  "Matériel de stérilisation",
  "Équipement de bloc",
  "Autre",
];

export const INITIAL_FOURNISSEURS = [
  { id: 1, nom: "Stryker France", contact: "Pierre Dumont", tel: "+33 1 42 00 00 00", email: "contact@stryker.fr", pays: "France", ville: "Paris", spec: "Prothèses articulaires, implants", actif: true },
  { id: 2, nom: "Zimmer Biomet", contact: "Aïssatou Diallo", tel: "+221 77 000 00 00", email: "adiallo@zimmerbiomet.com", pays: "Sénégal", ville: "Dakar", spec: "Prothèses de genou, hanche", actif: true },
  { id: 3, nom: "Medtronic SARL", contact: "Ahmed Cissé", tel: "+225 07 00 00 00", email: "acisse@medtronic.com", pays: "Côte d'Ivoire", ville: "Abidjan", spec: "Matériel neurologique, cardiovasculaire", actif: true },
  { id: 4, nom: "Johnson & Johnson Med", contact: "Marie Dubois", tel: "+33 4 56 00 00 00", email: "mdubois@jnjmed.fr", pays: "France", ville: "Lyon", spec: "Sutures, consommables chirurgicaux", actif: true },
];

export const INITIAL_CLIENTS = [
  { id: 1, nom: "CHU de Dakar", contact: "Dr. Oumar Fall", tel: "+221 33 822 00 00", email: "dr.fall@chu-dakar.sn", type: "Hôpital public", pays: "Sénégal", ville: "Dakar", actif: true },
  { id: 2, nom: "Clinique du Plateau", contact: "Dr. Aminata Sow", tel: "+221 77 111 11 11", email: "asow@clinplateau.sn", type: "Clinique privée", pays: "Sénégal", ville: "Dakar", actif: true },
  { id: 3, nom: "Hôpital Principal", contact: "Pr. Ibrahima Diop", tel: "+221 33 839 50 00", email: "idiop@hopitalprincipaldakar.sn", type: "Hôpital militaire", pays: "Sénégal", ville: "Dakar", actif: true },
  { id: 4, nom: "Polyclinique de l'Alliance", contact: "Dr. Fatou Ndiaye", tel: "+221 77 222 22 22", email: "fndiaye@polyclialliance.sn", type: "Clinique privée", pays: "Sénégal", ville: "Thiès", actif: true },
];

export const INITIAL_PRODUITS = [
  { id: 1, ref: "PRO-001", nom: "Prothèse totale de hanche cimentée", cat: "Prothèses", stock: 12, seuil: 5, prix_achat: 280000, prix_vente: 450000, fourn_id: 1, desc: "Taille M, acier inoxydable, certifiée CE", localisation: "Rayon A1", date_expiration: null },
  { id: 2, ref: "PRO-002", nom: "Prothèse de genou TKA — taille standard", cat: "Prothèses", stock: 8, seuil: 5, prix_achat: 320000, prix_vente: 520000, fourn_id: 2, desc: "Alliage titane-cobalt", localisation: "Rayon A2", date_expiration: null },
  { id: 3, ref: "PRO-003", nom: "Prothèse d'épaule anatomique", cat: "Prothèses", stock: 3, seuil: 4, prix_achat: 380000, prix_vente: 610000, fourn_id: 1, desc: "Système modulaire", localisation: "Rayon A3", date_expiration: null },
  { id: 4, ref: "IMP-001", nom: "Implant dentaire titane Ø3.5mm", cat: "Implants", stock: 3, seuil: 10, prix_achat: 45000, prix_vente: 85000, fourn_id: 1, desc: "Boîte de 5 unités, surface SLA", localisation: "Rayon B1", date_expiration: "2027-06-30" },
  { id: 5, ref: "IMP-002", nom: "Vis pédiculaire 5.5×45mm", cat: "Implants", stock: 0, seuil: 8, prix_achat: 18000, prix_vente: 32000, fourn_id: 3, desc: "Rachis lombaire, acier chirurgical", localisation: "Rayon B2", date_expiration: null },
  { id: 6, ref: "IMP-003", nom: "Cage intersomatique TLIF", cat: "Implants", stock: 6, seuil: 4, prix_achat: 95000, prix_vente: 165000, fourn_id: 3, desc: "PEEK, différentes hauteurs", localisation: "Rayon B3", date_expiration: null },
  { id: 7, ref: "INS-001", nom: "Ostéotome 10mm", cat: "Instruments chirurgicaux", stock: 22, seuil: 5, prix_achat: 9000, prix_vente: 18000, fourn_id: 1, desc: "Manche ergonomique inox", localisation: "Rayon C1", date_expiration: null },
  { id: 8, ref: "INS-002", nom: "Scie oscillante motorisée", cat: "Instruments chirurgicaux", stock: 2, seuil: 2, prix_achat: 185000, prix_vente: 310000, fourn_id: 4, desc: "Sans fil, batterie Li-ion", localisation: "Rayon C2", date_expiration: null },
  { id: 9, ref: "CON-001", nom: "Ciment osseux Simplex P 40g", cat: "Consommables", stock: 4, seuil: 8, prix_achat: 12000, prix_vente: 24000, fourn_id: 1, desc: "Stérilisé, usage unique", localisation: "Rayon D1", date_expiration: "2026-12-31" },
  { id: 10, ref: "CON-002", nom: "Sutures résorbables Vicryl 0", cat: "Consommables", stock: 45, seuil: 20, prix_achat: 3500, prix_vente: 7000, fourn_id: 4, desc: "Boîte de 36, aiguille ronde", localisation: "Rayon D2", date_expiration: "2026-08-15" },
  { id: 11, ref: "STE-001", nom: "Indicateur chimique classe 6", cat: "Matériel de stérilisation", stock: 200, seuil: 50, prix_achat: 800, prix_vente: 1500, fourn_id: 4, desc: "Autoclave 134°C", localisation: "Rayon E1", date_expiration: "2028-01-01" },
  { id: 12, ref: "EQP-001", nom: "Bistouri électrique monopolaire", cat: "Équipement de bloc", stock: 1, seuil: 2, prix_achat: 420000, prix_vente: 680000, fourn_id: 3, desc: "250W, pédales incluses", localisation: "Rayon F1", date_expiration: null },
];

export const INITIAL_MOUVEMENTS = [
  { id: 1, date: "2025-05-01", produit_id: 1, produit_nom: "Prothèse totale de hanche cimentée", type: "Entrée", qte: 5, motif: "Commande initiale Stryker", operateur: "Admin SSC", client_fourn: "Stryker France", prix_unitaire: 280000 },
  { id: 2, date: "2025-05-03", produit_id: 10, produit_nom: "Sutures résorbables Vicryl 0", type: "Entrée", qte: 50, motif: "Réapprovisionnement", operateur: "Admin SSC", client_fourn: "J&J Med", prix_unitaire: 3500 },
  { id: 3, date: "2025-05-07", produit_id: 2, produit_nom: "Prothèse de genou TKA", type: "Sortie", qte: 2, motif: "Vente client", operateur: "Admin SSC", client_fourn: "CHU de Dakar", prix_unitaire: 520000 },
  { id: 4, date: "2025-05-10", produit_id: 4, produit_nom: "Implant dentaire titane Ø3.5mm", type: "Sortie", qte: 7, motif: "Vente client", operateur: "Admin SSC", client_fourn: "Clinique du Plateau", prix_unitaire: 85000 },
  { id: 5, date: "2025-05-12", produit_id: 9, produit_nom: "Ciment osseux Simplex P", type: "Sortie", qte: 4, motif: "Vente client", operateur: "Admin SSC", client_fourn: "Hôpital Principal", prix_unitaire: 24000 },
  { id: 6, date: "2025-05-14", produit_id: 7, produit_nom: "Ostéotome 10mm", type: "Entrée", qte: 10, motif: "Réapprovisionnement", operateur: "Admin SSC", client_fourn: "Stryker France", prix_unitaire: 9000 },
  { id: 7, date: "2025-05-15", produit_id: 1, produit_nom: "Prothèse totale de hanche cimentée", type: "Sortie", qte: 1, motif: "Vente client", operateur: "Admin SSC", client_fourn: "Polyclinique de l'Alliance", prix_unitaire: 450000 },
];

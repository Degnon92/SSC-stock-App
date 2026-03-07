import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  deleteDoc, writeBatch, getDocs, query, orderBy, limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  INITIAL_PRODUITS, INITIAL_MOUVEMENTS,
  INITIAL_FOURNISSEURS, INITIAL_CLIENTS
} from '../data/initialData';

const COLS = {
  produits:       'produits',
  mouvements:     'mouvements',
  fournisseurs:   'fournisseurs',
  commandes:      'commandes_fournisseurs',
  clients:        'clients',
  settings:       'settings',
  lots:           'lots',
  historiquePrix: 'historiquePrix',
  factures:       'factures',
  audit:          'audit_logs',
};

async function seedIfEmpty(colName, initialData) {
  const snap = await getDocs(collection(db, colName));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  initialData.forEach(item => batch.set(doc(collection(db, colName), String(item.id)), item));
  await batch.commit();
}

function snapToArray(snapshot) {
  return snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export default function useStore() {
  const [produits,       setProduits]       = useState([]);
  const [mouvements,     setMouvements]     = useState([]);
  const [fournisseurs,   setFournisseurs]   = useState([]);
  const [commandes,      setCommandes]      = useState([]);
  const [clients,        setClients]        = useState([]);
  const [lots,           setLots]           = useState([]);
  const [historiquePrix, setHistoriquePrix] = useState([]);
  const [factures,       setFactures]       = useState([]);
  const [auditLogs,      setAuditLogs]      = useState([]);
  const [settings,       setSettingsState]  = useState({
    devise: 'FCFA', entreprise: 'Surgical Services Consulting',
    operateur: 'Admin SSC', seuil_defaut: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let unsubs = [];
    async function init() {
      try {
        await Promise.all([
          seedIfEmpty(COLS.produits,     INITIAL_PRODUITS),
          seedIfEmpty(COLS.mouvements,   INITIAL_MOUVEMENTS),
          seedIfEmpty(COLS.fournisseurs, INITIAL_FOURNISSEURS),
          seedIfEmpty(COLS.clients,      INITIAL_CLIENTS),
        ]);

        const listen = (col, setter, q) => onSnapshot(
          q || collection(db, col),
          snap => setter(snapToArray(snap)),
          err  => setError(err.message)
        );

        unsubs.push(listen(COLS.produits,       setProduits));
        unsubs.push(listen(COLS.mouvements,     setMouvements,     query(collection(db, COLS.mouvements),     orderBy('date', 'asc'))));
        unsubs.push(listen(COLS.fournisseurs,   setFournisseurs));
        unsubs.push(listen(COLS.commandes,      setCommandes,      query(collection(db, COLS.commandes),      orderBy('date', 'desc'))));
        unsubs.push(listen(COLS.clients,        setClients));
        unsubs.push(listen(COLS.lots,           setLots));
        unsubs.push(listen(COLS.historiquePrix, setHistoriquePrix, query(collection(db, COLS.historiquePrix), orderBy('date', 'desc'))));
        unsubs.push(listen(COLS.factures,       setFactures));
        unsubs.push(listen(COLS.audit,          setAuditLogs,      query(collection(db, COLS.audit), orderBy('date', 'desc'), limit(150))));
        unsubs.push(onSnapshot(doc(db, COLS.settings, 'global'),
          snap => { if (snap.exists()) setSettingsState(snap.data()); },
          err  => setError(err.message)
        ));
        setLoading(false);
      } catch (err) {
        setError('Connexion Firebase échouée. Vérifiez src/firebase.js.');
        setLoading(false);
      }
    }
    init();
    return () => unsubs.forEach(u => u());
  }, []);

  // ── AUDIT LOGGER ────────────────────────────────────────────────────────────
  const logAction = async (action, moduleName, desc) => {
    try {
      const user = auth.currentUser?.email || 'Système';
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      await setDoc(doc(db, COLS.audit, id), {
        id,
        date: new Date().toISOString(),
        user,
        action,
        module: moduleName,
        desc
      });
    } catch (e) {
      console.error('Erreur audit', e);
    }
  };

  // ── SETTINGS ─────────────────────────────────────────────────────────────────
  const setSettings = useCallback(async (d) => {
    const merged = { ...settings, ...d };
    setSettingsState(merged);
    await setDoc(doc(db, COLS.settings, 'global'), merged);
    logAction('MODIFICATION', 'PARAMÈTRES', 'Mise à jour des paramètres globaux');
  }, [settings]);

  // ── RESTAURATION GLOBALE (BATCH) ──────────────────────────────────────────────
  const fullRestore = useCallback(async (backupData, overwrite = false) => {
    let currentBatch = writeBatch(db);
    let opCount = 0;
    const chunks = [];

    const addOp = (ref, data, isDel = false) => {
      if (isDel) currentBatch.delete(ref);
      else currentBatch.set(ref, data);
      opCount++;
      if (opCount === 490) { // Limit to batch size < 500
        chunks.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    };

    if (overwrite) {
      if (produits.length) produits.forEach(p => addOp(doc(db, COLS.produits, String(p._docId || p.id)), null, true));
      if (mouvements.length) mouvements.forEach(m => addOp(doc(db, COLS.mouvements, String(m._docId || m.id)), null, true));
      if (fournisseurs.length) fournisseurs.forEach(f => addOp(doc(db, COLS.fournisseurs, String(f._docId || f.id)), null, true));
      if (clients.length) clients.forEach(c => addOp(doc(db, COLS.clients, String(c._docId || c.id)), null, true));
      
      if (opCount > 0) {
        chunks.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        opCount = 0;
      }
      await Promise.all(chunks); // attend les suppressions
      chunks.length = 0; // reset
    }

    if (backupData.produits) backupData.produits.forEach(p => { const d = { ...p }; delete d._docId; addOp(doc(db, COLS.produits, String(p.id)), d); });
    if (backupData.mouvements) backupData.mouvements.forEach(m => { const d = { ...m }; delete d._docId; addOp(doc(db, COLS.mouvements, String(m.id)), d); });
    if (backupData.fournisseurs) backupData.fournisseurs.forEach(f => { const d = { ...f }; delete d._docId; addOp(doc(db, COLS.fournisseurs, String(f.id)), d); });
    if (backupData.clients) backupData.clients.forEach(c => { const d = { ...c }; delete d._docId; addOp(doc(db, COLS.clients, String(c.id)), d); });

    if (opCount > 0) chunks.push(currentBatch.commit());
    await Promise.all(chunks);

    if (backupData.settings) await setSettings(backupData.settings);
  }, [produits, mouvements, fournisseurs, clients, setSettings]);

  // ── PRODUITS ─────────────────────────────────────────────────────────────────
  const addProduit = useCallback(async (p) => {
    const id = Date.now(); const np = { ...p, id };
    await setDoc(doc(db, COLS.produits, String(id)), np);
    logAction('CRÉATION', 'PRODUITS', `Produit ajouté: ${p.nom} (Ref: ${p.reference || '-'})`);
    return np;
  }, []);
  const updateProduit = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.produits, String(id)), data);
    logAction('MODIFICATION', 'PRODUITS', `Produit mis à jour: ID ${id}`);
  }, []);
  const deleteProduit = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.produits, String(id)));
    logAction('SUPPRESSION', 'PRODUITS', `Produit supprimé: ID ${id}`);
  }, []);
  const restoreProduit = useCallback(async (p) => {
    await setDoc(doc(db, COLS.produits, String(p.id)), p);
    logAction('RESTAURATION', 'PRODUITS', `Produit restauré: ${p.nom}`);
  }, []);

  // ── MOUVEMENTS ────────────────────────────────────────────────────────────────
  const addMouvement = useCallback(async (m) => {
    const id = Date.now(); const nm = { ...m, id };
    const produit = produits.find(p => p.id === m.produit_id);
    if (!produit) return;
    const delta    = m.type === 'Entrée' ? m.qte : -m.qte;
    const newStock = Math.max(0, (produit.stock || 0) + delta);
    
    // Calcul du PUMP (Prix Unitaire Moyen Pondéré) si c'est une entrée
    let newPump = produit.prix_achat || 0;
    if (m.type === 'Entrée' && m.prix_unitaire > 0) {
      const currentVal = (produit.stock || 0) * (produit.prix_achat || 0);
      const incomingVal = m.qte * m.prix_unitaire;
      if (newStock > 0) {
        newPump = (currentVal + incomingVal) / newStock;
        // Arrondir à l'entier ou 2 décimales selon devise, on met float pour la précision
        newPump = Math.round(newPump); 
      }
    }

    const batch = writeBatch(db);
    batch.set(doc(db, COLS.mouvements, String(id)), nm);
    
    const prodUpdate = { stock: newStock };
    if (m.type === 'Entrée') prodUpdate.prix_achat = newPump;
    batch.update(doc(db, COLS.produits, String(m.produit_id)), prodUpdate);
    await batch.commit(); return nm;
  }, [produits]);
  const restoreMouvement = useCallback(async (m) => {
    await setDoc(doc(db, COLS.mouvements, String(m.id)), m);
  }, []);

  // ── FOURNISSEURS ──────────────────────────────────────────────────────────────
  const addFournisseur = useCallback(async (f) => {
    const id = Date.now(); const nf = { ...f, id, actif: true };
    await setDoc(doc(db, COLS.fournisseurs, String(id)), nf);
    logAction('CRÉATION', 'FOURNISSEURS', `Nouveau fournisseur: ${f.nom}`);
    return nf;
  }, []);
  const updateFournisseur = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.fournisseurs, String(id)), data);
    logAction('MODIFICATION', 'FOURNISSEURS', `Fournisseur mis à jour: ID ${id}`);
  }, []);
  const deleteFournisseur = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.fournisseurs, String(id)));
    logAction('SUPPRESSION', 'FOURNISSEURS', `Fournisseur supprimé: ID ${id}`);
  }, []);
  const restoreFournisseur = useCallback(async (f) => {
    await setDoc(doc(db, COLS.fournisseurs, String(f.id)), f);
  }, []);

  // ── COMMANDES FOURNISSEURS ───────────────────────────────────────────────────
  const addCommande = useCallback(async (c) => {
    const id = Date.now(); const nc = { ...c, id, statut: 'Brouillon', date: new Date().toISOString() };
    await setDoc(doc(db, COLS.commandes, String(id)), nc);
    logAction('CRÉATION', 'COMMANDES', `Nouvelle commande fournisseur n°${c.numero || id}`);
    return nc;
  }, []);
  const updateCommande = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.commandes, String(id)), data);
    logAction('MODIFICATION', 'COMMANDES', `Commande mise à jour: ID ${id}`);
  }, []);
  const deleteCommande = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.commandes, String(id)));
    logAction('SUPPRESSION', 'COMMANDES', `Commande supprimée: ID ${id}`);
  }, []);

  // ── CLIENTS ───────────────────────────────────────────────────────────────────
  const addClient = useCallback(async (c) => {
    const id = Date.now(); const nc = { ...c, id, actif: true };
    await setDoc(doc(db, COLS.clients, String(id)), nc);
    logAction('CRÉATION', 'CLIENTS', `Nouveau client: ${c.nom}`);
    return nc;
  }, []);
  const updateClient = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.clients, String(id)), data);
    logAction('MODIFICATION', 'CLIENTS', `Client mis à jour: ID ${id}`);
  }, []);
  const deleteClient = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.clients, String(id)));
    logAction('SUPPRESSION', 'CLIENTS', `Client supprimé: ID ${id}`);
  }, []);
  const restoreClient = useCallback(async (c) => {
    await setDoc(doc(db, COLS.clients, String(c.id)), c);
  }, []);

  // ── LOTS ──────────────────────────────────────────────────────────────────────
  const addLot = useCallback(async (l) => {
    const id = Date.now(); const nl = { ...l, id };
    await setDoc(doc(db, COLS.lots, String(id)), nl);
    logAction('CRÉATION', 'LOTS', `Nouveau lot: ${l.numero} (Produit ID ${l.produit_id})`);
    return nl;
  }, []);
  const updateLot = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.lots, String(id)), data);
    logAction('MODIFICATION', 'LOTS', `Lot mis à jour: ID ${id}`);
  }, []);
  const deleteLot = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.lots, String(id)));
    logAction('SUPPRESSION', 'LOTS', `Lot supprimé: ID ${id}`);
  }, []);

  // ── HISTORIQUE PRIX ───────────────────────────────────────────────────────────
  const addHistoriquePrix = useCallback(async (h) => {
    const id = Date.now(); const nh = { ...h, id };
    await setDoc(doc(db, COLS.historiquePrix, String(id)), nh); return nh;
  }, []);

  // ── FACTURES ──────────────────────────────────────────────────────────────────
  const addFacture = useCallback(async (f) => {
    const id = Date.now(); const nf = { ...f, id };
    await setDoc(doc(db, COLS.factures, String(id)), nf);
    logAction('CRÉATION', 'FACTURES', `Nouvelle facture générée: ${f.numero} (${f.type})`);
    return nf;
  }, []);
  const updateFacture = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLS.factures, String(id)), data);
    logAction('MODIFICATION', 'FACTURES', `Facture mise à jour: ID ${id}`);
  }, []);
  const deleteFacture = useCallback(async (id) => {
    await deleteDoc(doc(db, COLS.factures, String(id)));
    logAction('SUPPRESSION', 'FACTURES', `Facture supprimée: ID ${id}`);
  }, []);

  // ── COMPUTED ──────────────────────────────────────────────────────────────────
  const alertes     = produits.filter(p => p.stock <= p.seuil);
  const ruptures    = produits.filter(p => p.stock === 0);
  const stockFaible = produits.filter(p => p.stock > 0 && p.stock <= p.seuil);
  const valeurStock = produits.reduce((s, p) => s + (p.stock || 0) * (p.prix_achat || 0), 0);
  const valeurVente = produits.reduce((s, p) => s + (p.stock || 0) * (p.prix_vente || 0), 0);
  const today = new Date();
  const expirationProche = produits.filter(p => {
    if (!p.date_expiration) return false;
    const diff = (new Date(p.date_expiration) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  });

  const aujourdHui = new Date();
  const trenteJoursAvant = new Date();
  trenteJoursAvant.setDate(trenteJoursAvant.getDate() - 30);

  const predictionsRupture = produits.map(p => {
    const sorties30j = mouvements.filter(m => 
      m.produit_id === p.id && 
      m.type === 'Sortie' && 
      new Date(m.date) >= trenteJoursAvant
    );
    const totalSorti = sorties30j.reduce((sum, m) => sum + m.qte, 0);
    const vsj = totalSorti / 30; // Vitesse de sortie moyenne par jour
    const joursRestants = vsj > 0 ? Math.round((p.stock || 0) / vsj) : Infinity;
    return { ...p, vsj, joursRestants };
  }).filter(p => p.vsj > 0 && p.joursRestants <= 15).sort((a,b) => a.joursRestants - b.joursRestants);

  const statsParMois = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        label,
        entrees: mouvements.filter(m => m.type === 'Entrée' && m.date?.startsWith(key)).reduce((s, m) => s + m.qte, 0),
        sorties: mouvements.filter(m => m.type === 'Sortie' && m.date?.startsWith(key)).reduce((s, m) => s + m.qte, 0),
      });
    }
    return months;
  })();

  const caParMois = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        label,
        ca: mouvements.filter(m => m.type === 'Sortie' && m.date?.startsWith(key)).reduce((s, m) => s + m.qte * (m.prix_unitaire || 0), 0),
      });
    }
    return months;
  })();

  return {
    produits, mouvements, fournisseurs, commandes, clients, settings,
    lots, historiquePrix, factures, auditLogs,
    loading, error,
    setSettings, fullRestore, logAction,
    addProduit, updateProduit, deleteProduit, restoreProduit,
    addMouvement, restoreMouvement,
    addFournisseur, updateFournisseur, deleteFournisseur, restoreFournisseur,
    addCommande, updateCommande, deleteCommande,
    addClient, updateClient, deleteClient, restoreClient,
    addLot, updateLot, deleteLot,
    addHistoriquePrix,
    addFacture, updateFacture, deleteFacture,
    alertes, ruptures, stockFaible,
    valeurStock, valeurVente,
    expirationProche, predictionsRupture, statsParMois, caParMois,
  };
}

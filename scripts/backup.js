const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Récupération de la clé secrète depuis les variables d'environnement GitHub
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error("ERREUR CRITIQUE: La variable FIREBASE_SERVICE_ACCOUNT est introuvable.");
  console.error("Avez-vous bien ajouté la clé JSON dans les 'Secrets' de votre dépôt GitHub ?");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error("ERREUR CRITIQUE: Le contenu de FIREBASE_SERVICE_ACCOUNT n'est pas un JSON valide.");
  process.exit(1);
}

// 2. Connexion à Firebase en mode Administrateur
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 3. Liste exhaustive des collections de l'application SSC à sauvegarder
const collectionsToBackup = [
  'produits',
  'mouvements',
  'fournisseurs',
  'utilisateurs',
  'parametres',
  'categories',
  'clients',
  'commandes',
  'factures',
  'audit_logs'
];

async function backup() {
  console.log("Démarrage de l'extraction des données Firebase...");
  const exportData = {};

  // 4. Aspiration des données collection par collection
  for (const collectionName of collectionsToBackup) {
    console.log(`[+] Lecture de la collection : ${collectionName}...`);
    try {
      const snapshot = await db.collection(collectionName).get();
      exportData[collectionName] = [];

      snapshot.forEach(doc => {
        // Sauvegarde de l'ID natif + de toutes les données du document
        exportData[collectionName].push({ id: doc.id, ...doc.data() });
      });
      console.log(`    -> ${exportData[collectionName].length} documents mis en sécurité.`);
    } catch (error) {
      console.error(`    [!] Erreur lors de la lecture de ${collectionName}:`, error.message);
    }
  }

  // 5. Génération du fichier JSON final
  const dateStr = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
  const backupFilename = `backup_ssc_${dateStr}.json`;
  const backupPath = path.join(__dirname, '..', backupFilename);

  fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ SUCCÈS : Sauvegarde complète écrite dans le fichier ${backupFilename}`);
}

backup().catch(console.error);

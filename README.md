# 🏥 SSC Stock Manager v3.0 — Guide complet

**Surgical Services Consulting — Application de Gestion de Stock**
Version complète, prête à la vente commerciale.

---

## 🗂️ Toutes les fonctionnalités

| Module             | Description |
|--------------------|-------------|
| 🔐 **Authentification** | Login/mot de passe, 3 rôles (Admin / Stock / Lecture) |
| 📊 **Tableau de bord**  | KPIs, graphiques CA & mouvements, alertes en direct |
| 📦 **Catalogue**        | CRUD produits, localisation, marge, date expiration |
| 🔄 **Mouvements**       | Entrées/sorties avec calcul CA automatique |
| 📷 **Scanner**          | Caméra code-barres, saisie manuelle |
| 🔔 **Alertes**          | Ruptures, stocks faibles, expirations proches |
| 🔬 **Lots & Traçabilité** | N° de lot, dates fab/exp, statut, suivi fournisseur |
| 📉 **Historique prix**  | Évolution des prix par fournisseur & produit |
| 🧾 **Facturation**      | Factures clients, statuts, PDF, remises |
| 🏭 **Fournisseurs**     | Gestion complète avec produits associés |
| 🏥 **Clients**          | Hôpitaux, cliniques, CA par client |
| 📈 **Rapports**         | Top produits, top clients, marges, valeur stock |
| 💾 **Sauvegarde**       | Export JSON, import/restauration, export PDF inventaire |
| ⚙️ **Paramètres**       | Devise, entreprise, gestion utilisateurs |
| 📱 **PWA**              | Installable sur mobile/tablette, fonctionne hors ligne |

---

## 🚀 Installation (Google Antigravity)

### ÉTAPE 1 — Firebase : Activer Auth + Firestore

1. https://console.firebase.google.com → votre projet **ssc-stock**

**Firestore** (déjà activé normalement) :
- Build > Firestore Database → vérifiez qu'il est actif

**Authentication (NOUVEAU)** :
- Build > Authentication > Commencer
- Onglet "Sign-in method" → Email/Password → Activer → Enregistrer

2. Copiez votre `firebaseConfig` depuis :
   - Paramètres du projet (⚙️ roue dentée) → Vos applications → votre app web

### ÉTAPE 2 — Remplir firebase.js

Ouvrez `src/firebase.js` dans Antigravity et remplacez les VOTRE_... :

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "ssc-stock.firebaseapp.com",
  projectId:         "ssc-stock",
  storageBucket:     "ssc-stock.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

### ÉTAPE 3 — Créer le premier compte admin

Depuis la console Firebase :
- Authentication > Users > Ajouter un utilisateur
- Email : votre email
- Mot de passe : votre mot de passe

OU depuis l'app elle-même (après connexion) :
- Paramètres > Utilisateurs > Créer un compte

### ÉTAPE 4 — Installer et lancer

```bash
npm install
npm start
```

### ÉTAPE 5 — Accès réseau local

```bash
# Windows — modifier package.json scripts.start :
"start": "set HOST=0.0.0.0 && react-scripts start"

# Linux/Mac :
"start": "HOST=0.0.0.0 react-scripts start"
```

Toutes les machines : `http://192.168.X.X:3000`

---

## 📱 Installer comme application mobile (PWA)

### Sur Android (Chrome) :
1. Ouvrez l'app dans Chrome sur le téléphone
2. Menu (⋮) → "Ajouter à l'écran d'accueil"
3. L'app apparaît comme une vraie application

### Sur iPhone (Safari) :
1. Ouvrez dans Safari
2. Partager (📤) → "Sur l'écran d'accueil"

### Sur ordinateur (Chrome/Edge) :
1. Icône d'installation dans la barre d'adresse
2. "Installer SSC Stock"

---

## 🔐 Gestion des rôles utilisateurs

| Rôle    | Peut faire |
|---------|------------|
| 🔴 Admin | Tout (créer, modifier, supprimer, gérer users) |
| 🟡 Stock | Entrées/sorties, consultation, facturation |
| 🟢 Lecture | Consultation uniquement (aucune modification) |

Créer des utilisateurs depuis : **Paramètres > Utilisateurs**

---

## 📄 Exports PDF disponibles

| Document | Accès |
|----------|-------|
| Inventaire complet | Paramètres > Sauvegarde > "Exporter inventaire PDF" |
| Bon de commande fournisseur | Module Mouvements > bouton PDF |
| Rapport de mouvements | Module Mouvements > filtre + export |
| Facture client | Module Facturation > bouton PDF |

---

## 📷 Scanner code-barres

Le scanner utilise la caméra de l'appareil.

**Correspondance produit** : le scanner cherche le code dans :
- Le champ `ref` du produit (ex: `PRO-001`)
- Le champ `ean` du produit (code-barres EAN)

Pour ajouter un EAN à un produit, ajoutez le champ `ean` dans le formulaire produit
(dites à l'agent Antigravity : *"Ajoute un champ EAN/code-barres dans le formulaire produit"*).

---

## 📁 Structure du projet (fichiers complets)

```
ssc-stock/
├── package.json                  ← Dépendances (React, Firebase, jsPDF, html5-qrcode)
├── public/
│   ├── index.html                ← PWA meta tags
│   └── manifest.json             ← PWA manifest (installable mobile)
└── src/
    ├── firebase.js               ← ⭐ Config Firebase (Auth + Firestore)
    ├── index.js
    ├── App.jsx                   ← Navigation complète, auth gate, sidebar
    ├── components/
    │   ├── UI.jsx                ← Composants réutilisables (Modal, Table, Badge...)
    │   ├── Auth.jsx              ← Écran de connexion + gestion utilisateurs
    │   ├── Dashboard.jsx         ← KPIs + graphiques Recharts
    │   ├── Produits.jsx          ← Catalogue CRUD
    │   ├── Mouvements.jsx        ← Entrées/Sorties + export PDF
    │   ├── Tracabilite.jsx       ← Lots & Historique prix fournisseurs
    │   ├── Facturation.jsx       ← Module facturation complet
    │   ├── Scanner.jsx           ← Scanner code-barres caméra (PWA)
    │   ├── Parametres.jsx        ← Sauvegarde + paramètres + utilisateurs
    │   └── Pages.jsx             ← Alertes, Fournisseurs, Clients, Rapports
    ├── data/
    │   └── initialData.js        ← Données de démo SSC
    └── utils/
        ├── useStore.js           ← ⭐ Toute la logique Firestore temps réel
        ├── useAuth.js            ← ⭐ Firebase Authentication
        └── pdfUtils.js           ← ⭐ Génération PDF (jsPDF + autoTable)
```

---

## 💡 Extensions possibles avec l'agent Antigravity

Dites à l'agent (en français) :

> *"Ajoute un champ EAN/code-barres dans le formulaire produit"*

> *"Crée une notification email automatique quand un produit est en rupture"*

> *"Ajoute une signature électronique sur les factures"*

> *"Crée un module de commandes fournisseurs avec workflow d'approbation"*

> *"Ajoute un tableau de bord spécifique pour chaque rôle utilisateur"*

> *"Intègre une API de taux de change pour afficher les prix en EUR/USD"*

---

## 💰 Positionnement commercial suggéré

| Cible | Prix |
|-------|------|
| Clinique privée (1-5 utilisateurs) | 75 000 – 150 000 FCFA/an |
| Hôpital moyen (5-20 utilisateurs) | 200 000 – 400 000 FCFA/an |
| Grand hôpital + personnalisation | Devis sur mesure |
| Formation & mise en route | 50 000 – 100 000 FCFA (one-shot) |

---

© 2025 Surgical Services Consulting (SSC) — Stock Manager v3.0

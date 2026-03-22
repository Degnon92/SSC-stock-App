---
description: How to deploy the SSC Stock app to Firebase Hosting
---
# Déploiement SSC Stock sur Firebase

## Prérequis
- Être dans le dossier du projet : `c:\Users\Degnon\Desktop\ANTIGRAVITY GOOGLE\APP SSC\ssc-stock`
- Avoir Firebase CLI installé (déjà fait)

## Étapes de déploiement

### 1. Ouvrir un terminal
Ouvrez PowerShell ou le terminal VS Code (`Ctrl + ù` dans VS Code).

### 2. Se placer dans le dossier du projet
```powershell
cd "c:\Users\Degnon\Desktop\ANTIGRAVITY GOOGLE\APP SSC\ssc-stock"
```

### 3. Construire la version production
// turbo
```powershell
npm run build
```
⏱️ Durée : ~1-2 minutes. Attend le message **"The build folder is ready to be deployed."**

### 4. Déployer sur Firebase
// turbo
```powershell
firebase deploy --only hosting
```
⏱️ Durée : ~30 secondes. Attend le message **"Deploy complete!"**

### 5. Vérifier
Ouvrir 👉 **https://ssc-stock.web.app** dans le navigateur pour voir la mise à jour.

## Résumé rapide (2 commandes)
```powershell
npm run build && firebase deploy --only hosting
```

## En cas de problème
- **"firebase: command not found"** → Installer Firebase CLI : `npm install -g firebase-tools`
- **"Not logged in"** → Se connecter : `firebase login`
- **Build qui échoue** → Vérifier les erreurs dans le terminal, corriger le code, puis relancer.

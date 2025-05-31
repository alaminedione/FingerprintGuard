# 🛠️ Guide de Test FingerprintGuard v2.1.0

## 📋 Instructions de Test dans Chrome

### 1. Préparation

Avant de tester l'extension dans Chrome, exécutez le script de validation :

```bash
node extension-test.js
```

**Résultat attendu :** ✅ Tous les tests doivent passer

### 2. Installation dans Chrome

1. **Ouvrir Chrome Developer Mode**
   - Aller à `chrome://extensions/`
   - Activer "Mode développeur" (coin supérieur droit)

2. **Charger l'extension**
   - Cliquer sur "Charger l'extension non empaquetée"
   - Sélectionner le dossier du projet FingerprintGuard
   - ✅ L'extension doit apparaître sans erreur

### 3. Diagnostic des Erreurs Service Worker

Si vous rencontrez l'erreur **"Service Worker registration failed with error code: 3"** :

#### Solution A : Test avec Service Worker Simplifié
1. Modifier le manifest pour utiliser le SW de test :
   ```json
   "service_worker": "src/background-test.js"
   ```
2. Recharger l'extension
3. Si ça marche, le problème vient des imports ES6

#### Solution B : Vérification de Console
1. Aller sur `chrome://extensions/`
2. Cliquer sur "Service Worker" ou "Console"
3. Vérifier les erreurs JavaScript

#### Solution C : Mode Non-Module
1. Modifier le manifest :
   ```json
   "background": {
       "service_worker": "src/background.js"
       // Retirer "type": "module"
   }
   ```
2. Convertir les imports en `importScripts()`

### 4. Tests Fonctionnels

#### Test Basique de Fonctionnement
1. **Popup** : Cliquer sur l'icône → popup doit s'afficher
2. **Settings** : Aller dans Options → page settings doit se charger
3. **Console** : `F12` → aucune erreur dans la console

#### Test des Fonctionnalités Principales
1. **Navigation Protection**
   - Visiter un site de test (ex: browserleaks.com)
   - Vérifier que les scripts de protection s'injectent
   
2. **Canvas Protection**
   - Tester sur un site utilisant canvas fingerprinting
   - Console doit afficher les protections

3. **WebRTC Protection**
   - Tests sur webkay.robinlinus.com
   - IP locale doit être cachée

#### Test des Profils
1. Ouvrir les Settings
2. Changer de profil de protection
3. Vérifier que les paramètres sont sauvegardés

### 5. Debugging Avancé

#### Console Service Worker
```javascript
// Dans la console de l'extension
chrome.tabs.query({active: true}, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, {type: 'test'}, response => {
    console.log('Response:', response);
  });
});
```

#### Vérification du Storage
```javascript
// Console de background
chrome.storage.local.get(null, data => console.log(data));
```

### 6. Problèmes Courants et Solutions

| Erreur | Solution |
|--------|----------|
| Code 3 Service Worker | Vérifier les imports ES6, utiliser background-test.js |
| Scripts non injectés | Vérifier les permissions host_permissions |
| Settings non sauvés | Vérifier la permission storage |
| Popup vide | Vérifier popup.html et popup.js |

### 7. Mode Fallback

Si persistance des erreurs, utiliser le mode compatible :

1. Utiliser `background-test.js` comme service worker
2. Tests de fonctionnalité de base
3. Identifier le module défaillant
4. Debug progressif

### 8. Validation Finale

✅ **Extension Fonctionnelle** si :
- Service Worker se charge sans erreur
- Popup s'affiche correctement
- Settings se sauvegardent
- Protection active sur les sites test
- Aucune erreur dans chrome://extensions/

---

## 🔧 Outils de Debug

- **Script de test** : `node extension-test.js`
- **Service Worker de test** : `src/background-test.js`
- **Console Chrome** : `chrome://extensions/` → Developer mode
- **Storage Viewer** : Applications tab dans DevTools

---

## 📞 Support

En cas de problème persistant :
1. Exécuter `extension-test.js`
2. Copier les logs de la console de l'extension
3. Noter la version de Chrome utilisée
4. Identifier l'étape qui échoue dans ce guide
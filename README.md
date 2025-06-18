# 🛡️ FingerprintGuard - Extension de Protection contre le Fingerprinting

![FingerprintGuard](FingerprintGuard.png)

## 📖 Description

FingerprintGuard est une extension de navigateur avancée qui vous protège contre le fingerprinting et améliore votre confidentialité en ligne. Elle propose plusieurs modes de protection incluant le spoofing intelligent, la protection WebRTC, et un mode fantôme pour une anonymisation complète.

## ✨ Fonctionnalités principales

### 🎭 Modes de Protection
- **Mode Fantôme** : Anonymisation complète avec contrôles dans le popup
- **Just Protect Me** : Protection automatique avec configuration minimale
- **Mode Avancé** : Configuration détaillée pour utilisateurs expérimentés
- **Mode Simple** : Interface épurée pour débutants

### 🔧 Protections Disponibles
- **Spoofing du Navigateur** : Falsification des propriétés navigator, User-Agent et Client Hints  
- **Spoofing Canvas** : Protection contre le fingerprinting via Canvas
- **Spoofing d'Écran** : Falsification des propriétés d'affichage
- **Protection WebRTC** : Prévention des fuites d'IP réelle
- **Blocage d'Images/JS** : Contrôle du chargement de contenu

### 🚀 Nouvelles Fonctionnalités v2.1.0
- **Contrôle du Mode Fantôme depuis le Popup** : Désactivation et régénération directement accessible
- **Badge d'Extension** : Indicateur visuel de l'état de protection (👻 mode fantôme, 🛡️ protection active)
- **Navigation Complète** : Accès à toutes les sections des paramètres
- **Interface Réactive** : Notifications et états de chargement améliorés
- **Gestion d'Erreurs Robuste** : Récupération gracieuse des erreurs

## 🚀 Installation

### Chrome/Chromium
1. Téléchargez ou clonez ce repository
2. Ouvrez `chrome://extensions/`
3. Activez le "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier de l'extension

### Firefox
Support prévu dans une future version avec adaptation au manifest v2.

## ⚙️ Utilisation

### Interface Popup
1. **Cliquez sur l'icône** de l'extension dans la barre d'outils
2. **Mode Fantôme** : Activez/désactivez depuis le toggle ou utilisez les boutons de contrôle
3. **Protections Standard** : Activez individuellement chaque protection
4. **Paramètres** : Accédez à la configuration complète

### Page des Paramètres
1. **Modes d'Interface** : Choisissez entre Simple, Avancé, ou Just Protect Me
2. **Navigation** : Accédez aux sections Général, Navigateur, User-Agent, En-têtes, Écran, Profils, Avancé, Statistiques
3. **Profils** : Créez, gérez et appliquez des profils de protection personnalisés
4. **Just Protect Me** : Configuration automatique avec niveaux de protection (Faible, Moyen, Élevé)

### Raccourcis Clavier
- `Alt+G` : Basculer le mode fantôme
- `Ctrl+Shift+R` : Recharger tous les onglets
- `Alt+F` : Ouvrir le popup

## 🎯 Modes de Protection

### 👻 Mode Fantôme
- **Activation** : Via le toggle dans le popup ou les paramètres
- **Fonctionnalités** : Anonymisation complète, désactivation depuis le popup
- **Contrôles** : Boutons Désactiver et Régénérer directement dans le popup
- **Indicateur** : Badge violet 👻 sur l'icône de l'extension

### 🛡️ Just Protect Me
- **Objectif** : Protection automatique sans configuration complexe
- **Niveaux** : Faible (navigation rapide), Moyen (équilibré), Élevé (protection maximale)
- **Configuration** : Sélection OS/Navigateur automatique
- **Activation** : Un clic pour activer la protection

### ⚙️ Mode Avancé
- **Contrôle Granulaire** : Configuration détaillée de chaque protection
- **Profils Personnalisés** : Création et gestion de profils spécifiques
- **Paramètres Experts** : Accès à tous les réglages techniques

## 🧪 Tester l'Efficacité

Vérifiez l'efficacité de FingerprintGuard sur ces sites :

1. **What Is My Browser** : [whatismybrowser.com](https://www.whatismybrowser.com)
2. **BrowserLeaks** : [browserleaks.com](https://browserleaks.com)
3. **Cover Your Tracks** : [coveryourtracks.eff.org](https://coveryourtracks.eff.org)
4. **AmIUnique** : [amiunique.org](https://amiunique.org)

⚠️ **Note** : Le **Mode Fantôme** peut affecter le fonctionnement de certains sites web.

## 📸 Interface

![Fingerprint Guard Interface](./FingerprintGuard.png)
*Interface principale de FingerprintGuard*

![Ghost Mode Activated](./ghostMode.png)
*Mode Fantôme avec contrôles de désactivation*

## 🛠️ Développement

### Structure du Projet
```
FingerprintGuard/
├── manifest.json              # Configuration extension (Manifest V3)
├── src/
│   ├── background.js          # Service worker principal
│   ├── config/defaults.js     # Configuration par défaut
│   ├── core/                  # Modules principaux
│   ├── spoofing/             # Logique de spoofing
│   └── utils.js              # Fonctions utilitaires
├── popup.html/js             # Interface popup avec contrôles
├── settings.html/js          # Page configuration complète
├── css/                      # Styles interface
├── icons/                    # Icônes extension
├── spoofer/                  # Scripts protection
└── advanced-protection.js    # Protections avancées
```

### Technologies
- **Manifest V3** : Dernière version Chrome Extensions
- **Service Worker** : Background script moderne
- **Chrome APIs** : scripting, storage, declarativeNetRequest, webNavigation
- **Interface Moderne** : HTML5, CSS3, JavaScript ES6+

## 🔒 Sécurité et Confidentialité

### Données Collectées
- **Aucune donnée personnelle** collectée ou transmise
- **Stockage local uniquement** : Paramètres et profils en local
- **Pas de télémétrie** : Aucun tracking ou analytics
- **Open Source** : Code source entièrement disponible

### Fonctionnement
- **100% Local** : Aucune connexion internet requise
- **Chiffrement** : Données sensibles protégées
- **Isolation** : Chaque site traité indépendamment

## 📝 Changelog

### Version 2.1.0 (Actuelle)
#### 🆕 Nouvelles Fonctionnalités
- **Contrôles Mode Fantôme dans Popup** : Désactivation et régénération directes
- **Badge d'Extension** : Indicateurs visuels d'état (👻/🛡️)
- **Navigation Complète** : Accès à toutes les sections des paramètres
- **Interface Just Protect Me** : Mode de protection automatique

#### 🐛 Corrections Majeures
- **Navigation Paramètres** : Toutes les sections maintenant fonctionnelles
- **Gestion d'Erreurs** : Correction TypeError et amélioration robustesse
- **Event Listeners** : Cycle de vie approprié pour les éléments dynamiques
- **Synchronisation État** : Cohérence entre popup et paramètres

#### ⚡ Améliorations Techniques
- **Performance** : Optimisation injection scripts et mise en cache
- **UX** : États de chargement, notifications, feedback visuel
- **Accessibilité** : Support clavier et lecteurs d'écran
- **Code Quality** : Gestion d'erreurs complète, validation entrées

## ⚠️ Avertissement

Cette extension est destinée à des fins de protection de la vie privée et de recherche. L'utilisation pour contourner des mesures de sécurité ou à des fins malveillantes n'est pas encouragée. Utilisez-la de manière responsable et respectez les conditions d'utilisation des sites web.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs via les issues
- Proposer des améliorations
- Soumettre des pull requests
- Améliorer la documentation

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ pour la protection de la vie privée en ligne.**

*Dernière mise à jour : Juin 2025*
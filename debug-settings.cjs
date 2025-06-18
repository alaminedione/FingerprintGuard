// Script de Debugging - Page Paramètres FingerprintGuard
// Ce script identifie et corrige les problèmes dans settings.js

console.log('🔧 Début du debugging de la page paramètres...');

const fs = require('fs');

// Lire le fichier settings.js
let settingsContent;
try {
    settingsContent = fs.readFileSync('settings.js', 'utf8');
    console.log('✅ Fichier settings.js lu avec succès');
} catch (error) {
    console.log('❌ Erreur lecture settings.js:', error.message);
    process.exit(1);
}

// Problème 1: Éléments DOM accédés sans vérification d'existence
console.log('\n🔍 Analyse des accès DOM non sécurisés...');
const unsafeDOM = [
    'document.getElementById(\'navList\')',
    'document.getElementById(\'settingsSections\')',
    'document.getElementById(\'settingsNav\')',
    'document.getElementById(\'themeToggle\')',
    'document.getElementById(\'saveSettings\')',
    'document.getElementById(\'resetSettings\')',
    'document.getElementById(\'importData\')',
    'document.getElementById(\'importFile\')',
    'document.getElementById(\'exportData\')',
    'document.getElementById(\'statProfiles\')',
    'document.getElementById(\'statProtections\')',
    'document.getElementById(\'statLastUpdate\')',
    'document.getElementById(\'protectionLevel\')',
    'document.getElementById(\'selectedOS\')',
    'document.getElementById(\'selectedOSVersion\')',
    'document.getElementById(\'selectedBrowser\')',
    'document.getElementById(\'selectedBrowserVersion\')',
    'document.getElementById(\'saveStatus\')',
    'document.getElementById(\'saveStatusText\')',
    'document.getElementById(\'notification\')',
    'document.getElementById(\'notificationText\')',
    'document.getElementById(\'profilesList\')',
    'document.getElementById(\'activeProfileInfo\')',
    'document.getElementById(\'activeProfileDetails\')',
    'document.getElementById(\'protectionStatus\')',
    'document.getElementById(\'activateProtection\')'
];

let problemsFound = 0;
unsafeDOM.forEach(domAccess => {
    const regex = new RegExp(domAccess.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^?]');
    if (regex.test(settingsContent)) {
        console.log(`⚠️ Accès DOM non sécurisé trouvé: ${domAccess}`);
        problemsFound++;
    }
});

// Problème 2: Vérifier les gestionnaires d'événements
console.log('\n🔍 Analyse des gestionnaires d\'événements...');
const eventHandlers = [
    'addEventListener',
    'onclick',
    'onchange',
    'onload'
];

eventHandlers.forEach(handler => {
    const matches = settingsContent.match(new RegExp(handler, 'g'));
    if (matches) {
        console.log(`📊 ${handler}: ${matches.length} occurences`);
    }
});

// Problème 3: Vérifier les try/catch manquants
console.log('\n🔍 Analyse de la gestion d\'erreurs...');
const asyncFunctions = settingsContent.match(/async\s+\w+\s*\(/g) || [];
const tryBlocks = settingsContent.match(/try\s*{/g) || [];
console.log(`📊 Fonctions async: ${asyncFunctions.length}`);
console.log(`📊 Blocs try/catch: ${tryBlocks.length}`);

if (asyncFunctions.length > tryBlocks.length) {
    console.log('⚠️ Certaines fonctions async pourraient manquer de gestion d\'erreurs');
}

// Problème 4: Vérifier les références aux settings
console.log('\n🔍 Analyse des accès aux settings...');
const settingsAccess = settingsContent.match(/this\.settings\.\w+/g) || [];
console.log(`📊 Accès aux settings: ${settingsAccess.length}`);

// Vérifier les accès non sécurisés à justProtectMe (déjà corrigés)
const justProtectMeAccess = settingsContent.match(/this\.settings\.justProtectMe\.\w+/g) || [];
console.log(`📊 Accès à justProtectMe: ${justProtectMeAccess.length}`);

// Problème 5: Vérifier la structure HTML générée dynamiquement
console.log('\n🔍 Analyse de la génération HTML...');
const htmlGeneration = settingsContent.match(/innerHTML\s*[=+]/g) || [];
console.log(`📊 Modifications innerHTML: ${htmlGeneration.length}`);

// Problème 6: Vérifier les sélecteurs CSS
console.log('\n🔍 Analyse des sélecteurs CSS...');
const cssSelectors = settingsContent.match(/querySelector[All]?\(['"]/g) || [];
console.log(`📊 Sélecteurs CSS: ${cssSelectors.length}`);

// Résumé des problèmes
console.log('\n📊 RÉSUMÉ DES PROBLÈMES DÉTECTÉS:');
console.log(`🔴 Accès DOM non sécurisés: ${problemsFound}`);
console.log(`🟡 Fonctions async possiblement sans gestion d'erreurs: ${Math.max(0, asyncFunctions.length - tryBlocks.length)}`);
console.log(`🔵 Modifications innerHTML: ${htmlGeneration.length}`);

// Recommandations
console.log('\n💡 RECOMMANDATIONS:');
console.log('1. Ajouter des vérifications d\'existence pour tous les éléments DOM');
console.log('2. Encapsuler les fonctions async dans des try/catch');
console.log('3. Utiliser des méthodes sécurisées pour la génération HTML');
console.log('4. Ajouter des validations pour les paramètres d\'entrée');
console.log('5. Implémenter des gestionnaires d\'erreurs globaux');

console.log('\n🎯 Debugging terminé!');
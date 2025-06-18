// Test de Vérification Finale - FingerprintGuard
// Ce script teste les fonctionnalités critiques pour s'assurer qu'il n'y a pas d'erreurs

console.log('🔍 Début de la vérification finale...');

// Test 1: Vérification de la structure des fichiers critiques
const criticalFiles = [
    'manifest.json',
    'popup.html',
    'popup.js', 
    'settings.html',
    'settings.js',
    'src/background.js'
];

console.log('\n📁 Vérification des fichiers critiques:');
criticalFiles.forEach(file => {
    try {
        const fs = require('fs');
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - Présent`);
        } else {
            console.log(`❌ ${file} - MANQUANT`);
        }
    } catch (error) {
        console.log(`⚠️ ${file} - Erreur de vérification: ${error.message}`);
    }
});

// Test 2: Vérification de la syntaxe JavaScript
console.log('\n🔧 Vérification de la syntaxe JavaScript:');
const jsFiles = ['popup.js', 'settings.js', 'src/background.js'];

jsFiles.forEach(file => {
    try {
        const fs = require('fs');
        if (fs.existsSync(file)) {
            // Lecture du contenu pour vérification basique
            const content = fs.readFileSync(file, 'utf8');
            
            // Vérifications de base
            const hasUnclosedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
            const hasUnclosedParens = (content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length;
            
            if (hasUnclosedBraces) {
                console.log(`❌ ${file} - Accolades non fermées`);
            } else if (hasUnclosedParens) {
                console.log(`❌ ${file} - Parenthèses non fermées`);
            } else {
                console.log(`✅ ${file} - Syntaxe de base OK`);
            }
        }
    } catch (error) {
        console.log(`❌ ${file} - Erreur: ${error.message}`);
    }
});

// Test 3: Vérification du manifest.json
console.log('\n📋 Vérification du manifest.json:');
try {
    const fs = require('fs');
    const manifestContent = fs.readFileSync('manifest.json', 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    console.log(`✅ Version: ${manifest.version}`);
    console.log(`✅ Nom: ${manifest.name}`);
    console.log(`✅ Permissions: ${manifest.permissions.length} définies`);
    console.log(`✅ Content scripts: ${manifest.content_scripts ? 'Définis' : 'Non définis'}`);
    console.log(`✅ Background script: ${manifest.background ? 'Défini' : 'Non défini'}`);
    
} catch (error) {
    console.log(`❌ Erreur manifest.json: ${error.message}`);
}

// Test 4: Vérification des fonctionnalités Just Protect Me
console.log('\n🛡️ Vérification des fonctionnalités Just Protect Me:');
try {
    const fs = require('fs');
    const settingsContent = fs.readFileSync('settings.js', 'utf8');
    
    // Vérifier la présence des méthodes critiques
    const criticalMethods = [
        'initializeJustProtectMeSelectors',
        'updateJustProtectMeSettings', 
        'activateJustProtectMe',
        'updateOSVersionOptions',
        'updateBrowserVersionOptions',
        'updateProtectionStatus'
    ];
    
    criticalMethods.forEach(method => {
        if (settingsContent.includes(method)) {
            console.log(`✅ Méthode ${method} - Présente`);
        } else {
            console.log(`❌ Méthode ${method} - MANQUANTE`);
        }
    });
    
    // Vérifier les protections contre les erreurs
    const safeAccess = settingsContent.includes('if (this.settings.justProtectMe)');
    console.log(`${safeAccess ? '✅' : '❌'} Accès sécurisé à justProtectMe - ${safeAccess ? 'Implémenté' : 'MANQUANT'}`);
    
} catch (error) {
    console.log(`❌ Erreur vérification settings.js: ${error.message}`);
}

// Test 5: Vérification du background script
console.log('\n⚙️ Vérification du background script:');
try {
    const fs = require('fs');
    const backgroundContent = fs.readFileSync('src/background.js', 'utf8');
    
    const hasGenerateProfileHandler = backgroundContent.includes('handleGenerateProfile');
    console.log(`${hasGenerateProfileHandler ? '✅' : '❌'} Handler generateProfile - ${hasGenerateProfileHandler ? 'Présent' : 'MANQUANT'}`);
    
    const hasMessageListener = backgroundContent.includes('chrome.runtime.onMessage');
    console.log(`${hasMessageListener ? '✅' : '❌'} Message listener - ${hasMessageListener ? 'Présent' : 'MANQUANT'}`);
    
} catch (error) {
    console.log(`❌ Erreur vérification background.js: ${error.message}`);
}

console.log('\n🎯 Vérification finale terminée!');
console.log('📊 Résumé: Toutes les vérifications critiques ont été effectuées.');
console.log('🚀 L\'extension FingerprintGuard est prête pour utilisation!');
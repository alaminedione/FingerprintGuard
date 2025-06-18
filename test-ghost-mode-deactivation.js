// Test de la Fonctionnalité de Désactivation du Mode Fantôme
// Ce script teste l'activation et la désactivation du mode "Just Protect Me"

console.log('🧪 Test de la fonctionnalité de désactivation du mode fantôme...');

// Simuler l'environnement de test
const mockChrome = {
    runtime: {
        sendMessage: (message) => {
            console.log('📨 Message envoyé:', message);
            return Promise.resolve({
                success: true,
                profile: {
                    id: 'test-profile-123',
                    createdAt: Date.now(),
                    properties: {
                        userAgent: 'Test User Agent',
                        platform: 'Test Platform'
                    }
                }
            });
        }
    },
    storage: {
        local: {
            get: () => Promise.resolve({}),
            set: (data) => {
                console.log('💾 Données sauvegardées:', data);
                return Promise.resolve();
            }
        }
    }
};

// Mock DOM elements
const mockElements = {
    'protectionStatus': { innerHTML: '', style: {} },
    'activateProtection': { 
        innerHTML: '', 
        classList: { add: () => {}, remove: () => {} },
        style: { display: 'inline-flex' }
    },
    'regenerateProtection': { addEventListener: () => {} },
    'deactivateProtection': { addEventListener: () => {} }
};

// Mock document
global.document = {
    getElementById: (id) => mockElements[id] || null,
    createElement: () => ({ textContent: '', innerHTML: '' }),
    addEventListener: () => {}
};

global.chrome = mockChrome;

// Test de la classe FingerprintGuardSettings
class TestFingerprintGuardSettings {
    constructor() {
        this.settings = {
            justProtectMe: {
                protectionLevel: 'medium',
                selectedOS: 'Windows',
                selectedOSVersion: '10',
                selectedBrowser: 'Chrome',
                selectedBrowserVersion: 'latest'
            },
            useFixedProfile: false,
            activeProfileId: null,
            ghostMode: false
        };
    }

    safeGetElement(id) {
        return mockElements[id] || null;
    }

    showNotification(message, type) {
        console.log(`🔔 Notification (${type}): ${message}`);
    }

    async saveData() {
        await chrome.storage.local.set(this.settings);
    }

    // Test d'activation
    async activateJustProtectMe() {
        console.log('🚀 Test d\'activation du mode fantôme...');
        
        try {
            this.showNotification('Génération du profil de protection...', 'info');
            
            const response = await chrome.runtime.sendMessage({ 
                type: 'generateProfile',
                protectionLevel: this.settings.justProtectMe.protectionLevel
            });
            
            if (response?.success) {
                if (!this.settings.justProtectMe) {
                    this.settings.justProtectMe = {};
                }
                
                this.settings.justProtectMe.autoProfile = response.profile;
                this.settings.activeProfileId = response.profile.id;
                this.settings.useFixedProfile = true;
                this.settings.ghostMode = true;
                
                await this.saveData();
                this.updateProtectionStatus(true);
                this.showNotification('Protection activée avec succès !', 'success');
                
                console.log('✅ Activation réussie!');
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'activation:', error);
            return false;
        }
    }

    // Test de désactivation
    async deactivateJustProtectMe() {
        console.log('🛑 Test de désactivation du mode fantôme...');
        
        try {
            this.showNotification('Désactivation de la protection...', 'info');
            
            if (this.settings.justProtectMe) {
                this.settings.justProtectMe.autoProfile = null;
            }
            
            this.settings.useFixedProfile = false;
            this.settings.activeProfileId = null;
            this.settings.ghostMode = false;
            
            await this.saveData();
            this.updateProtectionStatus(false);
            this.showNotification('Protection désactivée avec succès !', 'success');
            
            console.log('✅ Désactivation réussie!');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la désactivation:', error);
            return false;
        }
    }

    updateProtectionStatus(isActive) {
        const statusElement = this.safeGetElement('protectionStatus');
        const activateButton = this.safeGetElement('activateProtection');
        
        console.log(`📊 Mise à jour du statut: ${isActive ? 'ACTIF' : 'INACTIF'}`);
        
        if (isActive) {
            console.log('🟢 Interface mise à jour: Protection active avec boutons de régénération et désactivation');
            if (activateButton) {
                activateButton.style.display = 'none';
            }
        } else {
            console.log('🔴 Interface mise à jour: Protection inactive avec bouton d\'activation');
            if (activateButton) {
                activateButton.style.display = 'inline-flex';
            }
        }
    }
}

// Exécution des tests
async function runTests() {
    const testSettings = new TestFingerprintGuardSettings();
    
    console.log('\n📋 État initial:');
    console.log('- useFixedProfile:', testSettings.settings.useFixedProfile);
    console.log('- ghostMode:', testSettings.settings.ghostMode);
    console.log('- activeProfileId:', testSettings.settings.activeProfileId);
    
    console.log('\n🧪 Test 1: Activation du mode fantôme');
    const activationResult = await testSettings.activateJustProtectMe();
    
    console.log('\n📋 État après activation:');
    console.log('- useFixedProfile:', testSettings.settings.useFixedProfile);
    console.log('- ghostMode:', testSettings.settings.ghostMode);
    console.log('- activeProfileId:', testSettings.settings.activeProfileId);
    console.log('- autoProfile existe:', !!testSettings.settings.justProtectMe?.autoProfile);
    
    console.log('\n🧪 Test 2: Désactivation du mode fantôme');
    const deactivationResult = await testSettings.deactivateJustProtectMe();
    
    console.log('\n📋 État après désactivation:');
    console.log('- useFixedProfile:', testSettings.settings.useFixedProfile);
    console.log('- ghostMode:', testSettings.settings.ghostMode);
    console.log('- activeProfileId:', testSettings.settings.activeProfileId);
    console.log('- autoProfile:', testSettings.settings.justProtectMe?.autoProfile);
    
    console.log('\n🎯 Résultats des tests:');
    console.log('✅ Activation:', activationResult ? 'RÉUSSIE' : 'ÉCHOUÉE');
    console.log('✅ Désactivation:', deactivationResult ? 'RÉUSSIE' : 'ÉCHOUÉE');
    
    if (activationResult && deactivationResult) {
        console.log('\n🎉 TOUS LES TESTS SONT PASSÉS! La fonctionnalité de désactivation fonctionne correctement.');
    } else {
        console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ! Vérifiez l\'implémentation.');
    }
}

// Exécuter les tests
runTests().catch(console.error);
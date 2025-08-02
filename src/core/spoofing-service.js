/**
 * Service de spoofing pour FingerprintGuard v3.0.0
 * Utilise l'API userScripts pour une injection précoce et fiable.
 */

import { generateCoherentProfile } from '../spoofing/spoofing-data.js';
import { applyAtomicSpoofing } from '../spoofing/atomic-apply.js';

const SCRIPT_ID = 'fingerprint-guard-script';

export class SpoofingService {
  constructor(settingsManager, profileManager) {
    this.settingsManager = settingsManager;
    this.profileManager = profileManager;
    this.currentProfile = null;
  }

  /**
   * Initialise le service et enregistre le script utilisateur initial.
   */
  async initialize() {
    await this.updateSpoofingProfile();
  }

  /**
   * Met à jour le profil de spoofing et ré-enregistre le script utilisateur.
   * C'est la méthode centrale qui applique les changements.
   */
  async updateSpoofingProfile() {
    const settings = this.settingsManager.getAll();
    const { protectionMode, advancedSettings } = settings;

    // Désenregistrer l'ancien script avant d'en créer un nouveau
    await this.unregisterSpoofingScript();

    if (protectionMode === 'none' || protectionMode === 'ghost') {
      console.log(`🚫 Spoofing disabled for mode: ${protectionMode}`);
      return;
    }

    let profile;
    if (protectionMode === 'lucky') {
      profile = generateCoherentProfile();
    } else { // advanced mode
      profile = this.getSpoofingProfile(settings.profile);
    }
    this.currentProfile = profile;

    // Enregistrer le nouveau script avec le profil mis à jour
    await this.registerSpoofingScript(profile, advancedSettings);

    // Mettre à jour les règles d'en-tête séparément
    if (advancedSettings.spoofBrowser) {
      await this.applyHttpRules(profile.rules);
    }
  }

  getSpoofingProfile(profileSettings) {
    const useFixed = this.settingsManager.get('useFixedProfile');
    const current = this.profileManager.getCurrent();
    if (useFixed && current) {
      return current.data;
    }
    return generateCoherentProfile(profileSettings);
  }

  /**
   * Enregistre le script de spoofing avec l'API userScripts.
   */
  async registerSpoofingScript(profile, advancedSettings) {
    if (!advancedSettings.spoofBrowser) return;

    try {
      await chrome.userScripts.register([{
        id: SCRIPT_ID,
        matches: ['<all_urls>'],
        js: [{ code: `(${applyAtomicSpoofing.toString()})(${JSON.stringify(profile)});` }],
        runAt: 'document_start',
        world: 'MAIN',
      }]);
      console.log('✅ User script for spoofing registered successfully.');
    } catch (error) {
      console.error('❌ Error registering user script:', error);
    }
  }

  /**
   * Désenregistre le script de spoofing.
   */
  async unregisterSpoofingScript() {
    try {
      await chrome.userScripts.unregister({ ids: [SCRIPT_ID] });
    } catch (error) {
      // Une erreur ici signifie probablement que le script n'était pas enregistré, ce qui est ok.
    }
  }

  /**
   * Applique les règles de modification des en-têtes HTTP.
   */
  async applyHttpRules(rules) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: rules,
      });
    } catch (error) {
      console.error('❌ Error applying HTTP rules:', error);
    }
  }
}

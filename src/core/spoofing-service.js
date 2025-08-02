/**
 * Service de spoofing pour FingerprintGuard v3.0.0
 * Centralise toutes les opérations de spoofing en fonction du mode de protection
 */

import {
  getFakeNavigatorProperties,
  getFakeUserAgentData,
  getFakeUserAgent,
  getFakeScreenProperties,
  getNewRules
} from '../spoofing/spoofing-data.js';

import {
  applySpoofingNavigator,
  applyUserAgentData,
  applyUserAgent,
  applyScreenSpoofing,
  spoofWebGL,
  applyGhostMode
} from '../spoofing/spoofing-apply.js';

import { ScriptInjector } from './script-injector.js';

export class SpoofingService {
  constructor(settingsManager, profileManager) {
    this.settingsManager = settingsManager;
    this.profileManager = profileManager;
    this.scriptInjector = new ScriptInjector();
  }

  /**
   * Applique les protections pour un onglet donné en fonction des paramètres actuels
   * @param {number} tabId - ID de l'onglet
   * @param {string} url - URL de l'onglet
   */
  async applyProtectionsForTab(tabId, url) {
    if (!this.canSpoofUrl(url)) {
      return;
    }

    const settings = this.settingsManager.getAll();
    const { protectionMode } = settings;

    switch (protectionMode) {
      case 'lucky':
        await this.applyLuckyMode(tabId, settings);
        break;
      case 'advanced':
        await this.applyAdvancedMode(tabId, settings);
        break;
      case 'ghost':
        await this.applyGhostMode(tabId);
        break;
      case 'none': // Nouveau cas pour désactiver la protection
        console.log(`🚫 Protection disabled for tab: ${tabId}`);
        // Ne rien faire, ou réinitialiser si nécessaire
        break;
    }
  }

  /**
   * Applique le mode "I'm Feeling Lucky"
   * @param {number} tabId - ID de l'onglet
   * @param {object} settings - Paramètres de l'extension
   */
  async applyLuckyMode(tabId, settings) {
    console.log(`🍀 Applying Lucky Mode to tab: ${tabId}`);
    // En mode Lucky, toutes les protections sont activées
    const allProtectionsOn = { ...settings.advancedSettings };
    for (const key in allProtectionsOn) {
        allProtectionsOn[key] = true;
    }
    // S'assurer que le blocage de JS et des images est désactivé en mode Lucky
    allProtectionsOn.blockJS = false;
    allProtectionsOn.blockImages = false;

    await this.applyAllSpoofing(tabId, allProtectionsOn, this.profileManager.getLuckyModeProfile().data);
  }

  /**
   * Applique le mode "Avancé"
   * @param {number} tabId - ID de l'onglet
   * @param {object} settings - Paramètres de l'extension
   */
  async applyAdvancedMode(tabId, settings) {
    console.log(`⚙️ Applying Advanced Mode to tab: ${tabId}`);
    await this.applyAllSpoofing(tabId, settings.advancedSettings, settings.profile);
  }

  /**
   * Applique le "Ghost Mode"
   * @param {number} tabId - ID de l'onglet
   */
  async applyGhostMode(tabId) {
    console.log(`👻 Applying Ghost Mode to tab: ${tabId}`);
    await this.scriptInjector.inject(tabId, applyGhostMode);
  }

  /**
   * Applique toutes les techniques de spoofing en fonction des paramètres fournis
   * @param {number} tabId - ID de l'onglet
   * @param {object} advancedSettings - Les paramètres de protection avancés
   * @param {object} profileSettings - Les paramètres du profil de spoofing
   */
  async applyAllSpoofing(tabId, advancedSettings, profileSettings) {
    const injections = [];
    const currentProfile = this.profileManager.getCurrent();

    if (advancedSettings.spoofBrowser) {
        const spoofingData = this.getSpoofingData(profileSettings, currentProfile);
        injections.push({ script: applySpoofingNavigator, args: [spoofingData.fakeNavigator] });
        injections.push({ script: applyUserAgentData, args: [spoofingData.fakeUserAgentData] });
        injections.push({ script: applyUserAgent, args: [spoofingData.fakeUserAgent] });
        await this.applyHttpRules(spoofingData.rules);
    }

    if (advancedSettings.spoofCanvas) {
        injections.push({ script: spoofWebGL });
    }

    if (advancedSettings.spoofScreen) {
        const fakeScreenProps = getFakeScreenProperties(profileSettings);
        injections.push({ script: applyScreenSpoofing, args: [fakeScreenProps] });
    }

    if (injections.length > 0) {
        await this.scriptInjector.injectMultiple(tabId, injections);
    }

    await this.applyContentSettings(advancedSettings);
  }

  /**
   * Récupère les données de spoofing (depuis profil ou génération)
   * @param {object} profileSettings - Paramètres du profil
   * @param {object|null} currentProfile - Profil de session actuel
   * @returns {object} Données de spoofing
   */
  getSpoofingData(profileSettings, currentProfile) {
    if (this.settingsManager.get('useFixedProfile') && currentProfile) {
      return currentProfile.data;
    }
    // Génère des données à la volée pour les profils de session
    return {
      fakeNavigator: getFakeNavigatorProperties(profileSettings),
      fakeUserAgentData: getFakeUserAgentData(profileSettings, profileSettings.browser),
      fakeUserAgent: getFakeUserAgent(profileSettings),
      rules: getNewRules(profileSettings, 1)
    };
  }

  /**
   * Applique les règles de modification des en-têtes HTTP
   * @param {Array} rules - Règles à appliquer
   */
  async applyHttpRules(rules) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1], // ID de règle pour le spoofing standard
        addRules: rules,
      });
    } catch (error) {
      console.error('❌ Error applying HTTP rules:', error);
    }
  }

  /**
   * Applique les paramètres de contenu (blocage JS/images)
   * @param {object} advancedSettings - Paramètres de protection avancés
   */
  async applyContentSettings(advancedSettings) {
    try {
      await chrome.contentSettings.javascript.set({
        primaryPattern: '<all_urls>',
        setting: advancedSettings.blockJS ? 'block' : 'allow'
      });
      await chrome.contentSettings.images.set({
        primaryPattern: '<all_urls>',
        setting: advancedSettings.blockImages ? 'block' : 'allow'
      });
    } catch (error) {
      console.warn('⚠️ Could not apply content settings:', error.message);
    }
  }

  /**
   * Vérifie si une URL peut recevoir du spoofing
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  canSpoofUrl(url) {
    if (!url) return false;
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'about:', 'moz-extension://'];
    return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }
}
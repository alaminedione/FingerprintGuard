/**
 * Service de spoofing pour FingerprintGuard v2.1.0
 * Centralise toutes les opérations de spoofing
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
    this.scriptInjector = null;
    this.isInitialized = false;
  }

  /**
   * Initialise le service de spoofing
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔧 Initializing SpoofingService...');
      
      // Initialiser le ScriptInjector
      this.scriptInjector = new ScriptInjector();
      
      this.isInitialized = true;
      console.log('✅ SpoofingService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SpoofingService:', error);
      throw error;
    }
  }

  /**
   * Gestionnaire de changement de paramètre
   * @param {string} setting - Nom du paramètre
   * @param {*} value - Nouvelle valeur
   */
  async onSettingChanged(setting, value) {
    try {
      console.log(`🔄 Setting changed: ${setting} = ${value}`);
      
      // Réagir aux changements spécifiques
      if (setting === 'ghostMode' && value) {
        // Appliquer le mode fantôme à tous les onglets ouverts
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (this.canSpoofUrl(tab.url)) {
            await this.applyGhostMode(tab.id);
          }
        }
      }
      
      // Autres réactions selon les paramètres...
    } catch (error) {
      console.error('❌ Error handling setting change:', error);
    }
  }

  /**
   * Réinitialise le service après un changement de configuration
   */
  async reinitialize() {
    try {
      console.log('🔄 Reinitializing SpoofingService...');
      // Logique de réinitialisation si nécessaire
      console.log('✅ SpoofingService reinitialized');
    } catch (error) {
      console.error('❌ Error reinitializing SpoofingService:', error);
    }
  }

  /**
   * Prépare la navigation
   * @param {object} details - Détails de navigation
   */
  async prepareForNavigation(details) {
    try {
      console.log('🚀 Preparing for navigation:', details.url);
      // Logique de préparation si nécessaire
    } catch (error) {
      console.error('❌ Error preparing for navigation:', error);
    }
  }

  /**
   * Gère la navigation
   * @param {object} details - Détails de navigation
   */
  async handleNavigation(details) {
    try {
      if (!this.canSpoofUrl(details.url)) {
        console.debug('⚠️ Cannot spoof URL:', details.url);
        return;
      }

      console.log('🔄 Handling navigation for tab:', details.tabId);
      await this.applyAllProtections(details.tabId, details.url);
    } catch (error) {
      console.error('❌ Error handling navigation:', error);
    }
  }

  /**
   * Traite une requête web
   * @param {object} details - Détails de la requête
   * @returns {object} Résultat du traitement
   */
  async processWebRequest(details) {
    try {
      // Logique de traitement des requêtes web
      return { blocked: false };
    } catch (error) {
      console.error('❌ Error processing web request:', error);
      return { blocked: false };
    }
  }

  /**
   * Applique le profil actuel
   */
  async applyCurrentProfile() {
    try {
      const currentProfile = this.profileManager.getCurrent();
      if (currentProfile) {
        console.log('✅ Applying current profile:', currentProfile.id);
        // Logique d'application du profil
      }
    } catch (error) {
      console.error('❌ Error applying current profile:', error);
    }
  }

  /**
   * Applique le spoofing complet du navigateur
   * @param {number} tabId - ID de l'onglet
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async applyBrowserSpoofing(tabId) {
    try {
      console.log('🔄 Applying browser spoofing to tab:', tabId);
      
      const settings = this.settingsManager.getAll();
      const currentProfile = this.profileManager.getCurrent();

      // Générer ou récupérer les données de spoofing
      const spoofingData = this.getSpoofingData(settings, currentProfile);

      // Appliquer les règles de modification des en-têtes HTTP
      await this.applyHttpRules(spoofingData.rules);

      // Injecter les scripts de modification JavaScript
      const injections = [
        { script: applySpoofingNavigator, args: spoofingData.fakeNavigator },
        { script: applyUserAgentData, args: spoofingData.fakeUserAgentData },
        { script: applyUserAgent, args: spoofingData.fakeUserAgent }
      ];

      const success = await this.scriptInjector.injectMultiple(tabId, injections);
      
      if (success) {
        console.log('✅ Browser spoofing applied successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error applying browser spoofing:', error);
      return false;
    }
  }

  /**
   * Applique le spoofing du canvas
   * @param {number} tabId - ID de l'onglet
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async applyCanvasSpoofing(tabId) {
    try {
      console.log('🎨 Applying canvas spoofing to tab:', tabId);
      
      const injections = [
        { script: './spoofer/spoof-canvas.js' },
        { script: spoofWebGL }
      ];

      const success = await this.scriptInjector.injectMultiple(tabId, injections);
      
      if (success) {
        console.log('✅ Canvas spoofing applied successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error applying canvas spoofing:', error);
      return false;
    }
  }

  /**
   * Applique le spoofing de l'écran
   * @param {number} tabId - ID de l'onglet
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async applyScreenSpoofing(tabId) {
    try {
      console.log('📺 Applying screen spoofing to tab:', tabId);
      
      const settings = this.settingsManager.getAll();
      const fakeScreenProps = getFakeScreenProperties(settings);
      
      const success = await this.scriptInjector.inject(
        tabId, 
        applyScreenSpoofing, 
        fakeScreenProps
      );
      
      if (success) {
        console.log('✅ Screen spoofing applied successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error applying screen spoofing:', error);
      return false;
    }
  }

  /**
   * Applique le mode fantôme
   * @param {number} tabId - ID de l'onglet
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async applyGhostMode(tabId) {
    try {
      console.log('👻 Applying ghost mode to tab:', tabId);
      
      const success = await applyGhostMode(tabId);
      
      if (success) {
        console.log('✅ Ghost mode applied successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error applying ghost mode:', error);
      return false;
    }
  }

  /**
   * Applique les paramètres de contenu (blocage JS/images)
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async applyContentSettings() {
    try {
      const settings = this.settingsManager.getAll();
      let success = true;

      // Appliquer les paramètres JavaScript
      try {
        await chrome.contentSettings.javascript.set({
          primaryPattern: '<all_urls>',
          setting: settings.blockJS ? 'block' : 'allow'
        });
        console.log('✅ JavaScript setting applied:', settings.blockJS ? 'blocked' : 'allowed');
      } catch (error) {
        console.warn('⚠️ Cannot set JavaScript content setting:', error.message);
        success = false;
      }

      // Appliquer les paramètres d'images
      try {
        await chrome.contentSettings.images.set({
          primaryPattern: '<all_urls>',
          setting: settings.blockImages ? 'block' : 'allow'
        });
        console.log('✅ Images setting applied:', settings.blockImages ? 'blocked' : 'allowed');
      } catch (error) {
        console.warn('⚠️ Cannot set images content setting:', error.message);
        success = false;
      }

      return success;
    } catch (error) {
      console.error('❌ Error applying content settings:', error);
      return false;
    }
  }

  /**
   * Applique toutes les protections activées à un onglet
   * @param {number} tabId - ID de l'onglet
   * @param {string} url - URL de l'onglet
   * @returns {Promise<object>} Résultats des applications
   */
  async applyAllProtections(tabId, url) {
    const results = {
      ghostMode: false,
      browserSpoofing: false,
      canvasSpoofing: false,
      screenSpoofing: false,
      contentSettings: false
    };

    try {
      const settings = this.settingsManager.getAll();

      // Mode fantôme a priorité sur tout
      if (settings.ghostMode) {
        results.ghostMode = await this.applyGhostMode(tabId);
        return results;
      }

      // Supprimer les règles du mode fantôme si désactivé
      await this.clearGhostModeRules();

      // Appliquer les protections individuelles
      if (settings.spoofBrowser) {
        results.browserSpoofing = await this.applyBrowserSpoofing(tabId);
      }

      if (settings.spoofCanvas) {
        results.canvasSpoofing = await this.applyCanvasSpoofing(tabId);
      }

      if (settings.spoofScreen) {
        results.screenSpoofing = await this.applyScreenSpoofing(tabId);
      }

      // Paramètres de contenu (appliqués globalement)
      results.contentSettings = await this.applyContentSettings();

      const successCount = Object.values(results).filter(Boolean).length;
      console.log(`✅ Applied ${successCount}/${Object.keys(results).length} protections to tab ${tabId}`);

      return results;
    } catch (error) {
      console.error('❌ Error applying protections:', error);
      return results;
    }
  }

  /**
   * Récupère les données de spoofing (depuis profil ou génération)
   * @param {object} settings - Paramètres actuels
   * @param {object|null} currentProfile - Profil actuel
   * @returns {object} Données de spoofing
   */
  getSpoofingData(settings, currentProfile) {
    if (settings.useFixedProfile && currentProfile) {
      return {
        fakeNavigator: currentProfile.fakeNavigator,
        fakeUserAgentData: currentProfile.fakeUserAgentData,
        fakeUserAgent: currentProfile.fakeUserAgent,
        rules: currentProfile.rules
      };
    } else {
      return {
        fakeNavigator: getFakeNavigatorProperties(settings),
        fakeUserAgentData: getFakeUserAgentData(settings, settings.browser),
        fakeUserAgent: getFakeUserAgent(settings),
        rules: getNewRules(settings, 1)
      };
    }
  }

  /**
   * Applique les règles de modification des en-têtes HTTP
   * @param {Array} rules - Règles à appliquer
   */
  async applyHttpRules(rules) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: rules,
      });
      console.log('✅ HTTP header rules applied');
    } catch (error) {
      console.error('❌ Error applying HTTP rules:', error);
    }
  }

  /**
   * Supprime les règles du mode fantôme
   */
  async clearGhostModeRules() {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [999],
      });
      console.log('✅ Ghost mode rules cleared');
    } catch (error) {
      console.debug('No ghost mode rules to clear:', error.message);
    }
  }

  /**
   * Vérifie si une URL peut recevoir du spoofing
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  canSpoofUrl(url) {
    if (!url) return false;
    
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'about:',
      'moz-extension://'
    ];

    return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * Obtient les statistiques de spoofing
   * @returns {object}
   */
  getStats() {
    const settings = this.settingsManager.getAll();
    
    return {
      activeProtections: [
        settings.ghostMode && 'ghostMode',
        settings.spoofBrowser && 'browserSpoofing', 
        settings.spoofCanvas && 'canvasSpoofing',
        settings.spoofScreen && 'screenSpoofing',
        (settings.blockJS || settings.blockImages) && 'contentSettings'
      ].filter(Boolean),
      usingProfile: settings.useFixedProfile && this.profileManager.hasActive(),
      currentProfileId: this.profileManager.getCurrent()?.id || null
    };
  }
}
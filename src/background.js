/**
 * Background Script Refactorisé pour FingerprintGuard v2.1.0
 * Architecture modulaire et organisée
 */

import { SettingsManager } from './src/core/settings-manager.js';
import { ProfileManager } from './src/core/profile-manager.js';
import { ScriptInjector } from './src/core/script-injector.js';
import { SpoofingService } from './src/core/spoofing-service.js';

/**
 * Classe principale de l'extension FingerprintGuard
 */
class FingerprintGuard {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.profileManager = new ProfileManager(this.settingsManager);
    this.scriptInjector = new ScriptInjector();
    this.spoofingService = new SpoofingService(
      this.settingsManager, 
      this.profileManager, 
      this.scriptInjector
    );
    
    this.isInitialized = false;
    this.messageHandlers = this.createMessageHandlers();
  }

  /**
   * Initialise l'extension
   */
  async initialize() {
    try {
      console.log('🚀 Initializing FingerprintGuard v2.1.0...');
      
      // Initialiser les gestionnaires dans l'ordre
      await this.settingsManager.initialize();
      await this.profileManager.initialize();
      
      // Configurer les écouteurs d'événements
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ FingerprintGuard initialized successfully');
      
      // Afficher les statistiques de démarrage
      this.logStartupStats();
      
    } catch (error) {
      console.error('❌ Critical error during initialization:', error);
      await this.handleInitializationFailure(error);
    }
  }

  /**
   * Configure tous les écouteurs d'événements
   */
  setupEventListeners() {
    // Écouteur des changements de paramètres
    this.settingsManager.addListener((key, value, allSettings) => {
      this.handleSettingsChange(key, value, allSettings);
    });

    // Écouteur des changements dans le storage Chrome  
    chrome.storage.onChanged.addListener((changes) => {
      this.handleStorageChange(changes);
    });

    // Écouteur des messages runtime
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indique une réponse asynchrone
    });

    // Écouteur des navigations web
    chrome.webNavigation.onCommitted.addListener((details) => {
      this.handleNavigation(details);
    });

    // Écouteur des navigations avant chargement
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      this.handleBeforeNavigation(details);
    });

    // Écouteur des commandes clavier
    if (chrome.commands) {
      chrome.commands.onCommand.addListener((command) => {
        this.handleCommand(command);
      });
    }

    console.log('✅ Event listeners configured');
  }

  /**
   * Gère les changements de paramètres
   */
  async handleSettingsChange(key, value, allSettings) {
    try {
      // Actions spécifiques selon la clé modifiée
      if (key === 'activeProfileId' && allSettings.useFixedProfile) {
        await this.profileManager.activate(value);
      }

      // Rechargement automatique si activé
      await this.handleAutoReload();
      
      console.log(`⚙️ Setting change handled: ${key} = ${value}`);
    } catch (error) {
      console.error('❌ Error handling setting change:', error);
    }
  }

  /**
   * Gère les changements dans le storage Chrome
   */
  async handleStorageChange(changes) {
    for (let [key, { newValue }] of Object.entries(changes)) {
      if (this.settingsManager.get(key) !== undefined) {
        // Synchroniser avec le gestionnaire de paramètres
        this.settingsManager.settings[key] = newValue;
      }
    }
  }

  /**
   * Gère les messages de communication
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      if (!this.isInitialized) {
        sendResponse({ success: false, error: 'Extension not initialized' });
        return;
      }

      const handler = this.messageHandlers[message.type];
      if (!handler) {
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
        return;
      }

      const result = await handler(message, sender);
      sendResponse(result);
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Crée les gestionnaires de messages
   */
  createMessageHandlers() {
    return {
      // Statut de l'extension
      getStatus: async () => ({
        success: true,
        data: this.settingsManager.getAll()
      }),

      // Paramètres  
      getSettings: async () => ({
        success: true,
        data: this.settingsManager.getAll()
      }),

      updateSetting: async ({ setting, value }) => {
        const success = await this.settingsManager.set(setting, value);
        return { success };
      },

      updateSettings: async ({ settings }) => {
        const updatedKeys = await this.settingsManager.setMultiple(settings);
        return { success: true, updated: updatedKeys };
      },

      resetSettings: async () => {
        const success = await this.settingsManager.reset();
        return { success };
      },

      // Profils
      getProfiles: async () => ({
        success: true,
        data: this.profileManager.getAll()
      }),

      getActiveProfileId: async () => ({
        success: true,
        data: this.settingsManager.get('activeProfileId')
      }),

      generateNewProfile: async () => {
        const newProfile = this.profileManager.generate();
        const success = await this.profileManager.save(newProfile);
        return success ? { success: true, data: newProfile } : { success: false };
      },

      deleteProfile: async ({ id }) => {
        const success = await this.profileManager.delete(id);
        return { success };
      },

      activateProfile: async ({ id }) => {
        const success = await this.profileManager.activate(id);
        return { success };
      },

      deactivateProfile: async () => {
        const success = await this.profileManager.deactivate();
        return { success };
      },

      exportProfile: async ({ id }) => {
        const data = this.profileManager.export(id);
        return data ? { success: true, data } : { success: false, error: 'Profile not found' };
      },

      importProfile: async ({ data }) => {
        const profile = await this.profileManager.import(data);
        return profile ? { success: true, data: profile } : { success: false, error: 'Import failed' };
      },

      // Statistiques
      getStats: async () => ({
        success: true,
        data: {
          ...this.spoofingService.getStats(),
          totalProfiles: this.profileManager.getAll().length,
          injectorStats: this.scriptInjector.getStats()
        }
      })
    };
  }

  /**
   * Gère les navigations web
   */
  async handleNavigation(details) {
    try {
      // Ignorer les URLs système
      if (!this.spoofingService.canSpoofUrl(details.url)) {
        return;
      }

      console.log('🌐 Navigation detected:', details.url);

      // Appliquer les protections selon les paramètres
      const results = await this.spoofingService.applyAllProtections(details.tabId, details.url);
      
      const appliedProtections = Object.entries(results)
        .filter(([_, success]) => success)
        .map(([protection, _]) => protection);

      if (appliedProtections.length > 0) {
        console.log(`✅ Applied protections to ${details.url}:`, appliedProtections);
      }
    } catch (error) {
      console.error('❌ Error handling navigation:', error);
    }
  }

  /**
   * Gère les navigations avant chargement
   */
  async handleBeforeNavigation(details) {
    try {
      // Ignorer les URLs système
      if (!this.spoofingService.canSpoofUrl(details.url)) {
        return;
      }

      // Appliquer les paramètres de contenu (blocage JS/images)
      await this.spoofingService.applyContentSettings();
    } catch (error) {
      console.error('❌ Error handling before navigation:', error);
    }
  }

  /**
   * Gère les commandes clavier
   */
  async handleCommand(command) {
    try {
      console.log('⌨️ Keyboard command:', command);

      switch (command) {
        case 'toggle-ghost-mode':
          const currentGhostMode = this.settingsManager.get('ghostMode');
          await this.settingsManager.set('ghostMode', !currentGhostMode);
          break;

        case 'reload-all-tabs':
          await this.reloadAllTabs();
          break;

        case 'open-popup':
          // Cette commande ouvre automatiquement la popup
          break;

        default:
          console.warn('⚠️ Unknown command:', command);
      }
    } catch (error) {
      console.error('❌ Error handling command:', error);
    }
  }

  /**
   * Gère le rechargement automatique des onglets
   */
  async handleAutoReload() {
    try {
      const settings = this.settingsManager.getAll();
      
      if (settings.autoReloadAll) {
        await this.reloadAllTabs();
      } else if (settings.autoReloadCurrent) {
        await this.reloadCurrentTab();
      }
    } catch (error) {
      console.error('❌ Error with auto-reload:', error);
    }
  }

  /**
   * Recharge tous les onglets
   */
  async reloadAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      let reloadedCount = 0;
      
      for (const tab of tabs) {
        if (this.spoofingService.canSpoofUrl(tab.url)) {
          try {
            await chrome.tabs.reload(tab.id);
            reloadedCount++;
          } catch (error) {
            console.warn(`⚠️ Could not reload tab ${tab.id}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Reloaded ${reloadedCount} tabs`);
      return reloadedCount;
    } catch (error) {
      console.error('❌ Error reloading all tabs:', error);
      return 0;
    }
  }

  /**
   * Recharge l'onglet actuel
   */
  async reloadCurrentTab() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (activeTab && this.spoofingService.canSpoofUrl(activeTab.url)) {
        await chrome.tabs.reload(activeTab.id);
        console.log('✅ Current tab reloaded:', activeTab.url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error reloading current tab:', error);
      return false;
    }
  }

  /**
   * Gère les échecs d'initialisation
   */
  async handleInitializationFailure(error) {
    console.error('💥 Initialization failed, attempting recovery...');
    
    try {
      // Réinitialiser aux paramètres par défaut
      await this.settingsManager.reset();
      
      // Notification à l'utilisateur
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'FingerprintGuard Error',
          message: 'Extension failed to initialize. Settings reset to defaults.'
        });
      }
      
      // Nouvelle tentative d'initialisation
      await this.initialize();
    } catch (recoveryError) {
      console.error('💀 Recovery failed:', recoveryError);
    }
  }

  /**
   * Affiche les statistiques de démarrage
   */
  logStartupStats() {
    const stats = {
      settings: Object.keys(this.settingsManager.getAll()).length,
      profiles: this.profileManager.getAll().length,
      activeProfile: this.profileManager.getCurrent()?.id || 'None',
      spoofingStats: this.spoofingService.getStats()
    };
    
    console.log('📊 Startup Stats:', stats);
  }

  /**
   * Nettoie les ressources avant fermeture
   */
  async cleanup() {
    try {
      this.scriptInjector.clearQueue();
      console.log('🧹 Extension cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Initialisation de l'extension
console.log('🛡️ FingerprintGuard v2.1.0 starting...');
const fingerprintGuard = new FingerprintGuard();

// Lancer l'initialisation
fingerprintGuard.initialize().catch(error => {
  console.error('💥 Failed to start FingerprintGuard:', error);
});

// Cleanup lors de la fermeture
if (chrome.runtime.onSuspend) {
  chrome.runtime.onSuspend.addListener(() => {
    fingerprintGuard.cleanup();
  });
}

// Export pour les tests
globalThis.fingerprintGuard = fingerprintGuard;
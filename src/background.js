/**
 * Background Script for FingerprintGuard v3.0.0
 * Manages core services and responds to messages immediately.
 */

import { SettingsManager } from './core/settings-manager.js';
import { ProfileManager } from './core/profile-manager.js';
import { SpoofingService } from './core/spoofing-service.js';

class FingerprintGuard {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.profileManager = new ProfileManager(this.settingsManager);
    this.spoofingService = new SpoofingService(this.settingsManager, this.profileManager);

    this.messageHandlers = {
      'getSettings': this.handleGetSettings.bind(this),
      'updateSetting': this.handleUpdateSetting.bind(this),
      'reloadAllTabs': this.handleReloadAllTabs.bind(this),
    };

    // Lancer l'initialisation et stocker la promesse
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing FingerprintGuard v3.0.0...');
      await this.settingsManager.initialize();
      await this.profileManager.initialize();
      await this.spoofingService.initialize();
      this.setupEventListeners();
      console.log('✅ FingerprintGuard initialized successfully');
    } catch (error) {
      console.error('❌ FingerprintGuard initialization failed:', error);
    }
  }

  setupEventListeners() {
    // Écouter les changements de paramètres pour mettre à jour le spoofing
    this.settingsManager.onChanged(async (changes) => {
      console.log('⚙️ Settings changed, updating spoofing profile...', changes);
      await this.spoofingService.updateSpoofingProfile();
    });
  }

  // Le gestionnaire de messages attend la fin de l'initialisation
  async handleMessage(message, sender, sendResponse) {
    await this.initializationPromise;

    const handler = this.messageHandlers[message.type];
    if (handler) {
      handler(message.payload)
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    } else {
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    }
  }

  async handleGetSettings() {
    return this.settingsManager.getAll();
  }

  async handleUpdateSetting(payload) {
    await this.settingsManager.set(payload.key, payload.value);
    return { [payload.key]: payload.value };
  }

  async handleReloadAllTabs() {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
      try {
        await chrome.tabs.reload(tab.id);
      } catch (error) {
        console.warn(`Could not reload tab ${tab.id}: ${error.message}`);
      }
    }
    return { reloaded: tabs.length };
  }
}

// --- Point d'entrée du Service Worker ---

const guard = new FingerprintGuard();

// Enregistrer l'écouteur de messages de manière synchrone au plus haut niveau
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  guard.handleMessage(message, sender, sendResponse);
  return true; // Indique une réponse asynchrone
});

/**
 * Background Script for FingerprintGuard v3.0.0
 * Manages protection modes and core services.
 */

import { SettingsManager } from './core/settings-manager.js';
import { ProfileManager } from './core/profile-manager.js';
import { SpoofingService } from './core/spoofing-service.js';

class FingerprintGuard {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.profileManager = new ProfileManager(this.settingsManager);
    this.spoofingService = new SpoofingService(this.settingsManager, this.profileManager);
    this.isInitialized = false;

    this.messageHandlers = {
      'getSettings': this.handleGetSettings.bind(this),
      'updateSetting': this.handleUpdateSetting.bind(this),
      'reloadAllTabs': this.handleReloadAllTabs.bind(this),
    };

    // L'initialisation est maintenant gérée par l'écouteur de messages
    // this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return; // Empêcher la double initialisation
    try {
      console.log('🚀 Initializing FingerprintGuard v3.0.0...');
      await this.settingsManager.initialize();
      await this.profileManager.initialize();
      // Les écouteurs d'événements spécifiques au Service Worker sont configurés ici
      this.setupServiceWorkerEventListeners();
      this.isInitialized = true;
      console.log('✅ FingerprintGuard initialized successfully');
    } catch (error) {
      console.error('❌ FingerprintGuard initialization failed:', error);
    }
  }

  setupServiceWorkerEventListeners() {
    // Ces écouteurs sont liés au cycle de vie du Service Worker
    chrome.webNavigation.onCommitted.addListener(details => {
      if (details.frameId === 0) {
        this.spoofingService.applyProtectionsForTab(details.tabId, details.url);
      }
    });

    chrome.runtime.onStartup.addListener(() => {
        console.log('🌅 Browser startup detected, ensuring session profile is ready.');
        this.profileManager.handleSessionProfile();
    });

    chrome.runtime.onInstalled.addListener(details => {
        if (details.reason === 'install') {
            console.log('🎉 Welcome to FingerprintGuard! Setting up default configuration.');
        }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    // Assurez-vous que l'instance est initialisée avant de traiter le message
    await this.initialize();

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
    const { key, value } = payload;
    await this.settingsManager.set(key, value);
    // Si le mode de protection change, il faut peut-être régénérer le profil de session
    if (key === 'protectionMode') {
        await this.profileManager.handleSessionProfile();
    }
    return { [key]: value };
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

// Initialiser l'extension et configurer l'écouteur de messages au niveau supérieur
const guard = new FingerprintGuard();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  guard.handleMessage(message, sender, sendResponse);
  return true; // Nécessaire pour sendResponse asynchrone
});

// Pour le débogage
self.fingerprintGuard = guard;

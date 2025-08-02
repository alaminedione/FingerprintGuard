/**
 * Background Script for FingerprintGuard v3.0.0
 * Manages core services and responds to setting changes.
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
    };

    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;
    try {
      console.log('🚀 Initializing FingerprintGuard v3.0.0...');
      await this.settingsManager.initialize();
      await this.profileManager.initialize();
      await this.spoofingService.initialize(); // Initialise le service de spoofing
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('✅ FingerprintGuard initialized successfully');
    } catch (error) {
      console.error('❌ FingerprintGuard initialization failed:', error);
    }
  }

  setupEventListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Pour sendResponse asynchrone
    });

    // Écouter les changements de paramètres pour mettre à jour le spoofing
    this.settingsManager.onChanged(async (changes) => {
        console.log('⚙️ Settings changed, updating spoofing profile...', changes);
        await this.spoofingService.updateSpoofingProfile();
    });
  }

  async handleMessage(message, sender, sendResponse) {
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
    // La logique de mise à jour est maintenant dans le SettingsManager
    // qui notifiera le changement via l'événement onChanged.
    await this.settingsManager.set(payload.key, payload.value);
    return { [payload.key]: payload.value };
  }
}

new FingerprintGuard();
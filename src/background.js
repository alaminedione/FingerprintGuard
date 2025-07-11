/**
 * Background Script for FingerprintGuard v2.1.0
 * Service Worker with complete functionality and error handling
 */

import { SettingsManager } from './core/settings-manager.js';
import { ProfileManager } from './core/profile-manager.js';
import { ScriptInjector } from './core/script-injector.js';
import { SpoofingService } from './core/spoofing-service.js';

class FingerprintGuard {
  constructor() {
    this.settingsManager = null;
    this.profileManager = null;
    this.scriptInjector = null;
    this.spoofingService = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.messageQueue = [];
    this.stats = {
      activeProtections: 0,
      blockedRequests: 0,
      spoofedData: 0,
      sessionsCount: 0
    };

    this.messageHandlers = {
      'getStatus': this.handleGetStatus.bind(this),
      'updateSetting': this.handleUpdateSetting.bind(this),
      'reloadAllTabs': this.handleReloadAllTabs.bind(this),
      'getStats': this.handleGetStats.bind(this),
      'resetStats': this.handleResetStats.bind(this),
      'exportSettings': this.handleExportSettings.bind(this),
      'importSettings': this.handleImportSettings.bind(this),
      'getProfiles': this.handleGetProfiles.bind(this),
      'createProfile': this.handleCreateProfile.bind(this),
      'deleteProfile': this.handleDeleteProfile.bind(this),
      'switchProfile': this.handleSwitchProfile.bind(this),
      'generateNewProfile': this.handleGenerateNewProfile.bind(this),
      'generateProfile': this.handleGenerateProfile.bind(this),
      'deactivateJustProtectMe': this.handleDeactivateJustProtectMe.bind(this),
      'regenerateProfile': this.handleRegenerateProfile.bind(this),
      'ping': this.handlePing.bind(this)
    };

    // Démarrer l'initialisation
    this.initialize();
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('🚀 Initializing FingerprintGuard...');

      // Initialiser les managers
      this.settingsManager = new SettingsManager();
      await this.settingsManager.initialize();

      this.profileManager = new ProfileManager(this.settingsManager);
      await this.profileManager.initialize();

      this.scriptInjector = new ScriptInjector();
      
      this.spoofingService = new SpoofingService(this.settingsManager, this.profileManager);
      await this.spoofingService.initialize();

      // Configurer les écouteurs d'événements
      this.setupEventListeners();

      // Mettre à jour les statistiques
      this.updateStats();

      this.isInitialized = true;
      console.log('✅ FingerprintGuard initialized successfully');

      // Traiter les messages en attente
      this.processQueuedMessages();

      return true;
    } catch (error) {
      console.error('❌ FingerprintGuard initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  setupEventListeners() {
    // Gestionnaire de messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Garder le canal ouvert pour les réponses asynchrones
    });

    // Événements de navigation
    if (chrome.webNavigation) {
      chrome.webNavigation.onBeforeNavigate.addListener((details) => {
        if (details.frameId === 0) {
          this.handleBeforeNavigate(details);
        }
      });

      chrome.webNavigation.onCommitted.addListener((details) => {
        if (details.frameId === 0) {
          this.handleNavigationCommitted(details);
        }
      });
    }

    // Événements de requête web
    if (chrome.webRequest) {
      chrome.webRequest.onBeforeRequest.addListener(
        (details) => this.handleWebRequest(details),
        { urls: ['<all_urls>'] },
        ['blocking']
      );
    }

    // Événements d'installation et mise à jour
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    // Événements de démarrage
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    // Commandes clavier
    if (chrome.commands) {
      chrome.commands.onCommand.addListener((command) => {
        this.handleCommand(command);
      });
    }

    // Événements d'alarme
    if (chrome.alarms) {
      chrome.alarms.onAlarm.addListener((alarm) => {
        this.handleAlarm(alarm);
      });
    }
  }

  async handleMessage(message, sender, sendResponse) {
    if (!this.isInitialized) {
      // Mettre le message en file d'attente
      this.messageQueue.push({ message, sender, sendResponse });
      
      // Attendre l'initialisation avec timeout
      try {
        await Promise.race([
          this.initialize(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Initialization timeout')), 5000))
        ]);
        
        // Traiter le message maintenant
        return this.processMessage(message, sender, sendResponse);
      } catch (error) {
        console.error('❌ Failed to initialize for message processing:', error);
        sendResponse({ success: false, error: 'Service temporarily unavailable' });
        return;
      }
    }

    return this.processMessage(message, sender, sendResponse);
  }

  async processMessage(message, sender, sendResponse) {
    try {
      if (!message?.type) {
        return sendResponse({ success: false, error: 'Invalid message format' });
      }

      const handler = this.messageHandlers[message.type];
      if (!handler) {
        return sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      }

      const response = await handler(message, sender);
      sendResponse(response);
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  processQueuedMessages() {
    while (this.messageQueue.length > 0) {
      const { message, sender, sendResponse } = this.messageQueue.shift();
      this.processMessage(message, sender, sendResponse);
    }
  }

  // Gestionnaires de messages
  async handleGetStatus(message, sender) {
    try {
      const settings = this.settingsManager.getAll();
      const stats = { ...this.stats };
      
      return {
        success: true,
        data: {
          ...settings,
          stats,
          isInitialized: this.isInitialized
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleUpdateSetting(message, sender) {
    try {
      const { setting, value } = message;
      
      if (!setting) {
        throw new Error('Setting parameter is required');
      }
      
      const success = await this.settingsManager.set(setting, value);
      
      if (success && this.spoofingService) {
        // Notifier le service de spoofing des changements
        await this.spoofingService.onSettingChanged(setting, value);
        this.updateStats();
      }
      
      return { success };
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      return { success: false, error: error.message };
    }
  }

  async handleReloadAllTabs(message, sender) {
    try {
      const tabs = await chrome.tabs.query({});
      const reloadPromises = tabs.map(tab => 
        chrome.tabs.reload(tab.id).catch(err => 
          console.warn(`Failed to reload tab ${tab.id}:`, err)
        )
      );
      
      await Promise.allSettled(reloadPromises);
      
      return { success: true, reloadedTabs: tabs.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleGetStats(message, sender) {
    return { success: true, data: { ...this.stats } };
  }

  async handleResetStats(message, sender) {
    this.stats = {
      activeProtections: 0,
      blockedRequests: 0,
      spoofedData: 0,
      sessionsCount: this.stats.sessionsCount
    };
    return { success: true };
  }

  async handleExportSettings(message, sender) {
    try {
      const exportData = this.settingsManager.export();
      return { success: true, data: exportData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleImportSettings(message, sender) {
    try {
      const success = await this.settingsManager.import(message.data);
      if (success) {
        await this.spoofingService.reinitialize();
        this.updateStats();
      }
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleGetProfiles(message, sender) {
    try {
      const profiles = await this.profileManager.getAllProfiles();
      return { success: true, data: profiles };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleCreateProfile(message, sender) {
    try {
      const profile = await this.profileManager.createProfile(message.profileData);
      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleDeleteProfile(message, sender) {
    try {
      const success = await this.profileManager.deleteProfile(message.profileId);
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleSwitchProfile(message, sender) {
    try {
      const success = await this.profileManager.activate(message.profileId);
      if (success) {
        await this.spoofingService.applyCurrentProfile();
        this.updateStats();
      }
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleGenerateNewProfile(message, sender) {
    try {
      // If this is for Just Protect Me, temporarily apply the temp settings
      if (message.justProtectMe && message.tempSettings) {
        // Backup current settings
        const originalSettings = this.settingsManager.getAll();
        
        // Apply temp settings for profile generation
        for (const [key, value] of Object.entries(message.tempSettings)) {
          await this.settingsManager.set(key, value);
        }
        
        // Generate profile with temp settings
        const profile = this.profileManager.generate();
        
        // Add Just Protect Me metadata
        profile.metadata = {
          ...profile.metadata,
          justProtectMe: true,
          protectionLevel: message.tempSettings.advancedProtection ? 'high' : 'medium',
          generatedAt: new Date().toISOString()
        };
        
        // Save the profile
        await this.profileManager.save(profile);
        
        // Activate the profile
        await this.profileManager.activate(profile.id);
        await this.spoofingService.applyCurrentProfile();
        
        // Restore original settings
        for (const [key, value] of Object.entries(originalSettings)) {
          await this.settingsManager.set(key, value);
        }
        
        this.updateStats();
        return { success: true, data: profile };
      } else {
        // Regular profile generation
        const profile = this.profileManager.generate();
        await this.profileManager.save(profile);
        this.updateStats();
        return { success: true, data: profile };
      }
    } catch (error) {
      console.error('❌ Error generating new profile:', error);
      return { success: false, error: error.message };
    }
  }

  async handlePing(message, sender) {
    return { success: true, pong: true, timestamp: Date.now() };
  }

  async handleGenerateProfile(request) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { protectionLevel, selectedOS, selectedOSVersion, selectedBrowser, selectedBrowserVersion } = request;

      // Validate required parameters
      if (!protectionLevel || !selectedOS || !selectedBrowser) {
        throw new Error('Missing required parameters for profile generation');
      }

      // Save current settings
      const originalSettings = this.settingsManager.getAll();

      // Create temporary settings based on Just Protect Me parameters
      const tempSettings = {
        ...originalSettings,
        // Map protection level to specific settings
        advancedProtection: {
          canvasFingerprinting: protectionLevel !== 'low',
          webglFingerprinting: protectionLevel === 'high',
          audioFingerprinting: protectionLevel !== 'low',
          webrtcProtection: protectionLevel === 'high',
          timezoneSpoof: protectionLevel !== 'low',
          languageSpoof: protectionLevel === 'high',
          screenResolutionSpoof: protectionLevel !== 'low'
        },
        // Set OS and browser preferences
        platform: selectedOS === 'Windows' ? 'Win32' : 
                  selectedOS === 'macOS' ? 'MacIntel' : 
                  selectedOS === 'Linux' ? 'Linux x86_64' : 'Win32',
        browser: selectedBrowser.toLowerCase(),
        osVersion: selectedOSVersion,
        browserVersion: selectedBrowserVersion
      };

      // Temporarily apply settings
      await this.settingsManager.setMultiple(tempSettings);

      // Generate profile using ProfileManager
      const profileData = await this.profileManager.generate();

      // Restore original settings
      await this.settingsManager.setMultiple(originalSettings);

      if (!profileData) {
        throw new Error('Failed to generate profile');
      }

      return {
        success: true,
        profile: profileData
      };
    } catch (error) {
      console.error('❌ Error generating profile:', error);
      return { success: false, error: error.message };
    }
  }

  async handleDeactivateJustProtectMe(message, sender) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🛑 Deactivating Just Protect Me mode...');

      // Deactivate ghost mode
      await this.settingsManager.set('ghostMode', false);
      
      // Deactivate Just Protect Me auto profile
      await this.settingsManager.set('justProtectMe.autoProfile', false);

      // Update extension badge to reflect deactivated state
      await this.updateExtensionBadge();

      console.log('✅ Just Protect Me mode deactivated successfully');

      return {
        success: true,
        message: 'Just Protect Me mode deactivated successfully'
      };
    } catch (error) {
      console.error('❌ Error deactivating Just Protect Me mode:', error);
      return { success: false, error: error.message };
    }
  }

  async handleRegenerateProfile(message, sender) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 Regenerating ghost mode profile...');

      // Generate new profile
      const profileData = await this.profileManager.generate();

      if (!profileData) {
        throw new Error('Failed to generate new profile');
      }

      // Update extension badge to reflect current state
      await this.updateExtensionBadge();

      console.log('✅ Ghost mode profile regenerated successfully');

      return {
        success: true,
        profile: profileData,
        message: 'Ghost mode profile regenerated successfully'
      };
    } catch (error) {
      console.error('❌ Error regenerating profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Gestionnaires d'événements
  async handleBeforeNavigate(details) {
    try {
      if (this.isInitialized) {
        await this.spoofingService.prepareForNavigation(details);
      }
    } catch (error) {
      console.error('❌ Error in handleBeforeNavigate:', error);
    }
  }

  async handleNavigationCommitted(details) {
    try {
      if (this.isInitialized) {
        await this.spoofingService.handleNavigation(details);
        await this.scriptInjector.injectScripts(details.tabId, details.url);
        this.stats.spoofedData++;
      }
    } catch (error) {
      console.error('❌ Error in handleNavigationCommitted:', error);
    }
  }

  async handleWebRequest(details) {
    try {
      if (this.isInitialized) {
        const result = await this.spoofingService.processWebRequest(details);
        if (result.blocked) {
          this.stats.blockedRequests++;
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Error in handleWebRequest:', error);
    }
    return {};
  }

  async handleInstalled(details) {
    console.log('🎉 FingerprintGuard installed/updated:', details.reason);
    
    if (details.reason === 'install') {
      // Première installation
      this.stats.sessionsCount = 1;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'FingerprintGuard Installé',
        message: 'Protection contre le fingerprinting activée!'
      });
    } else if (details.reason === 'update') {
      // Mise à jour
      console.log(`Updated from version ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
    }
  }

  async handleStartup() {
    console.log('🚀 FingerprintGuard startup');
    this.stats.sessionsCount++;
    
    // Programmer les alarmes périodiques
    chrome.alarms.create('updateStats', { periodInMinutes: 5 });
  }

  async handleCommand(command) {
    try {
      switch (command) {
        case 'toggle-ghost-mode':
          const currentMode = this.settingsManager.get('ghostMode');
          await this.settingsManager.set('ghostMode', !currentMode);
          break;
        
        case 'reload-all-tabs':
          await this.handleReloadAllTabs({}, null);
          break;
        
        case 'open-popup':
          // La popup s'ouvre automatiquement via le manifest
          break;
      }
    } catch (error) {
      console.error('❌ Error handling command:', error);
    }
  }

  async handleAlarm(alarm) {
    try {
      switch (alarm.name) {
        case 'updateStats':
          this.updateStats();
          break;
      }
    } catch (error) {
      console.error('❌ Error handling alarm:', error);
    }
  }

  updateStats() {
    if (!this.isInitialized) return;
    
    const settings = this.settingsManager.getAll();
    this.stats.activeProtections = Object.values(settings).filter(v => v === true).length;
  }

  async updateExtensionBadge() {
    try {
      if (!this.isInitialized) return;
      
      const settings = this.settingsManager.getAll();
      const isGhostMode = settings.ghostMode;
      const isJustProtectMe = settings['justProtectMe.autoProfile'];
      
      // Set badge text based on current state
      let badgeText = '';
      let badgeColor = '#666666'; // Default gray
      
      if (isGhostMode || isJustProtectMe) {
        badgeText = '👻'; // Ghost emoji for ghost mode
        badgeColor = '#9333ea'; // Purple for active ghost mode
      } else if (this.stats.activeProtections > 0) {
        badgeText = '🛡️'; // Shield emoji for normal protection
        badgeColor = '#059669'; // Green for active protection
      }
      
      // Update badge using chrome.action API (Manifest V3)
      if (chrome.action) {
        await chrome.action.setBadgeText({ text: badgeText });
        await chrome.action.setBadgeBackgroundColor({ color: badgeColor });
      }
      
    } catch (error) {
      console.error('❌ Error updating extension badge:', error);
    }
  }
}

// Service Worker Event Listeners
self.addEventListener('install', (event) => {
  console.log('✅ FingerprintGuard Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ FingerprintGuard Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Initialiser FingerprintGuard
const fingerprintGuard = new FingerprintGuard();

// Export pour debugging
self.fingerprintGuard = fingerprintGuard;

console.log('🔄 FingerprintGuard Background Script loaded');
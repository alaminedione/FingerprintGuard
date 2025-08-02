/**
 * Service de spoofing pour FingerprintGuard v3.0.0
 * Centralise toutes les opérations de spoofing en fonction du mode de protection
 */

import { generateCoherentProfile } from '../spoofing/spoofing-data.js';
import {
  applySpoofingNavigator,
  applyUserAgentData,
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

  async applyProtectionsForTab(tabId, url) {
    if (!this.canSpoofUrl(url)) return;

    const settings = this.settingsManager.getAll();
    const { protectionMode } = settings;

    switch (protectionMode) {
      case 'lucky':
        await this.applyLuckyMode(tabId);
        break;
      case 'advanced':
        await this.applyAdvancedMode(tabId, settings);
        break;
      case 'ghost':
        await this.applyGhostMode(tabId);
        break;
      case 'none':
        console.log(`🚫 Protection disabled for tab: ${tabId}`);
        break;
    }
  }

  async applyLuckyMode(tabId) {
    console.log(`🍀 Applying Lucky Mode to tab: ${tabId}`);
    // En mode Lucky, on génère un profil aléatoire complet sans config spécifique.
    const profile = generateCoherentProfile(); 
    await this.applyAllSpoofing(tabId, { spoofBrowser: true, spoofCanvas: true, spoofScreen: true }, profile);
  }

  async applyAdvancedMode(tabId, settings) {
    console.log(`⚙️ Applying Advanced Mode to tab: ${tabId}`);
    const profile = this.getSpoofingProfile(settings.profile);
    await this.applyAllSpoofing(tabId, settings.advancedSettings, profile);
  }

  async applyGhostMode(tabId) {
    console.log(`👻 Applying Ghost Mode to tab: ${tabId}`);
    await this.scriptInjector.inject(tabId, applyGhostMode);
  }

  getSpoofingProfile(profileSettings) {
    const useFixed = this.settingsManager.get('useFixedProfile');
    const current = this.profileManager.getCurrent();
    if (useFixed && current) {
      return current.data;
    }
    return generateCoherentProfile(profileSettings);
  }

  async applyAllSpoofing(tabId, advancedSettings, profile) {
    const injections = [];

    if (advancedSettings.spoofBrowser) {
      injections.push({ script: applySpoofingNavigator, args: [profile.fakeNavigator] });
      // N'injecter les userAgentData que pour les navigateurs Chromium
      if (profile.fakeNavigator.vendor === 'Google Inc.') {
          injections.push({ script: applyUserAgentData, args: [profile.fakeUserAgentData] });
      }
      await this.applyHttpRules(profile.rules);
    }

    if (advancedSettings.spoofCanvas) {
      injections.push({ script: spoofWebGL });
    }

    if (advancedSettings.spoofScreen) {
      injections.push({ script: applyScreenSpoofing, args: [profile.fakeScreenProperties] });
    }

    if (injections.length > 0) {
      await this.scriptInjector.injectMultiple(tabId, injections);
    }

    await this.applyContentSettings(advancedSettings);
  }

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

  canSpoofUrl(url) {
    if (!url) return false;
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'about:', 'moz-extension://'];
    return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }
}

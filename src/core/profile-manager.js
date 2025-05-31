/**
 * Gestionnaire des profils pour FingerprintGuard v2.1.0
 * Gère la création, validation, stockage et utilisation des profils de spoofing
 */

import { getFakeNavigatorProperties, getFakeUserAgentData, getFakeUserAgent, getFakeScreenProperties, getNewRules } from '../spoofing/spoofing-data.js';

export class ProfileManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.profiles = [];
    this.currentProfile = null;
  }

  /**
   * Initialise le gestionnaire de profils
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('👤 Initializing ProfileManager...');
      
      // Charger les profils stockés
      const storedProfiles = await chrome.storage.local.get('profiles');
      this.profiles = Array.isArray(storedProfiles.profiles) ? storedProfiles.profiles : [];
      
      // Charger le profil actif
      const activeProfileId = this.settingsManager.get('activeProfileId');
      if (activeProfileId) {
        this.currentProfile = this.getById(activeProfileId);
        if (!this.currentProfile) {
          console.warn('⚠️ Active profile not found, resetting to null');
          await this.settingsManager.set('activeProfileId', null);
        }
      }

      // Gérer le profil de démarrage si nécessaire
      if (this.settingsManager.get('useFixedProfile')) {
        await this.handleStartupProfile();
      }

      console.log(`✅ ProfileManager initialized with ${this.profiles.length} profiles`);
    } catch (error) {
      console.error('❌ Error initializing ProfileManager:', error);
      this.profiles = [];
      this.currentProfile = null;
    }
  }

  /**
   * Gère la création d'un profil au démarrage si nécessaire
   * @returns {Promise<void>}
   */
  async handleStartupProfile() {
    try {
      if (this.settingsManager.get('generateNewProfileOnStart')) {
        if (!this.currentProfile) {
          this.currentProfile = this.generate();
          await this.settingsManager.set('activeProfileId', this.currentProfile.id);
          await this.save(this.currentProfile);
          console.log('✅ New profile generated on startup');
        }
      } else if (!this.currentProfile) {
        // Créer un profil de fallback
        this.currentProfile = this.generate();
        await this.settingsManager.set('activeProfileId', this.currentProfile.id);
        await this.save(this.currentProfile);
        console.log('✅ Fallback profile created');
      }
    } catch (error) {
      console.error('❌ Error handling startup profile:', error);
      // Désactiver le mode profil fixe en cas d'erreur
      await this.settingsManager.set('useFixedProfile', false);
      this.currentProfile = null;
    }
  }

  /**
   * Génère un nouveau profil
   * @returns {object} Nouveau profil généré
   */
  generate() {
    try {
      const profileId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const settings = this.settingsManager.getAll();
      
      const profile = {
        id: profileId,
        createdAt: new Date().toISOString(),
        version: '2.1.0',
        fakeNavigator: getFakeNavigatorProperties(settings),
        fakeUserAgentData: getFakeUserAgentData(settings, settings.browser),
        fakeUserAgent: getFakeUserAgent(settings),
        fakeScreen: getFakeScreenProperties(settings),
        rules: getNewRules(settings, 1),
        metadata: {
          generatedWith: settings.browser || 'random',
          platform: settings.platform || 'random',
          language: settings.language || 'random'
        }
      };

      if (!this.validate(profile)) {
        throw new Error('Generated profile failed validation');
      }

      console.log('✅ New profile generated:', profileId);
      return profile;
      
    } catch (error) {
      console.error('❌ Error generating profile:', error);
      
      // Profil de fallback minimal
      return {
        id: `fallback_${Date.now()}`,
        createdAt: new Date().toISOString(),
        version: '2.1.0',
        fakeNavigator: {
          platform: 'Win32',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          language: 'en-US',
          hardwareConcurrency: 4,
          deviceMemory: 8
        },
        fakeUserAgentData: {
          brands: [{ brand: 'Chrome', version: '120' }],
          mobile: false,
          platform: 'Windows'
        },
        fakeUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        fakeScreen: {
          width: 1920,
          height: 1080,
          availWidth: 1920,
          availHeight: 1040,
          colorDepth: 24,
          pixelDepth: 24,
          devicePixelRatio: 1
        },
        rules: [],
        metadata: { fallback: true }
      };
    }
  }

  /**
   * Valide un profil
   * @param {object} profile - Profil à valider
   * @returns {boolean} True si valide
   */
  validate(profile) {
    if (!profile || typeof profile !== 'object') return false;
    if (!profile.id || typeof profile.id !== 'string') return false;
    if (!profile.createdAt) return false;
    if (!profile.fakeNavigator || typeof profile.fakeNavigator !== 'object') return false;
    if (!profile.fakeUserAgent || typeof profile.fakeUserAgent !== 'string') return false;
    if (!profile.fakeScreen || typeof profile.fakeScreen !== 'object') return false;
    return true;
  }

  /**
   * Sauvegarde un profil
   * @param {object} profile - Profil à sauvegarder
   * @returns {Promise<boolean>} Succès de la sauvegarde
   */
  async save(profile) {
    try {
      if (!this.validate(profile)) {
        throw new Error('Invalid profile data');
      }

      // Éviter les doublons
      const existingIndex = this.profiles.findIndex(p => p.id === profile.id);
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = profile;
      } else {
        this.profiles.push(profile);
        
        // Limiter à 50 profils maximum
        if (this.profiles.length > 50) {
          this.profiles = this.profiles.slice(-50);
          console.log('⚠️ Profile limit reached, removed oldest profiles');
        }
      }

      await chrome.storage.local.set({ profiles: this.profiles });
      console.log('✅ Profile saved:', profile.id);
      return true;
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      return false;
    }
  }

  /**
   * Récupère un profil par ID
   * @param {string} profileId - ID du profil
   * @returns {object|null} Profil trouvé ou null
   */
  getById(profileId) {
    return this.profiles.find(profile => profile.id === profileId) || null;
  }

  /**
   * Récupère tous les profils
   * @returns {Array} Liste de tous les profils
   */
  getAll() {
    return [...this.profiles];
  }

  /**
   * Supprime un profil
   * @param {string} profileId - ID du profil à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async delete(profileId) {
    try {
      const profileIndex = this.profiles.findIndex(profile => profile.id === profileId);
      
      if (profileIndex === -1) {
        throw new Error('Profile not found');
      }
      
      // Si on supprime le profil actif, le désactiver
      if (this.settingsManager.get('activeProfileId') === profileId) {
        await this.settingsManager.set('activeProfileId', null);
        this.currentProfile = null;
        console.log('⚠️ Active profile deleted, reset to null');
      }
      
      this.profiles.splice(profileIndex, 1);
      await chrome.storage.local.set({ profiles: this.profiles });
      console.log('✅ Profile deleted:', profileId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting profile:', error);
      return false;
    }
  }

  /**
   * Exporte un profil
   * @param {string} profileId - ID du profil à exporter
   * @returns {object|null} Données d'export ou null
   */
  export(profileId) {
    const profile = this.getById(profileId);
    if (!profile) return null;

    return {
      ...profile,
      exportedAt: new Date().toISOString(),
      exportedFrom: 'FingerprintGuard v2.1.0'
    };
  }

  /**
   * Importe un profil
   * @param {object} profileData - Données du profil à importer
   * @returns {Promise<object|null>} Profil importé ou null
   */
  async import(profileData) {
    try {
      if (!this.validate(profileData)) {
        throw new Error('Invalid profile data');
      }

      // Générer un nouvel ID pour éviter les conflits
      profileData.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      profileData.importedAt = new Date().toISOString();

      const success = await this.save(profileData);
      if (success) {
        console.log('✅ Profile imported:', profileData.id);
        return profileData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error importing profile:', error);
      return null;
    }
  }

  /**
   * Active un profil
   * @param {string} profileId - ID du profil à activer
   * @returns {Promise<boolean>} Succès de l'activation
   */
  async activate(profileId) {
    try {
      const profile = this.getById(profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      this.currentProfile = profile;
      await this.settingsManager.set('activeProfileId', profileId);
      console.log('✅ Profile activated:', profileId);
      return true;
    } catch (error) {
      console.error('❌ Error activating profile:', error);
      return false;
    }
  }

  /**
   * Désactive le profil actuel
   * @returns {Promise<boolean>} Succès de la désactivation
   */
  async deactivate() {
    try {
      this.currentProfile = null;
      await this.settingsManager.set('activeProfileId', null);
      console.log('✅ Profile deactivated');
      return true;
    } catch (error) {
      console.error('❌ Error deactivating profile:', error);
      return false;
    }
  }

  /**
   * Récupère le profil actuellement actif
   * @returns {object|null} Profil actif ou null
   */
  getCurrent() {
    return this.currentProfile;
  }

  /**
   * Vérifie si un profil est actif
   * @returns {boolean} True si un profil est actif
   */
  hasActive() {
    return this.currentProfile !== null;
  }
}
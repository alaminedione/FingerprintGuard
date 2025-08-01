/**
 * Gestionnaire des profils pour FingerprintGuard v3.0.0
 * Gère la création, la validation et l'utilisation des profils de session et fixes.
 */

import { getFakeNavigatorProperties, getFakeUserAgentData, getFakeUserAgent, getFakeScreenProperties, getNewRules } from '../spoofing/spoofing-data.js';

export class ProfileManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.profiles = []; // Pour les profils fixes sauvegardés
    this.sessionProfile = null; // Pour le profil généré par session
  }

  /**
   * Initialise le gestionnaire de profils.
   * Charge les profils fixes et crée un profil de session si nécessaire.
   */
  async initialize() {
    console.log('👤 Initializing ProfileManager...');
    // Charger les profils fixes stockés
    const stored = await chrome.storage.local.get('profiles');
    this.profiles = Array.isArray(stored.profiles) ? stored.profiles : [];

    // Gérer le profil de session
    await this.handleSessionProfile();
    console.log(`✅ ProfileManager initialized with ${this.profiles.length} saved profiles.`);
  }

  /**
   * Gère le profil de la session actuelle.
   * Crée un nouveau profil de session si aucun n'existe.
   */
  async handleSessionProfile() {
    const { protectionMode, generateNewProfileOnStart } = this.settingsManager.getAll();

    if (protectionMode === 'ghost') {
        this.sessionProfile = null; // Pas de profil en mode Ghost
        return;
    }

    if (generateNewProfileOnStart || !this.sessionProfile) {
        console.log('🔄 Generating new session profile...');
        this.sessionProfile = this.generateSessionProfile();
    }
  }

  /**
   * Génère un profil de session unique.
   * @returns {object} Le profil de session généré.
   */
  generateSessionProfile() {
    const profileSettings = this.settingsManager.get('profile');
    const data = {
        fakeNavigator: getFakeNavigatorProperties(profileSettings),
        fakeUserAgentData: getFakeUserAgentData(profileSettings, profileSettings.browser),
        fakeUserAgent: getFakeUserAgent(profileSettings),
        fakeScreen: getFakeScreenProperties(profileSettings),
        rules: getNewRules(profileSettings, 1),
    };

    return {
        id: `session_${Date.now()}`,
        isSession: true,
        createdAt: new Date().toISOString(),
        data: data
    };
  }

  /**
   * Récupère le profil actuellement applicable.
   * @returns {object|null} Le profil à utiliser (session ou fixe).
   */
  getCurrent() {
    const { useFixedProfile, activeProfileId } = this.settingsManager.getAll();

    if (useFixedProfile && activeProfileId) {
      const fixedProfile = this.getById(activeProfileId);
      if (fixedProfile) return fixedProfile;
    }

    return this.sessionProfile;
  }

  /**
   * Crée et sauvegarde un nouveau profil fixe.
   * @returns {Promise<object>} Le profil fixe créé.
   */
  async createFixedProfile() {
    const profileSettings = this.settingsManager.get('profile');
    const data = {
        fakeNavigator: getFakeNavigatorProperties(profileSettings),
        fakeUserAgentData: getFakeUserAgentData(profileSettings, profileSettings.browser),
        fakeUserAgent: getFakeUserAgent(profileSettings),
        fakeScreen: getFakeScreenProperties(profileSettings),
        rules: getNewRules(profileSettings, 1),
    };

    const newProfile = {
        id: `fixed_${Date.now()}`,
        isSession: false,
        createdAt: new Date().toISOString(),
        name: `Profil ${this.profiles.length + 1}`,
        data: data
    };

    this.profiles.push(newProfile);
    await this.saveProfilesToStorage();
    return newProfile;
  }

  /**
   * Sauvegarde tous les profils fixes dans le stockage local.
   */
  async saveProfilesToStorage() {
    await chrome.storage.local.set({ profiles: this.profiles });
  }

  /**
   * Récupère un profil fixe par son ID.
   * @param {string} profileId - L'ID du profil.
   * @returns {object|null} Le profil trouvé.
   */
  getById(profileId) {
    return this.profiles.find(p => p.id === profileId) || null;
  }

  /**
   * Récupère tous les profils fixes.
   * @returns {Array} La liste des profils fixes.
   */
  getAllFixed() {
    return [...this.profiles];
  }

  /**
   * Supprime un profil fixe.
   * @param {string} profileId - L'ID du profil à supprimer.
   */
  async deleteFixedProfile(profileId) {
    this.profiles = this.profiles.filter(p => p.id !== profileId);
    await this.saveProfilesToStorage();

    // Si le profil supprimé était actif, désactivez le mode de profil fixe.
    if (this.settingsManager.get('activeProfileId') === profileId) {
        await this.settingsManager.setMultiple({
            useFixedProfile: false,
            activeProfileId: null
        });
    }
  }
}
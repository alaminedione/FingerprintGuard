/**
 * Gestionnaire des profils pour FingerprintGuard v3.0.0
 * Gère la création, la validation et l'utilisation des profils de session et fixes.
 */

import { getFakeNavigatorProperties, getFakeUserAgentData, getFakeUserAgent, getFakeScreenProperties, getNewRules } from '../spoofing/spoofing-data.js';

export class ProfileManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.profiles = []; // Pour les profils fixes sauvegardés
    this.luckyModeProfile = null; // Pour le profil du mode Lucky
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
    console.log('👤 Fixed profiles loaded:', this.profiles.length);

    // Charger le profil Lucky Mode depuis le stockage de session
    try {
      const sessionStored = await chrome.storage.session.get('luckyModeProfile');
      if (sessionStored.luckyModeProfile) {
        this.luckyModeProfile = sessionStored.luckyModeProfile;
        console.log('🍀 Loaded Lucky Mode profile from session storage:', this.luckyModeProfile.id);
      } else {
        console.log('🍀 No Lucky Mode profile found in session storage.');
      }
    } catch (error) {
      console.error('❌ Error loading Lucky Mode profile from session storage:', error);
    }

    // Gérer le profil de session (général, non Lucky Mode)
    await this.handleSessionProfile();
    console.log(`✅ ProfileManager initialized with ${this.profiles.length} saved profiles.`);
  }

  /**
   * Récupère ou génère le profil pour le mode "I'm Feeling Lucky".
   * Ce profil est persistant pour la durée de la session du navigateur.
   * @returns {object} Le profil du mode Lucky.
   */
  getLuckyModeProfile() {
    if (!this.luckyModeProfile) {
      console.log('🍀 getLuckyModeProfile: No profile in memory, generating new one...');
      this.luckyModeProfile = this.generateSessionProfile(); // Réutilise la logique de génération de profil de session
      chrome.storage.session.set({ luckyModeProfile: this.luckyModeProfile })
        .then(() => console.log('🍀 Lucky Mode profile saved to session storage:', this.luckyModeProfile.id))
        .catch(error => console.error('❌ Error saving Lucky Mode profile to session storage:', error));
    } else {
      console.log('🍀 getLuckyModeProfile: Using existing profile from memory:', this.luckyModeProfile.id);
    }
    return this.luckyModeProfile;
  }

  /**
   * Gère le profil de la session actuelle.
   * Crée un nouveau profil de session si aucun n'existe.
   */
  async handleSessionProfile() {
    const { protectionMode, generateNewProfileOnStart } = this.settingsManager.getAll();

    if (protectionMode === 'ghost') {
        this.sessionProfile = null; // Pas de profil en mode Ghost
        console.log('👻 Ghost mode active, session profile cleared.');
        return;
    }

    if (generateNewProfileOnStart || !this.sessionProfile) {
        console.log('🔄 Generating new general session profile...');
        this.sessionProfile = this.generateSessionProfile();
        console.log('✅ General session profile generated:', this.sessionProfile.id);
    } else {
        console.log('🔄 Using existing general session profile:', this.sessionProfile.id);
    }
  }

  /**
   * Génère un profil de session unique.
   * @returns {object} Le profil de session généré.
   */
  generateSessionProfile() {
    console.log('✨ Generating a new random profile...');
    const profileSettings = this.settingsManager.get('profile');
    const data = {
        fakeNavigator: getFakeNavigatorProperties(profileSettings),
        fakeUserAgentData: getFakeUserAgentData(profileSettings, profileSettings.browser),
        fakeUserAgent: getFakeUserAgent(profileSettings),
        fakeScreen: getFakeScreenProperties(profileSettings),
        rules: getNewRules(profileSettings, 1),
    };

    const newProfile = {
        id: `session_${Date.now()}`,
        isSession: true,
        createdAt: new Date().toISOString(),
        data: data
    };
    console.log('✅ New random profile generated with ID:', newProfile.id);
    return newProfile;
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
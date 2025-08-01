/**
 * Gestionnaire centralisé des paramètres pour FingerprintGuard v3.0.0
 * Gère le chargement, la validation, la migration et la sauvegarde des paramètres
 */

import { DEFAULT_SETTINGS, VALIDATION_RULES } from '../config/defaults.js';

export class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
  }

  /**
   * Initialise le gestionnaire de paramètres
   * @returns {Promise<object>} Les paramètres chargés
   */
  async initialize() {
    try {
      console.log('🔧 Initializing SettingsManager...');
      let stored = await chrome.storage.sync.get(null); // Charger tous les paramètres

      // Logique de migration si nécessaire
      if (this.isOldVersion(stored)) {
        console.log('🔄 Migrating old settings to new structure...');
        stored = this.migrateSettings(stored);
        await chrome.storage.sync.clear(); // Effacer les anciens paramètres
        await chrome.storage.sync.set(stored); // Sauvegarder les nouveaux
        console.log('✅ Migration complete!');
      }

      this.settings = { ...DEFAULT_SETTINGS, ...stored };
      this.settings = this.validateSettings(this.settings);
      console.log('✅ SettingsManager initialized with settings:', this.settings);
      return this.settings;
    } catch (error) {
      console.error('❌ Error initializing SettingsManager:', error);
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }

  /**
   * Vérifie si les paramètres stockés sont d'une ancienne version
   * @param {object} storedSettings - Paramètres stockés
   * @returns {boolean} Vrai si les paramètres sont d'une ancienne version
   */
  isOldVersion(storedSettings) {
    return storedSettings.hasOwnProperty('ghostMode') || storedSettings.hasOwnProperty('spoofBrowser');
  }

  /**
   * Migre les anciens paramètres vers la nouvelle structure
   * @param {object} oldSettings - Anciens paramètres
   * @returns {object} Nouveaux paramètres migrés
   */
  migrateSettings(oldSettings) {
    const newSettings = { ...DEFAULT_SETTINGS };

    // Définir le mode de protection en fonction des anciens paramètres
    if (oldSettings.ghostMode) {
      newSettings.protectionMode = 'ghost';
    } else {
      newSettings.protectionMode = 'advanced'; // Par défaut, l'ancien mode est 'advanced'
    }

    // Migrer les paramètres avancés
    if (oldSettings.advancedProtection) {
        newSettings.advancedSettings.webrtc = oldSettings.advancedProtection.webrtc;
        newSettings.advancedSettings.audio = oldSettings.advancedProtection.audio;
        newSettings.advancedSettings.fonts = oldSettings.advancedProtection.fonts;
        newSettings.advancedSettings.timezone = oldSettings.advancedProtection.timezone;
        newSettings.advancedSettings.experimental = oldSettings.advancedProtection.experimental;
    }
    newSettings.advancedSettings.spoofBrowser = oldSettings.spoofBrowser;
    newSettings.advancedSettings.spoofCanvas = oldSettings.spoofCanvas;
    newSettings.advancedSettings.spoofScreen = oldSettings.spoofScreen;
    newSettings.advancedSettings.blockImages = oldSettings.blockImages;
    newSettings.advancedSettings.blockJS = oldSettings.blockJS;

    // Migrer les paramètres de profil
    Object.keys(newSettings.profile).forEach(key => {
      if (oldSettings.hasOwnProperty(key)) {
        newSettings.profile[key] = oldSettings[key];
      }
    });

    // Migrer les autres paramètres
    newSettings.autoReloadAll = oldSettings.autoReloadAll;
    newSettings.autoReloadCurrent = oldSettings.autoReloadCurrent;
    newSettings.useFixedProfile = oldSettings.useFixedProfile;
    newSettings.generateNewProfileOnStart = oldSettings.generateNewProfileOnStart;
    newSettings.activeProfileId = oldSettings.activeProfileId;
    newSettings.profiles = oldSettings.profiles;
    newSettings.theme = oldSettings.theme;

    return newSettings;
  }

  /**
   * Obtient une valeur de paramètre
   * @param {string} key - Clé du paramètre (peut être imbriquée, ex: 'profile.platform')
   * @returns {*} Valeur du paramètre
   */
  get(key) {
    if (key.includes('.')) {
      return key.split('.').reduce((o, i) => o[i], this.settings);
    }
    return this.settings[key];
  }

  /**
   * Obtient tous les paramètres
   * @returns {object} Tous les paramètres
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Met à jour un paramètre
   * @param {string} key - Clé du paramètre (peut être imbriquée)
   * @param {*} value - Nouvelle valeur
   * @returns {Promise<boolean>} Succès de la mise à jour
   */
  async set(key, value) {
    try {
      let settingsToUpdate = this.settings;
      const keys = key.split('.');
      const lastKey = keys.pop();
      
      for (const k of keys) {
        settingsToUpdate = settingsToUpdate[k];
      }
      
      settingsToUpdate[lastKey] = value;

      // Pour la sauvegarde, nous devons reconstruire l'objet à partir de la clé complète
      const updateObject = {};
      if (keys.length > 0) {
        // Recrée l'objet imbriqué pour la sauvegarde
        const topLevelKey = keys[0];
        updateObject[topLevelKey] = this.settings[topLevelKey];
        await chrome.storage.sync.set({ [topLevelKey]: this.settings[topLevelKey] });
      } else {
        updateObject[key] = value;
        await chrome.storage.sync.set({ [key]: value });
      }

      this.notifyListeners(key, value);
      console.log(`✅ Setting updated: ${key} = ${value}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Met à jour plusieurs paramètres
   * @param {object} updates - Objet contenant les paramètres à mettre à jour
   * @returns {Promise<string[]>} Liste des clés mises à jour avec succès
   */
  async setMultiple(updates) {
    if (!updates || typeof updates !== 'object') {
      console.error('❌ Invalid updates object');
      return [];
    }

    const updatedKeys = [];

    Object.keys(updates).forEach(key => {
        this.set(key, updates[key]); // Utilise la nouvelle logique `set` pour gérer les clés imbriquées
        updatedKeys.push(key);
    });

    // La sauvegarde est déjà gérée dans `set`, donc pas besoin de `chrome.storage.sync.set` ici

    console.log('✅ Multiple settings updated:', updatedKeys);
    return updatedKeys;
  }

  /**
   * Réinitialise tous les paramètres aux valeurs par défaut
   * @returns {Promise<boolean>} Succès de la réinitialisation
   */
  async reset() {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(this.settings);
      this.notifyListeners('*', this.settings);
      console.log('✅ Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      return false;
    }
  }

  /**
   * Valide les paramètres chargés
   * @param {object} settings - Paramètres à valider
   * @returns {object} Paramètres validés
   */
  validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      console.error('❌ Invalid settings object, using defaults');
      return { ...DEFAULT_SETTINGS };
    }

    const validated = { ...settings };

    // Valider les champs en utilisant les règles de VALIDATION_RULES
    Object.keys(VALIDATION_RULES).forEach(type => {
        VALIDATION_RULES[type].forEach(field => {
            const value = this.get(field); // Utilise `get` pour les clés imbriquées
            const defaultValue = this.get(field, DEFAULT_SETTINGS);

            let isValid = false;
            switch (type) {
                case 'booleanFields':
                    isValid = typeof value === 'boolean';
                    break;
                case 'numberFields':
                    isValid = typeof value === 'number' && !isNaN(value) && value >= 0;
                    break;
                case 'stringFields':
                    isValid = typeof value === 'string';
                    break;
            }

            if (!isValid) {
                console.warn(`⚠️ Invalid field ${field}, resetting to default`);
                this.set(field, defaultValue); // Utilise `set` pour les clés imbriquées
            }
        });
    });

    // Validation spéciale pour la résolution d'écran
    const screenResolution = this.get('profile.spoofScreenResolution');
    if (screenResolution && screenResolution !== 'random') {
      const resolutionValidation = this.validateScreenResolution(screenResolution);
      if (!resolutionValidation.valid) {
        console.warn(`⚠️ Résolution d'écran invalide '${screenResolution}'. ${resolutionValidation.reason}`);
        this.set('profile.spoofScreenResolution', DEFAULT_SETTINGS.profile.spoofScreenResolution);
      }
    }

    return validated;
  }

  /**
   * Valide une résolution d'écran
   * @param {string} resolution - Résolution à valider (format: "1920x1080")
   * @returns {object} Résultat de validation
   */
  validateScreenResolution(resolution) {
    if (typeof resolution !== 'string') {
      return { valid: false, reason: 'La résolution doit être une chaîne de caractères' };
    }

    if (resolution === 'random') {
      return { valid: true };
    }

    const resolutionPattern = /^\d{3,4}x\d{3,4}$/;
    if (!resolutionPattern.test(resolution)) {
      return { valid: false, reason: 'Format invalide. Utilisez le format "1920x1080"' };
    }

    const [width, height] = resolution.split('x').map(Number);
    
    if (width < 800 || height < 600) {
      return { valid: false, reason: 'Résolution trop petite (minimum 800x600)' };
    }

    if (width > 7680 || height > 4320) {
      return { valid: false, reason: 'Résolution trop grande (maximum 7680x4320)' };
    }

    return { valid: true };
  }

  /**
   * Ajoute un listener pour les changements de paramètres
   * @param {Function} callback - Fonction appelée lors des changements
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Supprime un listener
   * @param {Function} callback - Fonction à supprimer
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifie tous les listeners d'un changement
   * @param {string} key - Clé du paramètre modifié
   * @param {*} value - Nouvelle valeur
   */
  notifyListeners(key, value) {
    this.listeners.forEach(callback => {
      try {
        callback(key, value, this.settings);
      } catch (error) {
        console.error('❌ Error in settings listener:', error);
      }
    });
  }

  /**
   * Exporte les paramètres actuels
   * @returns {object} Paramètres exportés avec métadonnées
   */
  export() {
    return {
      settings: this.settings,
      exportedAt: new Date().toISOString(),
      version: '3.0.0', // Mise à jour de la version
      type: 'fingerprintguard-settings'
    };
  }

  /**
   * Importe des paramètres depuis un objet exporté
   * @param {object} data - Données à importer
   * @returns {Promise<boolean>} Succès de l'importation
   */
  async import(data) {
    try {
      if (!data || !data.settings || data.type !== 'fingerprintguard-settings') {
        throw new Error('Invalid export data format');
      }

      const validatedSettings = this.validateSettings(data.settings);
      await this.setMultiple(validatedSettings);
      console.log('✅ Settings imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing settings:', error);
      return false;
    }
  }
}
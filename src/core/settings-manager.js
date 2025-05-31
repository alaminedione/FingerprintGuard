/**
 * Gestionnaire centralisé des paramètres pour FingerprintGuard v2.1.0
 * Gère le chargement, la validation et la sauvegarde des paramètres
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
      const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
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
   * Obtient une valeur de paramètre
   * @param {string} key - Clé du paramètre
   * @returns {*} Valeur du paramètre
   */
  get(key) {
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
   * @param {string} key - Clé du paramètre
   * @param {*} value - Nouvelle valeur
   * @returns {Promise<boolean>} Succès de la mise à jour
   */
  async set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      console.warn(`⚠️ Unknown setting: ${key}`);
      return false;
    }

    try {
      this.settings[key] = value;
      await chrome.storage.sync.set({ [key]: value });
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

    const validUpdates = {};
    const updatedKeys = [];

    // Valider tous les paramètres avant de les appliquer
    Object.keys(updates).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
        validUpdates[key] = updates[key];
        this.settings[key] = updates[key];
        updatedKeys.push(key);
      } else {
        console.warn(`⚠️ Ignoring unknown setting: ${key}`);
      }
    });

    try {
      if (Object.keys(validUpdates).length > 0) {
        await chrome.storage.sync.set(validUpdates);
        updatedKeys.forEach(key => {
          this.notifyListeners(key, validUpdates[key]);
        });
        console.log('✅ Multiple settings updated:', updatedKeys);
      }
      return updatedKeys;
    } catch (error) {
      console.error('❌ Error updating multiple settings:', error);
      return [];
    }
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

    // Valider les types booléens
    VALIDATION_RULES.booleanFields.forEach(field => {
      if (validated[field] !== undefined && typeof validated[field] !== 'boolean') {
        console.warn(`⚠️ Invalid boolean field ${field}, resetting to default`);
        validated[field] = DEFAULT_SETTINGS[field];
      }
    });

    // Valider les nombres non-négatifs
    VALIDATION_RULES.numberFields.forEach(field => {
      if (validated[field] !== undefined) {
        const value = Number(validated[field]);
        if (isNaN(value) || value < 0) {
          console.warn(`⚠️ Invalid number field ${field}, resetting to default`);
          validated[field] = DEFAULT_SETTINGS[field];
        } else {
          validated[field] = value;
        }
      }
    });

    // Valider les chaînes de caractères
    VALIDATION_RULES.stringFields.forEach(field => {
      if (validated[field] !== undefined && typeof validated[field] !== 'string') {
        console.warn(`⚠️ Invalid string field ${field}, resetting to default`);
        validated[field] = DEFAULT_SETTINGS[field];
      }
    });

    return validated;
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
      version: '2.1.0',
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
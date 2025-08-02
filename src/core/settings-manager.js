/**
 * Gestionnaire des paramètres pour FingerprintGuard v3.0.0
 * Centralise la lecture, l'écriture et la validation des paramètres.
 */

import { DEFAULT_SETTINGS } from '../config/defaults.js';

export class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.listeners = [];
  }

  async initialize() {
    const storedSettings = await chrome.storage.local.get('settings');
    if (storedSettings.settings) {
      this.settings = { ...this.settings, ...storedSettings.settings };
    }
  }

  /**
   * Enregistre un écouteur pour les changements de paramètres.
   * @param {Function} callback - La fonction à appeler lors d'un changement.
   */
  onChanged(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notifie tous les écouteurs d'un changement.
   * @param {object} changes - L'objet décrivant les changements.
   */
  notifyListeners(changes) {
    for (const listener of this.listeners) {
      listener(changes);
    }
  }

  get(key) {
    return this.settings[key];
  }

  getAll() {
    return { ...this.settings };
  }

  async set(key, value) {
    this.settings[key] = value;
    await this.saveToStorage();
    this.notifyListeners({ [key]: value });
  }

  async setMultiple(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveToStorage();
    this.notifyListeners(newSettings);
  }

  async saveToStorage() {
    await chrome.storage.local.set({ settings: this.settings });
  }
}

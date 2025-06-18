/**
 * Modern Popup Script for FingerprintGuard v2.1.0
 * Enhanced UX with animations, notifications, and advanced features
 */

class FingerprintGuardPopup {
  constructor() {
    this.settings = {};
    this.stats = {
      activeProtections: 0,
      blockedRequests: 0,
      spoofedData: 0
    };
    this.theme = null; // Sera initialisé dans loadSettings
    this.isLoading = false;
    this.notificationQueue = [];
    
    this.settingsMappings = {
      'ghostMode': 'ghostMode',
      'spoofBrowser': 'spoofBrowser',
      'spoofCanvas': 'spoofCanvas',
      'spoofScreen': 'spoofScreen',
      'blockImages': 'blockImages',
      'blockJS': 'blockJS'
    };

    if (!this.initializeElements()) {
      console.error("❌ Failed to initialize popup elements");
      return;
    }
    this.attachEventListeners();
    this.applyTheme();
    this.loadSettings();
  }

  initializeElements() {
    this.themeToggle = document.getElementById('themeToggle');
    this.statusIcon = document.getElementById('statusIcon');
    this.statusText = document.getElementById('statusText');
    this.loadingOverlay = document.getElementById('loading');
    this.ghostModeIcon = document.getElementById('ghostModeIcon');
    this.reloadButton = document.getElementById('reloadAllTabs');
    this.settingsButton = document.getElementById('openSettings');
    this.notification = document.getElementById('notification');
    this.notificationText = document.getElementById('notificationText');
    
    // Ghost Mode Control Buttons
    this.deactivateGhostButton = document.getElementById('deactivateGhostMode');
    this.regenerateGhostButton = document.getElementById('regenerateGhostProfile');
    
    // Statistics elements
    this.activeProtectionsEl = document.getElementById('activeProtections');
    this.blockedRequestsEl = document.getElementById('blockedRequests');
    this.spoofedDataEl = document.getElementById('spoofedData');
    
    return this.themeToggle && this.statusIcon && this.statusText && this.loadingOverlay;
  }

  attachEventListeners() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    if (this.reloadButton) {
      this.reloadButton.addEventListener('click', () => this.reloadAllTabs());
    }

    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', () => this.openSettings());
    }

    // Ghost Mode Control Buttons
    if (this.deactivateGhostButton) {
      this.deactivateGhostButton.addEventListener('click', () => this.deactivateGhostMode());
    }

    if (this.regenerateGhostButton) {
      this.regenerateGhostButton.addEventListener('click', () => this.regenerateGhostProfile());
    }

    // Toggle switches avec support clavier
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', () => this.handleToggleClick(toggle));
      
      // Support clavier pour accessibilité
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleToggleClick(toggle);
        }
      });
    });

    // Close popup when clicking outside main content (but allow for header and footer interactions)
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.main-content, .header, .footer, .notification')) {
        window.close();
      }
    });
  }

  async loadSettings() {
    try {
      this.showLoading(true);
      
      const response = await this.sendMessage({ type: 'getStatus' });
      
      if (response?.success) {
        this.settings = response.data;
        
        // Récupération du thème centralisé
        this.theme = this.settings.theme || 'light';
        this.applyTheme();
        
        this.updateInterface();
        this.updateStats();
        this.showNotification('Paramètres chargés avec succès', 'success');
      } else {
        throw new Error(response?.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback au thème par défaut en cas d'erreur
      this.theme = 'light';
      this.applyTheme();
      this.showNotification('Erreur lors du chargement', 'error');
      this.showError();
    } finally {
      this.showLoading(false);
    }
  }

  async toggleTheme() {
    try {
      // Basculer le thème
      const newTheme = this.theme === 'light' ? 'dark' : 'light';
      
      // Mettre à jour le thème localement
      this.theme = newTheme;
      this.applyTheme();
      
      // Envoyer la mise à jour au background
      const response = await this.sendMessage({
        type: 'updateSetting',
        setting: 'theme',
        value: newTheme
      });
      
      if (response?.success) {
        const action = newTheme === 'light' ? 'clair' : 'sombre';
        this.showNotification(`Thème ${action} activé`, 'success');
      } else {
        throw new Error(response?.error || 'Theme update failed');
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
      this.showNotification('Erreur de changement de thème', 'error');
    }
  }

  applyTheme() {
    if (!this.theme) return; // N'applique le thème que s'il est défini
    
    document.body.setAttribute('data-theme', this.theme);
    const emoji = this.theme === 'light' ? '🌙' : '☀️';
    
    if (this.themeToggle) {
      this.themeToggle.textContent = emoji;
      this.themeToggle.title = this.theme === 'light' 
        ? 'Passer au thème sombre' 
        : 'Passer au thème clair';
      // Amélioration accessibilité
      this.themeToggle.setAttribute('aria-label', this.theme === 'light' 
        ? 'Basculer vers le thème sombre' 
        : 'Basculer vers le thème clair');
    }
  }

  updateInterface() {
    // Update status
    const isGhostMode = this.settings.ghostMode;
    const isActive = Object.values(this.settings).some(val => val === true);
    
    if (isGhostMode) {
      this.showGhostMode();
    } else {
      this.hideGhostMode();
      this.updateNormalInterface(isActive);
    }
    
    // Update toggle switches with accessibility support
    for (const [key, settingKey] of Object.entries(this.settingsMappings)) {
      const toggle = document.querySelector(`[data-toggle="${key}"]`);
      const isEnabled = this.settings[settingKey];
      
      if (toggle) {
        if (isEnabled) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        
        // Mise à jour des attributs d'accessibilité
        toggle.setAttribute('aria-checked', isEnabled.toString());
        
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = isEnabled;
        }
      }
    }
  }

  showGhostMode() {
    if (this.ghostModeIcon) {
      this.ghostModeIcon.style.display = 'block';
    }
    
    const normalControls = document.getElementById('normalControls');
    if (normalControls) {
      normalControls.style.display = 'none';
    }
    
    this.updateStatusCard('ghost', 'Mode Fantôme Actif', '👻');
  }

  hideGhostMode() {
    if (this.ghostModeIcon) {
      this.ghostModeIcon.style.display = 'none';
    }
    
    const normalControls = document.getElementById('normalControls');
    if (normalControls) {
      normalControls.style.display = 'block';
    }
  }

  updateNormalInterface(isActive) {
    if (isActive) {
      this.updateStatusCard('active', 'Protection Active', '🛡️');
    } else {
      this.updateStatusCard('inactive', 'Protection Désactivée', '⚠️');
    }
  }

  updateStatusCard(state, text, icon) {
    const statusCard = document.getElementById('status');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    
    if (statusCard) {
      statusCard.className = `status-card ${state}`;
    }
    
    if (statusIcon) {
      statusIcon.className = `status-icon ${state}`;
      statusIcon.textContent = icon;
    }
    
    if (statusText) {
      statusText.textContent = text;
    }
  }

  updateStats() {
    if (this.activeProtectionsEl) {
      this.activeProtectionsEl.textContent = this.stats.activeProtections;
    }
    if (this.blockedRequestsEl) {
      this.blockedRequestsEl.textContent = this.stats.blockedRequests;
    }
    if (this.spoofedDataEl) {
      this.spoofedDataEl.textContent = this.stats.spoofedData;
    }
  }

  async handleToggleClick(toggle) {
    const settingKey = toggle.dataset.toggle;
    const mappedKey = this.settingsMappings[settingKey];
    
    if (!mappedKey) return;
    
    const checkbox = toggle.querySelector('input[type="checkbox"]');
    if (!checkbox) return;
    
    const currentValue = checkbox.checked;
    const newValue = !currentValue;
    
    // Mise à jour optimiste de l'UI
    checkbox.checked = newValue;
    if (newValue) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    try {
      const response = await this.sendMessage({
        type: 'updateSetting',
        setting: mappedKey,
        value: newValue
      });
      
      if (response?.success) {
        this.settings[mappedKey] = newValue;
        this.updateInterface();
        
        const action = newValue ? 'activée' : 'désactivée';
        this.showNotification(`Protection ${action}`, 'success');
      } else {
        throw new Error(response?.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revenir à l'état précédent en cas d'erreur
      checkbox.checked = currentValue;
      if (currentValue) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
      this.showNotification('Erreur de mise à jour', 'error');
    }
  }

  async reloadAllTabs() {
    try {
      const response = await this.sendMessage({ type: 'reloadAllTabs' });
      if (response?.success) {
        this.showNotification('Tous les onglets rechargés', 'success');
      } else {
        throw new Error(response?.error || 'Reload failed');
      }
    } catch (error) {
      console.error('Error reloading tabs:', error);
      this.showNotification('Erreur lors du rechargement', 'error');
    }
  }

  openSettings() {
    try {
      chrome.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('Error opening settings:', error);
      this.showNotification('Erreur ouverture paramètres', 'error');
    }
  }

  showLoading(show) {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  showError() {
    this.updateStatusCard('inactive', 'Erreur de Chargement', '❌');
  }

  showNotification(message, type = 'info') {
    if (!this.notification || !this.notificationText) return;
    
    this.notificationText.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.classList.add('show');
    
    setTimeout(() => {
      this.notification.classList.remove('show');
    }, 3000);
  }

  async deactivateGhostMode() {
    try {
      this.showLoading();
      this.showNotification('Désactivation du mode fantôme...', 'info');

      // Send message to background script to deactivate ghost mode
      const response = await this.sendMessage({
        type: 'deactivateJustProtectMe'
      });

      if (response && response.success) {
        this.showNotification('Mode fantôme désactivé avec succès!', 'success');
        // Reload settings to update UI
        setTimeout(() => {
          this.loadSettings();
        }, 500);
      } else {
        throw new Error(response?.error || 'Échec de la désactivation');
      }
    } catch (error) {
      console.error('Error deactivating ghost mode:', error);
      this.showNotification('Erreur lors de la désactivation du mode fantôme', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async regenerateGhostProfile() {
    try {
      this.showLoading();
      this.showNotification('Régénération du profil fantôme...', 'info');

      // Send message to background script to regenerate profile
      const response = await this.sendMessage({
        type: 'regenerateProfile'
      });

      if (response && response.success) {
        this.showNotification('Profil fantôme régénéré avec succès!', 'success');
        // Small delay to show success message
        setTimeout(() => {
          this.loadSettings();
        }, 1000);
      } else {
        throw new Error(response?.error || 'Échec de la régénération');
      }
    } catch (error) {
      console.error('Error regenerating profile:', error);
      this.showNotification('Erreur lors de la régénération du profil', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Message sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FingerprintGuardPopup();
});
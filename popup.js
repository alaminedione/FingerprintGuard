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
    this.theme = 'light'; // Valeur par défaut temporaire
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

    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', () => this.handleToggleClick(toggle));
    });

    // Close popup when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.container')) {
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
    document.body.setAttribute('data-theme', this.theme);
    const emoji = this.theme === 'light' ? '🌙' : '☀️';
    
    if (this.themeToggle) {
      this.themeToggle.textContent = emoji;
      this.themeToggle.title = this.theme === 'light' 
        ? 'Passer au thème sombre' 
        : 'Passer au thème clair';
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
    
    // Update toggle switches
    for (const [key, settingKey] of Object.entries(this.settingsMappings)) {
      const toggle = document.querySelector(`[data-toggle="${key}"]`);
      const isEnabled = this.settings[settingKey];
      
      if (toggle) {
        if (isEnabled) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        
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
    
    try {
      const response = await this.sendMessage({
        type: 'updateSetting',
        setting: mappedKey,
        value: newValue
      });
      
      if (response?.success) {
        checkbox.checked = newValue;
        if (newValue) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
        
        this.settings[mappedKey] = newValue;
        this.updateInterface();
        
        const action = newValue ? 'activée' : 'désactivée';
        this.showNotification(`Protection ${action}`, 'success');
      } else {
        throw new Error(response?.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
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
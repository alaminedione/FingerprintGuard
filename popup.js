/**
 * Popup Script for FingerprintGuard v3.0.0
 * Simplified UI with protection modes
 */

class FingerprintGuardPopup {
  constructor() {
    this.settings = {};
    this.theme = 'light';
    this.currentMode = 'advanced';

    if (!this.initializeElements()) {
      console.error("❌ Failed to initialize popup elements");
      return;
    }
    this.attachEventListeners();
    this.loadSettings();
  }

  initializeElements() {
    this.elements = {
      loadingOverlay: document.getElementById('loading'),
      themeToggle: document.getElementById('themeToggle'),
      modeButtons: document.querySelectorAll('.mode-btn'),
      statusDisplay: document.getElementById('status-display'),
      statusIcon: document.getElementById('status-icon'),
      statusTitle: document.getElementById('status-title'),
      statusDescription: document.getElementById('status-description'),
      reloadButton: document.getElementById('reloadAllTabs'),
      settingsButton: document.getElementById('openSettings'),
      notification: document.getElementById('notification'),
      notificationText: document.getElementById('notificationText'),
    };
    return Object.values(this.elements).every(el => el !== null);
  }

  attachEventListeners() {
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.elements.reloadButton.addEventListener('click', () => this.reloadAllTabs());
    this.elements.settingsButton.addEventListener('click', () => this.openSettings());

    this.elements.modeButtons.forEach(button => {
      button.addEventListener('click', () => this.handleModeChange(button.dataset.mode));
    });
  }

  async loadSettings() {
    this.showLoading(true);
    try {
      const response = await this.sendMessage({ type: 'getSettings' });
      if (response?.success) {
        this.settings = response.data;
        this.currentMode = this.settings.protectionMode || 'advanced';
        this.theme = this.settings.theme || 'light';
        this.updateUI();
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showNotification('Erreur de chargement des paramètres', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  updateUI() {
    this.applyTheme();
    this.updateModeSelection();
    this.updateStatusDisplay();
    // Le bouton des paramètres est toujours visible, mais sa pertinence dépend du mode.
    this.elements.settingsButton.style.display = this.currentMode === 'advanced' ? 'flex' : 'none';
  }

  applyTheme() {
    document.body.setAttribute('data-theme', this.theme);
    const emoji = this.theme === 'light' ? '🌙' : '☀️';
    this.elements.themeToggle.textContent = emoji;
    this.elements.themeToggle.setAttribute('aria-label', this.theme === 'light' ? 'Passer au thème sombre' : 'Passer au thème clair');
  }

  updateModeSelection() {
    this.elements.modeButtons.forEach(button => {
      if (button.dataset.mode === this.currentMode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  updateStatusDisplay() {
    const modeInfo = {
      lucky: {
        icon: '🍀',
        title: "I'm Feeling Lucky",
        description: 'Protection complète avec un profil aléatoire à chaque session.',
        color: 'var(--success-color)'
      },
      advanced: {
        icon: '⚙️',
        title: 'Mode Avancé',
        description: 'Personnalisez vos paramètres de protection. Un nouveau profil est généré par session.',
        color: 'var(--primary-color)'
      },
      ghost: {
        icon: '👻',
        title: 'Ghost Mode',
        description: 'Protection maximale, la plupart des APIs sont désactivées. Peut affecter certains sites.',
        color: 'var(--ghost-color)'
      }
    };

    const info = modeInfo[this.currentMode];
    if (info) {
      this.elements.statusIcon.textContent = info.icon;
      this.elements.statusTitle.textContent = info.title;
      this.elements.statusDescription.textContent = info.description;
      this.elements.statusIcon.style.backgroundColor = info.color;
      this.elements.statusDisplay.style.borderColor = info.color;
    }
  }

  async handleModeChange(newMode) {
    if (newMode === this.currentMode) return;

    this.currentMode = newMode;
    this.updateUI();

    try {
      const response = await this.sendMessage({
        type: 'updateSetting',
        payload: { key: 'protectionMode', value: newMode }
      });

      if (response?.success) {
        this.showNotification(`Mode ${this.elements.statusTitle.textContent} activé`, 'success');
      } else {
        throw new Error('Failed to update mode');
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      this.showNotification('Erreur lors du changement de mode', 'error');
      // Revert UI if update fails
      this.loadSettings();
    }
  }

  async toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.theme = newTheme;
    this.applyTheme();

    try {
      await this.sendMessage({
        type: 'updateSetting',
        payload: { key: 'theme', value: newTheme }
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  async reloadAllTabs() {
    this.showLoading(true);
    try {
      const response = await this.sendMessage({ type: 'reloadAllTabs' });
      if (response?.success) {
        this.showNotification('Onglets rechargés avec les nouveaux paramètres', 'success');
        setTimeout(() => window.close(), 1000);
      } else {
        throw new Error('Failed to reload tabs');
      }
    } catch (error) {
      console.error('Error reloading tabs:', error);
      this.showNotification('Erreur lors du rechargement', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  showLoading(show) {
    this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  showNotification(message, type = 'info') {
    this.elements.notificationText.textContent = message;
    this.elements.notification.className = `notification ${type}`;
    this.elements.notification.classList.add('show');

    setTimeout(() => {
      this.elements.notification.classList.remove('show');
    }, 3000);
  }

  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Message sending failed:', error);
      // This case is often due to the popup closing before a response is received.
      return { success: false, error: error.message };
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FingerprintGuardPopup();
});
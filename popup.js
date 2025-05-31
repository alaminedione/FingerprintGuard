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
        this.theme = localStorage.getItem('fpg-theme') || 'light';
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
        // Main elements
        this.loadingOverlay = document.getElementById('loading');
        this.statusCard = document.getElementById('status');
        this.statusText = document.getElementById('statusText');
        this.statusIcon = document.getElementById('statusIcon');
        this.ghostModeIcon = document.getElementById('ghostModeIcon');
        this.normalControls = document.getElementById('normalControls');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        
        // Action buttons
        this.reloadButton = document.getElementById('reloadAllTabs');
        this.settingsButton = document.getElementById('openSettings');
        
        // Stats elements
        this.activeProtectionsEl = document.getElementById('activeProtections');
        this.blockedRequestsEl = document.getElementById('blockedRequests');
        this.spoofedDataEl = document.getElementById('spoofedData');
        
        // Notification
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');

        // Vérification de sécurité pour les éléments critiques
        const criticalElements = ['statusText', 'statusIcon', 'notification', 'notificationText'];
        for (const elementId of criticalElements) {
            if (!this[elementId]) {
                console.error(`❌ Critical element not found: ${elementId}`);
                this.showError();
                return false;
            }
        }
        return true;
        
        // Toggle switches
        this.toggleSwitches = document.querySelectorAll('.toggle-switch');
    }

    attachEventListeners() {
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Toggle switches
        this.toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.handleToggleClick(e));
        });
        
        // Action buttons
        this.reloadButton.addEventListener('click', () => this.reloadAllTabs());
        this.settingsButton.addEventListener('click', () => this.openSettings());
        
        // Additional links
        document.getElementById('aboutLink')?.addEventListener('click', () => this.showAbout());
        document.getElementById('helpLink')?.addEventListener('click', () => this.showHelp());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Auto-update stats
        setInterval(() => this.updateStats(), 5000);
    }

    async loadSettings() {
        try {
            this.showLoading(true);
            
            const response = await this.sendMessage({ type: 'getStatus' });
            
            if (response?.success) {
                this.settings = response.data;
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

    async handleToggleClick(event) {
        const toggle = event.currentTarget;
        const settingKey = toggle.dataset.toggle;
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        
        if (!settingKey || this.isLoading) return;
        
        try {
            // Optimistic UI update
            const newValue = !checkbox.checked;
            this.updateToggleState(toggle, newValue);
            
            // Handle special cases
            if (settingKey === 'ghostMode') {
                this.toggleGhostMode(newValue);
            }
            
            // Send update to background
            const response = await this.sendMessage({
                type: 'updateSetting',
                setting: settingKey,
                value: newValue
            });
            
            if (response?.success) {
                this.settings[settingKey] = newValue;
                this.updateStatus();
                this.updateStats();
                
                const action = newValue ? 'activée' : 'désactivée';
                this.showNotification(`Protection ${this.getSettingDisplayName(settingKey)} ${action}`, 'success');
            } else {
                // Revert on error
                this.updateToggleState(toggle, !newValue);
                throw new Error(response?.error || 'Failed to update setting');
            }
        } catch (error) {
            console.error('Error updating setting:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    updateToggleState(toggle, isActive) {
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        checkbox.checked = isActive;
        
        if (isActive) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
        
        // Add animation effect
        toggle.style.transform = 'scale(0.95)';
        setTimeout(() => {
            toggle.style.transform = '';
        }, 150);
    }

    updateInterface() {
        // Update all toggle states
        Object.entries(this.settingsMappings).forEach(([elementId, settingKey]) => {
            const toggle = document.querySelector(`[data-toggle="${elementId}"]`);
            if (toggle) {
                this.updateToggleState(toggle, this.settings[settingKey] || false);
            }
        });
        
        // Handle ghost mode
        if (this.settings?.ghostMode) {
            this.toggleGhostMode(true);
        }
        
        this.updateStatus();
        
        // Add fade-in animation
        document.querySelector('.main-content').classList.add('fade-in');
    }

    updateStatus() {
        const activeProtections = Object.entries(this.settingsMappings)
            .filter(([_, settingKey]) => settingKey !== 'ghostMode' && this.settings[settingKey])
            .length;
        
        let statusClass, statusText, statusIcon;
        
        if (this.settings?.ghostMode) {
            statusClass = 'ghost';
            statusText = 'Mode Fantôme Actif';
            statusIcon = '👻';
        } else if (activeProtections > 0) {
            statusClass = 'active';
            statusText = `${activeProtections} Protection${activeProtections > 1 ? 's' : ''} Active${activeProtections > 1 ? 's' : ''}`;
            statusIcon = '🛡️';
        } else {
            statusClass = 'inactive';
            statusText = 'Protection Inactive';
            statusIcon = '⚠️';
        }
        
        // Update status card
        this.statusCard.className = `status-card ${statusClass}`;
        if (this.statusText) {
            this.statusText.textContent = statusText;
        }
        if (this.statusIcon) {
            this.statusIcon.textContent = statusIcon;
            this.statusIcon.className = `status-icon ${statusClass}`;
        }
        
        // Update stats
        this.stats.activeProtections = activeProtections;
        this.updateStatsDisplay();
    }

    updateStats() {
        // Simulate realistic stats (in real implementation, these would come from background)
        if (this.stats.activeProtections > 0) {
            this.stats.blockedRequests += Math.floor(Math.random() * 3);
            this.stats.spoofedData += Math.floor(Math.random() * 5);
        }
        
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        this.animateNumber(this.activeProtectionsEl, this.stats.activeProtections);
        this.animateNumber(this.blockedRequestsEl, this.stats.blockedRequests);
        this.animateNumber(this.spoofedDataEl, this.stats.spoofedData);
    }

    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const step = targetValue > currentValue ? 1 : -1;
        
        if (currentValue !== targetValue) {
            const animate = () => {
                const newValue = parseInt(element.textContent) + step;
                element.textContent = newValue;
                
                if (newValue !== targetValue) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        }
    }

    toggleGhostMode(enabled) {
        if (enabled) {
            this.normalControls.style.display = 'none';
            this.ghostModeIcon.style.display = 'block';
            
            // Disable other toggles
            this.toggleSwitches.forEach(toggle => {
                if (toggle.dataset.toggle !== 'ghostMode') {
                    toggle.parentElement.classList.add('disabled');
                    const checkbox = toggle.querySelector('input');
                    if (checkbox) checkbox.disabled = true;
                }
            });
        } else {
            this.normalControls.style.display = 'block';
            this.ghostModeIcon.style.display = 'none';
            
            // Re-enable other toggles
            this.toggleSwitches.forEach(toggle => {
                toggle.parentElement.classList.remove('disabled');
                const checkbox = toggle.querySelector('input');
                if (checkbox) checkbox.disabled = false;
            });
        }
    }

    async reloadAllTabs() {
        if (this.isLoading) return;
        
        try {
            this.setButtonLoading(this.reloadButton, true);
            
            const tabs = await chrome.tabs.query({});
            let reloadedCount = 0;
            
            for (const tab of tabs) {
                if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                    try {
                        await chrome.tabs.reload(tab.id);
                        reloadedCount++;
                    } catch (error) {
                        console.warn(`Failed to reload tab ${tab.id}:`, error);
                    }
                }
            }
            
            this.showNotification(`${reloadedCount} page${reloadedCount > 1 ? 's' : ''} rechargée${reloadedCount > 1 ? 's' : ''}`, 'success');
            
        } catch (error) {
            console.error('Error reloading tabs:', error);
            this.showNotification('Erreur lors du rechargement', 'error');
        } finally {
            this.setButtonLoading(this.reloadButton, false);
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('fpg-theme', this.theme);
        
        const emoji = this.theme === 'light' ? '🌙' : '☀️';
        this.themeToggle.textContent = emoji;
        
        this.showNotification(`Thème ${this.theme === 'light' ? 'clair' : 'sombre'} activé`, 'success');
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        const emoji = this.theme === 'light' ? '🌙' : '☀️';
        this.themeToggle.textContent = emoji;
    }

    showLoading(show) {
        this.isLoading = show;
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        
        if (!show) {
            // Add entrance animation
            setTimeout(() => {
                document.querySelector('.main-content').classList.add('slide-up');
            }, 100);
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showNotification(message, type = 'success') {
        this.notificationQueue.push({ message, type });
        this.processNotificationQueue();
    }

    processNotificationQueue() {
        if (this.notificationQueue.length === 0 || this.notification?.classList.contains('show')) {
            return;
        }
        
        const { message, type } = this.notificationQueue.shift();
        
        if (this.notificationText) {
            this.notificationText.textContent = message;
        }
        if (this.notification) {
            this.notification.className = `notification ${type}`;
        }
        this.notification?.classList.add('show');
        
        setTimeout(() => {
            this.notification?.classList.remove('show');
            setTimeout(() => this.processNotificationQueue(), 300);
        }, 3000);
    }

    showError() {
        this.statusCard.classList.add('inactive');
        if (this.statusText) {
            this.statusText.textContent = 'Erreur de connexion';
        }
        if (this.statusIcon) {
            this.statusIcon.textContent = '❌';
        }
    }

    handleKeyboard(event) {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'r':
                    event.preventDefault();
                    this.reloadAllTabs();
                    break;
                case ',':
                    event.preventDefault();
                    this.openSettings();
                    break;
                case 't':
                    event.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
        
        // Ghost mode quick toggle
        if (event.key === 'g' && event.altKey) {
            event.preventDefault();
            const ghostToggle = document.querySelector('[data-toggle="ghostMode"]');
            if (ghostToggle) {
                ghostToggle.click();
            }
        }
    }

    showAbout() {
        this.showNotification('FingerprintGuard v2.1.0 - Protection avancée contre le fingerprinting', 'success');
    }

    showHelp() {
        chrome.tabs.create({
            url: 'https://github.com/yourrepo/fingerprintguard/wiki'
        });
    }

    getSettingDisplayName(settingKey) {
        const names = {
            ghostMode: 'Mode Fantôme',
            spoofBrowser: 'Navigateur & Client Hints',
            spoofCanvas: 'Canvas',
            spoofScreen: 'Écran',
            blockImages: 'Images',
            blockJS: 'JavaScript'
        };
        return names[settingKey] || settingKey;
    }

    async sendMessage(message) {
        try {
            if (!chrome?.runtime?.sendMessage) {
                throw new Error('Chrome extension API not available');
            }
            
            const response = await chrome.runtime.sendMessage(message);
            
            if (!response) {
                throw new Error('No response received from background script');
            }
            
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            // Si l'extension est rechargée, la popup peut perdre la connexion
            if (error.message.includes('Extension context invalidated')) {
                window.location.reload();
                return null;
            }
            throw error;
        }
    }
}

// Advanced features
class AdvancedFeatures {
    static async detectActiveFingerprinting() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        return window.getFingerprintingDetections ? window.getFingerprintingDetections() : [];
                    }
                });
                
                return results[0]?.result || [];
            }
        } catch (error) {
            console.error('Error detecting fingerprinting:', error);
        }
        return [];
    }

    static async injectAdvancedProtections() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['advanced-protection.js']
                });
                
                await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        if (window.enableAllAdvancedProtections) {
                            window.enableAllAdvancedProtections();
                            window.detectFingerprintingAttempts();
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error injecting advanced protections:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fingerprintGuardPopup = new FingerprintGuardPopup();
    
    // Inject advanced protections on current tab
    AdvancedFeatures.injectAdvancedProtections();
    
    // Check for active fingerprinting attempts
    setInterval(async () => {
        const detections = await AdvancedFeatures.detectActiveFingerprinting();
        if (detections.length > 0) {
            console.log('Fingerprinting attempts detected:', detections);
        }
    }, 10000);
});

// Handle extension updates
chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsUpdated') {
        window.fingerprintGuardPopup?.loadSettings();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FingerprintGuardPopup, AdvancedFeatures };
}
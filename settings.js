class FingerprintGuardSettings {
    constructor() {
        this.settings = {};
        this.theme = 'light';
        this.isDirty = false;

        this.elements = {
            themeToggle: document.getElementById('themeToggle'),
            saveButton: document.getElementById('saveSettings'),
            notification: document.getElementById('notification'),
            navLinks: document.querySelectorAll('.nav-link'),
            sections: document.querySelectorAll('.settings-section'),
            advancedSettingsContainer: document.getElementById('advanced-settings-container'),
            nonAdvancedModeMessage: document.getElementById('non-advanced-mode-message'),
            advancedSettingsFields: document.getElementById('advanced-settings-fields'),
            profileSettingsFields: document.getElementById('profile-settings-fields'),
            themeSelect: document.getElementById('theme-select'),
            autoReloadCurrent: document.getElementById('autoReloadCurrent'),
            modeIcon: document.getElementById('mode-icon'),
            modeName: document.getElementById('mode-name'),
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.updateUI();
        this.attachEventListeners();
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'getSettings' });
            if (response?.success) {
                this.settings = response.data;
                this.theme = this.settings.theme || 'light';
            } else {
                throw new Error('Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    updateUI() {
        this.applyTheme();

        if (this.settings.protectionMode === 'advanced') {
            this.elements.advancedSettingsContainer.style.display = 'block';
            this.elements.nonAdvancedModeMessage.style.display = 'none';
            this.populateForms();
        } else {
            this.elements.advancedSettingsContainer.style.display = 'none';
            this.elements.nonAdvancedModeMessage.style.display = 'block';
            const mode = this.settings.protectionMode;
            const modeInfo = {
                lucky: { icon: '🍀', name: 'I\'m Feeling Lucky' },
                ghost: { icon: '👻', name: 'Ghost Mode' }
            };
            const currentMode = modeInfo[mode] || { icon: '🛡️', name: 'Mode Actif' };
            this.elements.modeIcon.textContent = currentMode.icon;
            this.elements.modeName.textContent = currentMode.name;
        }
    }

    populateForms() {
        // General Settings
        this.elements.themeSelect.value = this.settings.theme;
        this.elements.autoReloadCurrent.checked = this.settings.autoReloadCurrent;

        // Advanced Protections
        this.elements.advancedSettingsFields.innerHTML = ''
        for (const key in this.settings.advancedSettings) {
            this.createBooleanField(this.elements.advancedSettingsFields, key, this.settings.advancedSettings[key], `advancedSettings`);
        }

        // Profile Settings
        this.elements.profileSettingsFields.innerHTML = ''
        for (const key in this.settings.profile) {
            this.createTextField(this.elements.profileSettingsFields, key, this.settings.profile[key], `profile`);
        }
    }

    createBooleanField(container, key, value, group) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label for="${group}-${key}">${key}</label>
            <input type="checkbox" id="${group}-${key}" class="form-checkbox" ${value ? 'checked' : ''}>
        `;
        container.appendChild(formGroup);
    }

    createTextField(container, key, value, group) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label for="${group}-${key}">${key}</label>
            <input type="text" id="${group}-${key}" class="form-input" value="${value}">
        `;
        container.appendChild(formGroup);
    }

    attachEventListeners() {
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.saveButton.addEventListener('click', () => this.saveAllSettings());

        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const sectionId = `${e.target.dataset.section}-section`;
                this.elements.sections.forEach(s => s.classList.remove('active'));
                document.getElementById(sectionId).classList.add('active');
                this.elements.navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Event delegation for dynamically created fields
        this.elements.advancedSettingsContainer.addEventListener('change', e => {
            this.isDirty = true;
            const [group, key] = e.target.id.split('-');
            if (this.settings[group]) {
                this.settings[group][key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            }
        });
        
        this.elements.themeSelect.addEventListener('change', e => {
            this.isDirty = true;
            this.settings.theme = e.target.value;
        });

        this.elements.autoReloadCurrent.addEventListener('change', e => {
            this.isDirty = true;
            this.settings.autoReloadCurrent = e.target.checked;
        });
    }

    async saveAllSettings() {
        if (!this.isDirty) {
            this.showNotification('Aucun changement à sauvegarder', 'info');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({ type: 'updateSetting', payload: this.settings });
            if (response?.success) {
                this.isDirty = false;
                this.showNotification('Paramètres sauvegardés avec succès!', 'success');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.settings.theme = this.theme;
        this.isDirty = true;
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        this.elements.themeToggle.textContent = this.theme === 'light' ? '🌙' : '☀️';
        this.elements.themeSelect.value = this.theme;
    }

    showNotification(message, type = 'info') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type} show`;
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FingerprintGuardSettings();
});
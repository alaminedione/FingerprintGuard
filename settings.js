class FingerprintGuardSettings {
    constructor() {
        this.settings = {};
        this.theme = 'light';
        this.isDirty = false;

        this.excludedProfileKeys = [
            'uaPlatform', 'uaPlatformVersion', 'uaArchitecture', 'uaBitness',
            'uaWow64', 'uaModel', 'uaFullVersion', 'secChUa',
            'secChUaMobile', 'secChUaPlatform', 'secChUaFullVersion',
            'secChUaPlatformVersion'
        ];

        // Données pour les listes déroulantes
        this.SPOOFING_DATA = {
            platforms: {
                'Windows NT 10.0; Win64; x64': { platform: 'Win32', hardwareConcurrency: [4, 8, 12, 16], deviceMemory: [4, 8, 16, 32], languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES'] },
                'Windows NT 10.0; WOW64': { platform: 'Win32', hardwareConcurrency: [2, 4, 8], deviceMemory: [4, 8, 16], languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE'] },
                'Macintosh; Intel Mac OS X 10_15_7': { platform: 'MacIntel', hardwareConcurrency: [4, 8, 12], deviceMemory: [8, 16, 32], languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE'] },
                'X11; Linux x86_64': { platform: 'Linux x86_64', hardwareConcurrency: [2, 4, 8, 16], deviceMemory: [4, 8, 16, 32], languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES'] }
            },
            screenResolutions: [
                { width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1440, height: 900 },
                { width: 1536, height: 864 }, { width: 1600, height: 900 }, { width: 2560, height: 1440 },
                { width: 3840, height: 2160 }
            ],
            devicePixelRatios: [1, 1.25, 1.5, 2, 2.5, 3],
            timezones: [
                'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
                'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
            ],
        };

        this.BROWSER_VERSIONS = {
            Chrome: [120, 119, 118, 117, 116, 115, 114, 113, 112, 111, 110],
            Firefox: [119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109],
            Safari: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
            Edge: [119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109],
            Opera: [104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94]
        };

        this.selectOptions = {
            'profile.platform': Object.keys(this.SPOOFING_DATA.platforms),
            'profile.browser': Object.keys(this.BROWSER_VERSIONS),
            'profile.spoofDevicePixelRatio': this.SPOOFING_DATA.devicePixelRatios.map(String),
            'profile.spoofScreenResolution': this.SPOOFING_DATA.screenResolutions.map(res => `${res.width}x${res.height}`),
            'profile.language': this.SPOOFING_DATA.platforms['Windows NT 10.0; Win64; x64'].languages, // Exemple, peut être amélioré
            'profile.hardwareConcurrency': Array.from(new Set(Object.values(this.SPOOFING_DATA.platforms).flatMap(p => p.hardwareConcurrency))).sort((a, b) => a - b).map(String),
            'profile.deviceMemory': Array.from(new Set(Object.values(this.SPOOFING_DATA.platforms).flatMap(p => p.deviceMemory))).sort((a, b) => a - b).map(String),
            'profile.timezone': this.SPOOFING_DATA.timezones,
        };
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
            actionsBar: document.getElementById('actions-bar-container'),
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
            this.elements.actionsBar.style.display = 'block';
            this.elements.nonAdvancedModeMessage.style.display = 'none';
            this.populateForms();
        } else {
            this.elements.advancedSettingsContainer.style.display = 'none';
            this.elements.actionsBar.style.display = 'none';
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
        this.elements.themeSelect.value = this.settings.theme;
        this.elements.autoReloadCurrent.checked = this.settings.autoReloadCurrent;

        this.populateGroup(this.elements.advancedSettingsFields, this.settings.advancedSettings, 'advancedSettings', 'Protections');
        this.populateGroup(this.elements.profileSettingsFields, this.settings.profile, 'profile', 'Profil d\'Empreinte');
    }

    populateGroup(container, settingsGroup, groupName, title) {
        container.innerHTML = ''; // Clear previous content
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-header"><h3>${title}</h3></div>`;
        const content = document.createElement('div');
        content.className = 'card-content form-grid';

        for (const key in settingsGroup) {
            // Exclure les clés dérivées du profil si le groupe est 'profile'
            if (groupName === 'profile' && this.excludedProfileKeys.includes(key)) {
                continue;
            }

            const fullKey = `${groupName}.${key}`;
            const value = settingsGroup[key];

            if (this.selectOptions[fullKey]) {
                this.createSelectField(content, key, value, groupName, this.selectOptions[fullKey]);
            } else if (typeof value === 'boolean') {
                this.createBooleanField(content, key, value, groupName);
            } else {
                this.createTextField(content, key, value, groupName);
            }
        }
        card.appendChild(content);
        container.appendChild(card);
    }

    createBooleanField(container, key, value, group) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        const label = document.createElement('label');
        label.className = 'toggle-switch-label';
        label.innerHTML = `
            <input type="checkbox" id="${group}-${key}" class="form-checkbox-hidden" ${value ? 'checked' : ''}>
            <span class="toggle-switch-ui"></span>
            ${this.formatLabel(key)}
        `;
        formGroup.appendChild(label);
        container.appendChild(formGroup);
    }

    createTextField(container, key, value, group) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label for="${group}-${key}">${this.formatLabel(key)}</label>
            <input type="text" id="${group}-${key}" class="form-input" value="${value}">
        `;
        container.appendChild(formGroup);
    }

    createSelectField(container, key, value, group, options) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        const selectId = `${group}-${key}`;
        let optionsHtml = options.map(optionValue => 
            `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${optionValue}</option>`
        ).join('');

        // Ajouter l'option 'random' si elle n'est pas déjà présente
        if (!options.includes('random')) {
            optionsHtml = `<option value="random" ${value === 'random' ? 'selected' : ''}>Random</option>` + optionsHtml;
        }

        formGroup.innerHTML = `
            <label for="${selectId}">${this.formatLabel(key)}</label>
            <select id="${selectId}" class="form-select">
                ${optionsHtml}
            </select>
        `;
        container.appendChild(formGroup);
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    attachEventListeners() {
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.saveButton.addEventListener('click', () => this.saveAllSettings());

        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const sectionId = `${e.currentTarget.dataset.section}-section`;
                this.elements.sections.forEach(s => s.classList.remove('active'));
                document.getElementById(sectionId).classList.add('active');
                this.elements.navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        this.elements.advancedSettingsContainer.addEventListener('change', e => {
            this.isDirty = true;
            const id = e.target.id;
            if (id === 'theme-select' || id === 'autoReloadCurrent') {
                 this.settings[id.replace('-select', '')] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            } else {
                const [group, key] = id.split('-');
                if (this.settings[group]) {
                    this.settings[group][key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                }
            }
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
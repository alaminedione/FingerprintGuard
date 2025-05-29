/**
 * Modern Settings Page for FingerprintGuard v2.1.0
 * Advanced configuration with reactive UI and profile management
 */

class FingerprintGuardSettings {
    constructor() {
        this.settings = {};
        this.profiles = [];
        this.currentProfile = null;
        this.theme = localStorage.getItem('fpg-theme') || 'light';
        this.isLoading = false;
        this.isDirty = false;
        this.autoSave = true;
        this.stats = {
            totalProfiles: 0,
            activeProtections: 0,
            lastUpdate: null
        };

        this.defaultSettings = {
            autoReloadAll: false,
            autoReloadCurrent: false,
            platform: 'random',
            language: 'random',
            hardwareConcurrency: 0,
            deviceMemory: 0,
            minVersion: 0,
            maxVersion: 0,
            uaPlatform: 'random',
            uaPlatformVersion: 'random',
            uaArchitecture: 'random',
            uaBitness: 'random',
            uaWow64: 'random',
            uaModel: 'random',
            uaFullVersion: 'random',
            browser: 'random',
            secChUa: 'random',
            secChUaMobile: 'random',
            secChUaPlatform: 'random',
            secChUaFullVersion: 'random',
            secChUaPlatformVersion: 'random',
            hDeviceMemory: 0,
            contentEncoding: 'random',
            spoofDeviceType: 'random',
            spoofDevicePixelRatio: 'random',
            spoofScreenResolution: 'random',
            spoofScreen: false,
            useFixedProfile: false,
            generateNewProfileOnStart: false,
            activeProfileId: null,
            profiles: [],
            advancedProtection: {
                webrtc: true,
                audio: true,
                fonts: true,
                timezone: true,
                experimental: true
            }
        };

        this.sections = [
            { id: 'general', title: 'Général', icon: '⚙️' },
            { id: 'navigator', title: 'Navigateur', icon: '🧭' },
            { id: 'useragent', title: 'User-Agent', icon: '🆔' },
            { id: 'headers', title: 'En-têtes', icon: '📡' },
            { id: 'screen', title: 'Écran', icon: '📺' },
            { id: 'profiles', title: 'Profils', icon: '👥' },
            { id: 'advanced', title: 'Avancé', icon: '🛡️' },
            { id: 'stats', title: 'Statistiques', icon: '📊' }
        ];

        this.init();
    }

    async init() {
        this.createUI();
        this.attachEventListeners();
        this.applyTheme();
        await this.loadData();
        this.updateUI();
        this.startAutoSave();
        this.showSection('general');
    }

    createUI() {
        document.body.innerHTML = `
            <div class="container">
                <header class="page-header">
                    <div class="page-header-content">
                        <div class="page-title">
                            <div class="page-title-icon">🛡️</div>
                            <div>
                                <h1>Paramètres FingerprintGuard</h1>
                                <div class="page-subtitle">Configuration avancée et gestion des profils</div>
                            </div>
                        </div>
                        <button id="themeToggle" class="theme-toggle" title="Changer de thème">🌙</button>
                    </div>
                </header>

                <div class="settings-grid">
                    <nav class="settings-nav">
                        <div class="nav-title">Navigation</div>
                        <ul class="nav-list" id="navList"></ul>
                    </nav>

                    <main class="settings-content">
                        <div id="settingsSections"></div>
                    </main>
                </div>

                <div class="actions-bar">
                    <div class="actions-left">
                        <button id="resetSettings" class="btn secondary">
                            <span>🔄</span>
                            Réinitialiser
                        </button>
                        <button id="exportData" class="btn secondary">
                            <span>📤</span>
                            Exporter
                        </button>
                        <input type="file" id="importFile" accept=".json" style="display: none;">
                        <button id="importData" class="btn secondary">
                            <span>📥</span>
                            Importer
                        </button>
                    </div>
                    
                    <div class="actions-right">
                        <div id="saveStatus" class="status-badge inactive">
                            <div class="status-indicator"></div>
                            <span id="saveStatusText">Non sauvé</span>
                        </div>
                        <button id="saveSettings" class="btn primary large">
                            <span>💾</span>
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>

            <div id="notification" class="notification">
                <span id="notificationText"></span>
            </div>
        `;

        this.createNavigation();
        this.createSections();
    }

    createNavigation() {
        const navList = document.getElementById('navList');
        
        this.sections.forEach(section => {
            const listItem = document.createElement('li');
            listItem.className = 'nav-item';
            listItem.innerHTML = `
                <a href="#${section.id}" class="nav-link" data-section="${section.id}">
                    <span class="nav-icon">${section.icon}</span>
                    <span>${section.title}</span>
                </a>
            `;
            navList.appendChild(listItem);
        });
    }

    createSections() {
        const container = document.getElementById('settingsSections');
        
        // Section Général
        container.appendChild(this.createGeneralSection());
        
        // Section Navigateur
        container.appendChild(this.createNavigatorSection());
        
        // Section User-Agent
        container.appendChild(this.createUserAgentSection());
        
        // Section En-têtes
        container.appendChild(this.createHeadersSection());
        
        // Section Écran
        container.appendChild(this.createScreenSection());
        
        // Section Profils
        container.appendChild(this.createProfilesSection());
        
        // Section Avancé
        container.appendChild(this.createAdvancedSection());
        
        // Section Statistiques
        container.appendChild(this.createStatsSection());
    }

    createGeneralSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-general';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">⚙️</div>
                <div>
                    <h2 class="section-title">Paramètres Généraux</h2>
                    <p class="section-description">Configuration de base de l'extension</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="toggle-group" data-setting="autoReloadAll">
                    <div class="toggle-info">
                        <div class="toggle-icon">🔄</div>
                        <div class="toggle-details">
                            <h4>Rechargement automatique (tous)</h4>
                            <p>Recharge automatiquement tous les onglets lors des changements</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="autoReloadAll">
                        <input type="checkbox" id="autoReloadAll" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="autoReloadCurrent">
                    <div class="toggle-info">
                        <div class="toggle-icon">🔄</div>
                        <div class="toggle-details">
                            <h4>Rechargement automatique (actuel)</h4>
                            <p>Recharge uniquement l'onglet actuel lors des changements</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="autoReloadCurrent">
                        <input type="checkbox" id="autoReloadCurrent" hidden>
                    </div>
                </div>
            </div>

            <div class="info-card">
                <div class="card-title">
                    <span class="card-icon">💡</span>
                    Conseil
                </div>
                <p>Activez le rechargement automatique pour appliquer immédiatement vos modifications. Le rechargement de l'onglet actuel est plus rapide.</p>
            </div>
        `;
        return section;
    }

    createNavigatorSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-navigator';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">🧭</div>
                <div>
                    <h2 class="section-title">Propriétés du Navigateur</h2>
                    <p class="section-description">Configuration du spoofing des propriétés navigator</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="platform">
                        Plateforme
                        <span class="label-badge">Navigator.platform</span>
                    </label>
                    <select class="form-select" id="platform">
                        <option value="random">Aléatoire</option>
                        <option value="Win32">Windows</option>
                        <option value="MacIntel">macOS</option>
                        <option value="Linux x86_64">Linux</option>
                        <option value="iPhone">iPhone</option>
                        <option value="iPad">iPad</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="language">
                        Langue
                        <span class="label-badge">Navigator.language</span>
                    </label>
                    <select class="form-select" id="language">
                        <option value="random">Aléatoire</option>
                        <option value="fr-FR">Français</option>
                        <option value="en-US">Anglais (US)</option>
                        <option value="en-GB">Anglais (UK)</option>
                        <option value="es-ES">Espagnol</option>
                        <option value="de-DE">Allemand</option>
                        <option value="it-IT">Italien</option>
                        <option value="ja-JP">Japonais</option>
                        <option value="zh-CN">Chinois</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="hardwareConcurrency">
                        Cœurs CPU
                        <span class="label-badge">Navigator.hardwareConcurrency</span>
                    </label>
                    <select class="form-select" id="hardwareConcurrency">
                        <option value="0">Aléatoire</option>
                        <option value="2">2 cœurs</option>
                        <option value="4">4 cœurs</option>
                        <option value="6">6 cœurs</option>
                        <option value="8">8 cœurs</option>
                        <option value="12">12 cœurs</option>
                        <option value="16">16 cœurs</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="deviceMemory">
                        Mémoire Dispositif (GB)
                        <span class="label-badge">Navigator.deviceMemory</span>
                    </label>
                    <select class="form-select" id="deviceMemory">
                        <option value="0">Aléatoire</option>
                        <option value="2">2 GB</option>
                        <option value="4">4 GB</option>
                        <option value="8">8 GB</option>
                        <option value="16">16 GB</option>
                        <option value="32">32 GB</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="minVersion">Version Min</label>
                    <input type="number" class="form-input" id="minVersion" min="80" max="130" placeholder="80">
                </div>

                <div class="form-group">
                    <label class="form-label" for="maxVersion">Version Max</label>
                    <input type="number" class="form-input" id="maxVersion" min="80" max="130" placeholder="120">
                </div>
            </div>
        `;
        return section;
    }

    createUserAgentSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-useragent';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">🆔</div>
                <div>
                    <h2 class="section-title">User-Agent Data</h2>
                    <p class="section-description">Configuration des données Client Hints</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="browser">Navigateur</label>
                    <select class="form-select" id="browser">
                        <option value="random">Aléatoire</option>
                        <option value="Chrome">Chrome</option>
                        <option value="Firefox">Firefox</option>
                        <option value="Safari">Safari</option>
                        <option value="Edge">Edge</option>
                        <option value="Opera">Opera</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="uaPlatform">Plateforme UA</label>
                    <select class="form-select" id="uaPlatform">
                        <option value="random">Aléatoire</option>
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="Linux">Linux</option>
                        <option value="Android">Android</option>
                        <option value="iOS">iOS</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="uaArchitecture">Architecture</label>
                    <select class="form-select" id="uaArchitecture">
                        <option value="random">Aléatoire</option>
                        <option value="x86">x86</option>
                        <option value="x64">x64</option>
                        <option value="arm">ARM</option>
                        <option value="arm64">ARM64</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="uaBitness">Bitness</label>
                    <select class="form-select" id="uaBitness">
                        <option value="random">Aléatoire</option>
                        <option value="32">32-bit</option>
                        <option value="64">64-bit</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="uaPlatformVersion">Version Plateforme</label>
                    <input type="text" class="form-input" id="uaPlatformVersion" placeholder="random">
                </div>

                <div class="form-group">
                    <label class="form-label" for="uaModel">Modèle</label>
                    <input type="text" class="form-input" id="uaModel" placeholder="random">
                </div>
            </div>
        `;
        return section;
    }

    createHeadersSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-headers';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">📡</div>
                <div>
                    <h2 class="section-title">En-têtes HTTP</h2>
                    <p class="section-description">Configuration des en-têtes Client Hints</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="secChUa">Sec-CH-UA</label>
                    <input type="text" class="form-input" id="secChUa" placeholder="random">
                </div>

                <div class="form-group">
                    <label class="form-label" for="secChUaMobile">Sec-CH-UA-Mobile</label>
                    <select class="form-select" id="secChUaMobile">
                        <option value="random">Aléatoire</option>
                        <option value="?0">Bureau (?0)</option>
                        <option value="?1">Mobile (?1)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="secChUaPlatform">Sec-CH-UA-Platform</label>
                    <input type="text" class="form-input" id="secChUaPlatform" placeholder="random">
                </div>

                <div class="form-group">
                    <label class="form-label" for="secChUaFullVersion">Sec-CH-UA-Full-Version</label>
                    <input type="text" class="form-input" id="secChUaFullVersion" placeholder="random">
                </div>

                <div class="form-group">
                    <label class="form-label" for="hDeviceMemory">Device-Memory</label>
                    <select class="form-select" id="hDeviceMemory">
                        <option value="0">Aléatoire</option>
                        <option value="0.25">0.25</option>
                        <option value="0.5">0.5</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="4">4</option>
                        <option value="8">8</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="contentEncoding">Accept-Encoding</label>
                    <select class="form-select" id="contentEncoding">
                        <option value="random">Aléatoire</option>
                        <option value="gzip">gzip</option>
                        <option value="gzip, deflate">gzip, deflate</option>
                        <option value="gzip, deflate, br">gzip, deflate, br</option>
                    </select>
                </div>
            </div>
        `;
        return section;
    }

    createScreenSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-screen';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">📺</div>
                <div>
                    <h2 class="section-title">Propriétés d'Écran</h2>
                    <p class="section-description">Configuration du spoofing d'écran</p>
                </div>
            </div>

            <div class="toggle-group" data-setting="spoofScreen">
                <div class="toggle-info">
                    <div class="toggle-icon">📺</div>
                    <div class="toggle-details">
                        <h4>Activer le Spoofing d'Écran</h4>
                        <p>Falsifie les propriétés de résolution et de ratio</p>
                    </div>
                </div>
                <div class="toggle-switch" data-toggle="spoofScreen">
                    <input type="checkbox" id="spoofScreen" hidden>
                </div>
            </div>

            <div class="form-grid" id="screenOptions">
                <div class="form-group">
                    <label class="form-label" for="spoofDeviceType">Type d'Appareil</label>
                    <select class="form-select" id="spoofDeviceType">
                        <option value="random">Aléatoire</option>
                        <option value="desktop">Bureau</option>
                        <option value="mobile">Mobile</option>
                        <option value="tablet">Tablette</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="spoofDevicePixelRatio">Ratio de Pixels</label>
                    <select class="form-select" id="spoofDevicePixelRatio">
                        <option value="random">Aléatoire</option>
                        <option value="1">1.0</option>
                        <option value="1.25">1.25</option>
                        <option value="1.5">1.5</option>
                        <option value="2">2.0</option>
                        <option value="3">3.0</option>
                    </select>
                </div>

                <div class="form-group full-width">
                    <label class="form-label" for="spoofScreenResolution">
                        Résolution
                        <span class="label-badge">Format: largeur x hauteur</span>
                    </label>
                    <input type="text" class="form-input" id="spoofScreenResolution" placeholder="1920x1080 ou random">
                </div>
            </div>
        `;
        return section;
    }

    createProfilesSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-profiles';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">👥</div>
                <div>
                    <h2 class="section-title">Gestion des Profils</h2>
                    <p class="section-description">Créez et gérez des profils de spoofing cohérents</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="toggle-group" data-setting="useFixedProfile">
                    <div class="toggle-info">
                        <div class="toggle-icon">📌</div>
                        <div class="toggle-details">
                            <h4>Utiliser un Profil Fixe</h4>
                            <p>Maintient une identité cohérente entre les sessions</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="useFixedProfile">
                        <input type="checkbox" id="useFixedProfile" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="generateNewProfileOnStart">
                    <div class="toggle-info">
                        <div class="toggle-icon">🔄</div>
                        <div class="toggle-details">
                            <h4>Nouveau Profil au Démarrage</h4>
                            <p>Génère automatiquement un nouveau profil au démarrage</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="generateNewProfileOnStart">
                        <input type="checkbox" id="generateNewProfileOnStart" hidden>
                    </div>
                </div>
            </div>

            <div class="actions-bar">
                <div class="actions-left">
                    <button id="newProfile" class="btn primary">
                        <span>➕</span>
                        Nouveau Profil
                    </button>
                    <button id="duplicateProfile" class="btn secondary">
                        <span>📋</span>
                        Dupliquer
                    </button>
                </div>
                <div class="actions-right">
                    <button id="deleteProfile" class="btn danger">
                        <span>🗑️</span>
                        Supprimer
                    </button>
                </div>
            </div>

            <div id="profilesList" class="profile-list"></div>

            <div id="activeProfileInfo" class="info-card">
                <div class="card-title">
                    <span class="card-icon">ℹ️</span>
                    Profil Actif
                </div>
                <div id="activeProfileDetails">Aucun profil actif</div>
            </div>
        `;
        return section;
    }

    createAdvancedSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-advanced';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">🛡️</div>
                <div>
                    <h2 class="section-title">Protections Avancées</h2>
                    <p class="section-description">Fonctionnalités de protection supplémentaires</p>
                </div>
            </div>

            <div class="warning-card">
                <div class="card-title">
                    <span class="card-icon">⚠️</span>
                    Attention
                </div>
                <p>Ces protections avancées peuvent affecter le fonctionnement de certains sites web. Utilisez avec précaution.</p>
            </div>

            <div class="form-grid">
                <div class="toggle-group" data-setting="advancedProtection.webrtc">
                    <div class="toggle-info">
                        <div class="toggle-icon">🌐</div>
                        <div class="toggle-details">
                            <h4>Protection WebRTC</h4>
                            <p>Empêche les fuites d'IP et le fingerprinting WebRTC</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="advancedProtection.webrtc">
                        <input type="checkbox" id="advancedWebRTC" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="advancedProtection.audio">
                    <div class="toggle-info">
                        <div class="toggle-icon">🔊</div>
                        <div class="toggle-details">
                            <h4>Protection Audio</h4>
                            <p>Ajoute du bruit au fingerprinting audio</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="advancedProtection.audio">
                        <input type="checkbox" id="advancedAudio" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="advancedProtection.fonts">
                    <div class="toggle-info">
                        <div class="toggle-icon">🔤</div>
                        <div class="toggle-details">
                            <h4>Protection Fonts</h4>
                            <p>Limite la détection des polices installées</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="advancedProtection.fonts">
                        <input type="checkbox" id="advancedFonts" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="advancedProtection.timezone">
                    <div class="toggle-info">
                        <div class="toggle-icon">🕐</div>
                        <div class="toggle-details">
                            <h4>Protection Timezone</h4>
                            <p>Falsifie les informations de fuseau horaire</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="advancedProtection.timezone">
                        <input type="checkbox" id="advancedTimezone" hidden>
                    </div>
                </div>

                <div class="toggle-group" data-setting="advancedProtection.experimental">
                    <div class="toggle-info">
                        <div class="toggle-icon">🧪</div>
                        <div class="toggle-details">
                            <h4>Protection Expérimentale</h4>
                            <p>Masque les API expérimentales et sensibles</p>
                        </div>
                    </div>
                    <div class="toggle-switch" data-toggle="advancedProtection.experimental">
                        <input type="checkbox" id="advancedExperimental" hidden>
                    </div>
                </div>
            </div>
        `;
        return section;
    }

    createStatsSection() {
        const section = document.createElement('section');
        section.className = 'settings-section';
        section.id = 'section-stats';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-icon">📊</div>
                <div>
                    <h2 class="section-title">Statistiques</h2>
                    <p class="section-description">Aperçu de l'utilisation et des performances</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value" id="statProfiles">0</div>
                    <div class="stat-label">Profils</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🛡️</div>
                    <div class="stat-value" id="statProtections">0</div>
                    <div class="stat-label">Protections Actives</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-value" id="statLastUpdate">-</div>
                    <div class="stat-label">Dernière MàJ</div>
                </div>
            </div>
        `;
        return section;
    }

    attachEventListeners() {
        console.log('Attaching event listeners...');
        const themeToggleButton = document.getElementById('themeToggle');
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => this.toggleTheme());
        }

        const saveButton = document.getElementById('saveSettings');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveData());
        }
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const sectionId = event.currentTarget.dataset.section;
                if (sectionId) {
                    this.showSection(sectionId);
                }
            });
        });

        const inputs = document.querySelectorAll('.form-input, .form-select, .toggle-switch input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', (event) => this.handleInputChange(event.target));
            if (input.hidden && input.closest('.toggle-switch')) {
                // For visually styled toggles where the checkbox is hidden
                input.closest('.toggle-switch').addEventListener('click', () => {
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }
        });
        
        const resetSettingsButton = document.getElementById('resetSettings');
        if (resetSettingsButton) {
            resetSettingsButton.addEventListener('click', () => this.resetToDefaults());
        }

        const importButton = document.getElementById('importData');
        const importFile = document.getElementById('importFile');
        if (importButton && importFile) {
            importButton.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (event) => this.importSettings(event));
        }

        const exportButton = document.getElementById('exportData');
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportSettings());
        }

        // Profile management buttons
        document.getElementById('newProfile')?.addEventListener('click', () => this.createNewProfile());
        document.getElementById('duplicateProfile')?.addEventListener('click', () => this.duplicateProfile());
        document.getElementById('deleteProfile')?.addEventListener('click', () => this.deleteSelectedProfile());
        document.getElementById('profilesList')?.addEventListener('click', (e) => this.handleProfileActions(e));
    }

    applyTheme() {
        document.body.className = this.theme;
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';
            themeToggle.title = this.theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre';
        }
    }

    async loadData() {
        this.isLoading = true;
        this.updateSaveStatus();
        try {
            const storedSettings = await chrome.storage.local.get(null); // Get all stored data
            // Deep merge defaultSettings with storedSettings
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings)); // Start with defaults

            for (const key in storedSettings) {
                if (this.settings.hasOwnProperty(key)) {
                    if (typeof this.settings[key] === 'object' && this.settings[key] !== null && !Array.isArray(this.settings[key])) {
                        // Merge objects (like advancedProtection)
                        this.settings[key] = { ...this.settings[key], ...storedSettings[key] };
                    } else {
                        this.settings[key] = storedSettings[key];
                    }
                } else {
                     // If key from storage is not in defaults, add it (might be from older version or new feature)
                    this.settings[key] = storedSettings[key];
                }
            }
            
            this.profiles = this.settings.profiles || [];
            this.currentProfile = this.settings.activeProfileId ? this.profiles.find(p => p.id === this.settings.activeProfileId) : null;
            this.theme = localStorage.getItem('fpg-theme') || 'light';

            this.stats.totalProfiles = this.profiles.length;
            this.stats.activeProtections = this.countActiveProtections();
            this.stats.lastUpdate = this.settings.lastUpdate || null;

        } catch (e) {
            console.error("Error loading settings:", e);
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings)); // Fallback to deep copy of defaults
        }
        this.isLoading = false;
        this.isDirty = false;
        this.applyTheme();
        this.updateUI();
        this.updateSaveStatus();
    }

    updateUI() {
        if (this.isLoading) return;

        for (const key in this.settings) {
            if (key === 'profiles' || key === 'activeProfileId' || key === 'lastUpdate') continue;

            if (key === 'advancedProtection' && typeof this.settings[key] === 'object' && this.settings[key] !== null) {
                for (const subKey in this.settings[key]) {
                    const elementId = `advanced${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`;
                    const element = document.getElementById(elementId);
                    if (element && element.type === 'checkbox') {
                        element.checked = this.settings[key][subKey];
                        const toggleSwitch = element.closest('.toggle-switch');
                        if (toggleSwitch) {
                            if (element.checked) toggleSwitch.classList.add('active');
                            else toggleSwitch.classList.remove('active');
                        }
                    }
                }
            } else {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = this.settings[key];
                        const toggleSwitch = element.closest('.toggle-switch');
                        if (toggleSwitch) {
                            if (element.checked) toggleSwitch.classList.add('active');
                            else toggleSwitch.classList.remove('active');
                        }
                    } else if (element.tagName === 'SELECT' || element.type === 'text' || element.type === 'number') {
                        element.value = this.settings[key];
                    }
                }
            }
        }
        
        const statProfilesEl = document.getElementById('statProfiles');
        if (statProfilesEl) statProfilesEl.textContent = this.stats.totalProfiles;
        
        const statProtectionsEl = document.getElementById('statProtections');
        if (statProtectionsEl) statProtectionsEl.textContent = this.countActiveProtections();
        
        const statLastUpdateEl = document.getElementById('statLastUpdate');
        if (statLastUpdateEl) statLastUpdateEl.textContent = this.stats.lastUpdate ? new Date(this.stats.lastUpdate).toLocaleString() : 'Jamais';

        this.updateSaveStatus();
        this.renderProfilesList();
        this.updateActiveProfileDisplay();
    }

    startAutoSave() {
        if (this.autoSave) {
            console.log("Auto-save enabled. Changes will be saved automatically via handleInputChange.");
        }
    }

    showSection(sectionId) {
        const navList = document.getElementById('navList');
        if (!navList || !document.getElementById(`section-${sectionId}`)) {
             console.warn(`Section or navList not found for ${sectionId}`);
             return;
        }

        document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
        document.getElementById(`section-${sectionId}`).style.display = 'block';

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('fpg-theme', this.theme);
        this.applyTheme();
    }
    
    handleInputChange(element) {
        if (!element || !element.id) return;
        
        let key = element.id;
        let value;

        if (element.type === 'checkbox') {
            value = element.checked;
        } else if (element.type === 'number') {
            value = parseFloat(element.value);
            if (isNaN(value)) { // Handle case where input might be empty or non-numeric
                 value = element.min ? parseFloat(element.min) : 0; // Fallback to min or 0
            }
        } else {
            value = element.value;
        }
        
        const isAdvancedProtectionKey = key.startsWith('advanced');
        if (isAdvancedProtectionKey) {
            const subKey = key.replace('advanced', '').charAt(0).toLowerCase() + key.replace('advanced', '').slice(1);
            if (this.settings.advancedProtection && this.settings.advancedProtection.hasOwnProperty(subKey)) {
                this.settings.advancedProtection[subKey] = value;
            }
        } else if (this.settings.hasOwnProperty(key)) {
             this.settings[key] = value;
        } else {
            console.warn(`Unknown setting key: ${key}`);
            return; // Do not proceed if key is not recognized
        }

        this.isDirty = true;
        if (this.autoSave) {
            this.saveData();
        } else {
            this.updateSaveStatus();
        }
        
        if (element.type === 'checkbox' && element.closest('.toggle-switch')) {
            const toggleSwitch = element.closest('.toggle-switch');
            if (element.checked) {
                toggleSwitch.classList.add('active');
            } else {
                toggleSwitch.classList.remove('active');
            }
        }
    }

    async saveData() {
        this.settings.lastUpdate = new Date().toISOString();
        this.stats.lastUpdate = this.settings.lastUpdate;
        this.stats.activeProtections = this.countActiveProtections(); // Recalculate active protections

        try {
            await chrome.storage.local.set(this.settings);
            this.isDirty = false;
            this.showNotification('Paramètres sauvegardés avec succès!', 'success');
        } catch (e) {
            console.error("Error saving settings:", e);
            this.showNotification("Erreur lors de la sauvegarde des paramètres.", 'error');
        }
        this.updateSaveStatus();
        this.updateUI(); // Refresh UI, e.g., "Last Update" stat and active protections
    }
    
    resetToDefaults() {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut? Cette action est irréversible.")) {
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
            this.profiles = []; // Also reset profiles array in memory
            this.settings.profiles = []; // And in settings to be saved
            this.settings.activeProfileId = null;
            this.currentProfile = null;
            // Reset theme to default if stored separately
            localStorage.removeItem('fpg-theme');
            this.theme = 'light'; // Default theme

            this.saveData().then(() => {
                 this.showNotification('Paramètres réinitialisés aux valeurs par défaut.', 'info');
                 this.loadData(); // Reload data and refresh UI completely
            });
        }
    }

    exportSettings() {
        try {
            const settingsString = JSON.stringify(this.settings, null, 2);
            const blob = new Blob([settingsString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fingerprintguard_settings_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showNotification('Paramètres exportés avec succès.', 'info');
        } catch (e) {
            console.error("Error exporting settings:", e);
            this.showNotification("Erreur lors de l'exportation des paramètres.", 'error');
        }
    }

    async importSettings(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedSettings = JSON.parse(e.target.result);
                    // Add more robust validation/migration logic if needed
                    this.settings = { ...JSON.parse(JSON.stringify(this.defaultSettings)), ...importedSettings };
                    
                    if (importedSettings.advancedProtection) {
                         this.settings.advancedProtection = { ...this.defaultSettings.advancedProtection, ...importedSettings.advancedProtection};
                    } else {
                         this.settings.advancedProtection = { ...this.defaultSettings.advancedProtection };
                    }
                    this.profiles = this.settings.profiles || [];
                    this.settings.activeProfileId = importedSettings.activeProfileId || null;
                    
                    await this.saveData();
                    this.showNotification('Paramètres importés avec succès!', 'success');
                    await this.loadData();
                } catch (err) {
                    console.error("Error importing settings:", err);
                    this.showNotification("Erreur d'importation: Fichier invalide ou corrompu.", 'error');
                }
            };
            reader.onerror = () => {
                this.showNotification("Erreur de lecture du fichier.", 'error');
            };
            reader.readAsText(file);
            event.target.value = null;
        }
    }
    
    countActiveProtections() {
        let count = 0;
        if (this.settings.spoofScreen) count++;
        // Check navigator spoofing (if any specific property implies "active")
        // Example: if platform is not 'random' or default
        if (this.settings.platform !== 'random' && this.settings.platform !== this.defaultSettings.platform) count++;
        
        if (this.settings.advancedProtection) {
            for (const key in this.settings.advancedProtection) {
                if (this.settings.advancedProtection[key] === true) {
                    count++;
                }
            }
        }
        // Add more specific checks based on your extension's logic
        // For example, if user agent spoofing is active, etc.
        return count;
    }

    updateSaveStatus() {
        const saveStatusEl = document.getElementById('saveStatus');
        const saveStatusTextEl = document.getElementById('saveStatusText');
        if (!saveStatusEl || !saveStatusTextEl) return;

        if (this.isLoading) {
            saveStatusEl.className = 'status-badge loading';
            saveStatusTextEl.textContent = 'Chargement...';
        } else if (this.isDirty) {
            saveStatusEl.className = 'status-badge dirty';
            saveStatusTextEl.textContent = 'Non Sauvé';
        } else {
            saveStatusEl.className = 'status-badge saved';
            saveStatusTextEl.textContent = 'Sauvegardé';
        }
    }

    showNotification(message, type = 'info') {
        const notificationEl = document.getElementById('notification');
        const notificationTextEl = document.getElementById('notificationText');
        if (!notificationEl || !notificationTextEl) {
            console.warn("Notification elements not found.");
            return;
        }

        notificationTextEl.textContent = message;
        // Reset classes, then add new ones
        notificationEl.className = 'notification';
        // Force reflow to restart animation if message is the same
        void notificationEl.offsetWidth;
        notificationEl.classList.add('show', type);

        // Clear previous timeout if any
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        this.notificationTimeout = setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 3000);
    }

/**
     * Rend la liste des profils dans l'interface utilisateur.
     */
    renderProfilesList() {
        const profilesListEl = document.getElementById('profilesList');
        if (!profilesListEl) return;

        profilesListEl.innerHTML = ''; // Clear existing list

        if (this.profiles.length === 0) {
            profilesListEl.innerHTML = '<p class="no-profiles">Aucun profil enregistré. Créez-en un nouveau !</p>';
            return;
        }

        this.profiles.forEach(profile => {
            const profileItem = document.createElement('div');
            profileItem.className = `profile-item ${this.settings.useFixedProfile && this.settings.activeProfileId === profile.id ? 'active' : ''}`;
            profileItem.dataset.profileId = profile.id;
            profileItem.innerHTML = `
                <div class="profile-details-summary">
                    <span class="profile-name">${profile.name || `Profil ${profile.id.substring(3, 9)}`}</span>
                    <span class="profile-meta">${new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-small btn-primary activate-profile" data-id="${profile.id}">Activer</button>
                    <button class="btn btn-small btn-danger delete-profile" data-id="${profile.id}">Supprimer</button>
                </div>
            `;
            profilesListEl.appendChild(profileItem);
        });
    }

    /**
     * Met à jour l'affichage du profil actif.
     */
    updateActiveProfileDisplay() {
        const activeProfileInfoEl = document.getElementById('activeProfileInfo');
        const activeProfileDetailsEl = document.getElementById('activeProfileDetails');
        if (!activeProfileInfoEl || !activeProfileDetailsEl) return;

        if (this.settings.useFixedProfile && this.currentProfile) {
            activeProfileInfoEl.classList.add('active');
            activeProfileDetailsEl.innerHTML = `
                <p><strong>ID:</strong> ${this.currentProfile.id}</p>
                <p><strong>Créé le:</strong> ${new Date(this.currentProfile.createdAt).toLocaleString()}</p>
                <p><strong>Navigateur:</strong> ${this.currentProfile.fakeUserAgent?.userAgent?.split('Chrome/')[1]?.split(' ')[0] || 'N/A'}</p>
                <p><strong>Plateforme:</strong> ${this.currentProfile.fakeNavigator?.platform || 'N/A'}</p>
                <p><strong>Langue:</strong> ${this.currentProfile.fakeNavigator?.language || 'N/A'}</p>
                <p><strong>Cœurs CPU:</strong> ${this.currentProfile.fakeNavigator?.hardwareConcurrency || 'N/A'}</p>
                <p><strong>Mémoire:</strong> ${this.currentProfile.fakeNavigator?.deviceMemory || 'N/A'} GB</p>
            `;
        } else {
            activeProfileInfoEl.classList.remove('active');
            activeProfileDetailsEl.textContent = 'Aucun profil actif';
        }
    }

    /**
     * Gère les actions des boutons de profil (Activer, Supprimer).
     * @param {Event} event - L'événement de clic.
     */
    async handleProfileActions(event) {
        const target = event.target;
        const profileId = target.dataset.id;

        if (!profileId) return;

        if (target.classList.contains('activate-profile')) {
            await this.activateSelectedProfile(profileId);
        } else if (target.classList.contains('delete-profile')) {
            await this.deleteSelectedProfile(profileId);
        }
    }

    /**
     * Crée un nouveau profil en envoyant un message au service worker.
     */
    async createNewProfile() {
        try {
            this.showNotification('Génération d\'un nouveau profil...', 'info');
            const response = await chrome.runtime.sendMessage({ type: 'generateNewProfile' });
            if (response && response.success) {
                this.profiles.push(response.data);
                this.settings.profiles = this.profiles; // Update settings object for saving
                await this.saveData(); // Save profiles to storage
                this.showNotification('Nouveau profil créé et sauvegardé!', 'success');
                this.renderProfilesList();
                this.stats.totalProfiles = this.profiles.length;
                this.updateUI(); // Refresh stats
            } else {
                throw new Error(response?.error || 'Échec de la génération du profil.');
            }
        } catch (error) {
            console.error('Erreur lors de la création du profil:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
        }
    }

    /**
     * Duplique le profil actuellement sélectionné.
     */
    async duplicateProfile() {
        const selectedProfileItem = document.querySelector('.profile-item.active');
        if (!selectedProfileItem) {
            this.showNotification('Veuillez sélectionner un profil à dupliquer.', 'warning');
            return;
        }
        const profileIdToDuplicate = selectedProfileItem.dataset.profileId;
        const profileToDuplicate = this.profiles.find(p => p.id === profileIdToDuplicate);

        if (!profileToDuplicate) {
            this.showNotification('Profil à dupliquer introuvable.', 'error');
            return;
        }

        try {
            this.showNotification('Duplication du profil...', 'info');
            // Create a deep copy to ensure no reference issues
            const duplicatedProfile = JSON.parse(JSON.stringify(profileToDuplicate));
            duplicatedProfile.id = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_copy`;
            duplicatedProfile.createdAt = new Date().toISOString();
            duplicatedProfile.name = `${profileToDuplicate.name || `Profil ${profileIdToDuplicate.substring(3, 9)}`} (Copie)`;

            this.profiles.push(duplicatedProfile);
            this.settings.profiles = this.profiles; // Update settings object for saving
            await this.saveData(); // Save profiles to storage
            this.showNotification('Profil dupliqué avec succès!', 'success');
            this.renderProfilesList();
            this.stats.totalProfiles = this.profiles.length;
            this.updateUI(); // Refresh stats
        } catch (error) {
            console.error('Erreur lors de la duplication du profil:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
        }
    }

    /**
     * Supprime le profil sélectionné.
     * @param {string} profileId - L'ID du profil à supprimer.
     */
    async deleteSelectedProfile(profileId) {
        if (!profileId) {
            const selectedProfileItem = document.querySelector('.profile-item.active');
            if (!selectedProfileItem) {
                this.showNotification('Veuillez sélectionner un profil à supprimer.', 'warning');
                return;
            }
            profileId = selectedProfileItem.dataset.profileId;
        }

        if (this.settings.activeProfileId === profileId) {
            this.showNotification('Impossible de supprimer le profil actif. Veuillez en activer un autre d\'abord.', 'warning');
            return;
        }

        if (!confirm(`Êtes-vous sûr de vouloir supprimer le profil ${profileId} ?`)) {
            return;
        }

        try {
            this.showNotification('Suppression du profil...', 'info');
            const response = await chrome.runtime.sendMessage({ type: 'deleteProfile', id: profileId });
            if (response && response.success) {
                this.profiles = this.profiles.filter(p => p.id !== profileId);
                this.settings.profiles = this.profiles; // Update settings object for saving
                await this.saveData(); // Save profiles to storage
                this.showNotification('Profil supprimé avec succès!', 'success');
                this.renderProfilesList();
                this.stats.totalProfiles = this.profiles.length;
                this.updateUI(); // Refresh stats
            } else {
                throw new Error(response?.error || 'Échec de la suppression du profil.');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du profil:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
        }
    }

    /**
     * Active le profil sélectionné.
     * @param {string} profileId - L'ID du profil à activer.
     */
    async activateSelectedProfile(profileId) {
        if (!profileId) {
            const selectedProfileItem = document.querySelector('.profile-item.active');
            if (!selectedProfileItem) {
                this.showNotification('Veuillez sélectionner un profil à activer.', 'warning');
                return;
            }
            profileId = selectedProfileItem.dataset.profileId;
        }

        const profileToActivate = this.profiles.find(p => p.id === profileId);
        if (!profileToActivate) {
            this.showNotification('Profil à activer introuvable.', 'error');
            return;
        }

        try {
            this.showNotification('Activation du profil...', 'info');
            // Update activeProfileId in settings and save
            this.settings.activeProfileId = profileId;
            this.currentProfile = profileToActivate;
            await this.saveData(); // This will also update chrome.storage.local
            
            // Send message to background to update its active profile
            const response = await chrome.runtime.sendMessage({
                type: 'updateSetting',
                setting: 'activeProfileId',
                value: profileId
            });

            if (response && response.success) {
                this.showNotification(`Profil "${profileToActivate.name || profileId.substring(3, 9)}" activé!`, 'success');
                this.renderProfilesList(); // Re-render to update active class
                this.updateActiveProfileDisplay(); // Update active profile details
            } else {
                throw new Error(response?.error || 'Échec de l\'activation du profil.');
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation du profil:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        window.fingerprintGuardSettings = new FingerprintGuardSettings();
    } else {
        console.error("Chrome storage API not available. FingerprintGuard settings page cannot initialize.");
        // Optionally display an error message to the user in the UI
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">
                                <h1>Erreur Critique</h1>
                                <p>L'API de stockage de l'extension n'est pas disponible. Impossible d'initialiser la page des paramètres.</p>
                                <p>Assurez-vous que l'extension est correctement installée et activée.</p>
                              </div>`;
        }
    }
});
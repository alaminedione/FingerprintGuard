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
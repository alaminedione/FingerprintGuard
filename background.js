import { getRandomElement, getRandomInRange, generateBrowserVersion } from './utils.js';

import { getFakeNavigatorProperties, getFakeUserAgentData, getNewRules, getFakeUserAgent, getFakeScreenProperties } from './spoofing-data.js';
import { applySpoofingNavigator, applyUserAgentData, applyUserAgent, spoofWebGL, applyGhostMode, applyScreenSpoofing } from './spoofing-apply.js';

// Configuration par défaut
const defaultSettings = {
  ghostMode: false,
  spoofNavigator: false,
  spoofUserAgent: false,
  spoofCanvas: false,
  spoofScreen: false, // Nouvelle option pour le spoofing d'écran
  blockImages: false,
  blockJS: false,
  //
  autoReloadAll: false,
  autoReloadCurrent: false,
  //
  platform: 'random',
  language: 'random',
  // navSpoofBrowser: 'random',
  hardwareConcurrency: 0,
  deviceMemory: 0,
  minVersion: 0,
  maxVersion: 0,
  //
  uaPlatform: 'random',
  uaPlatformVersion: 'random',
  uaArchitecture: 'random',
  uaBitness: 'random',
  uaWow64: 'random',
  uaModel: 'random',
  uaFullVersion: 'random',
  //
  browser: 'random',
  secChUa: 'random',
  secChUaMobile: 'random',
  secChUaPlatform: 'random',
  secChUaFullVersion: 'random',
  secChUaPlatformVersion: 'random',
  hDeviceMemory: 0,
  referer: '',
  contentEncoding: 'random',
  // Screen Spoofing defaults (ajoutés ici pour être complet, même si gérés par settings.js)
  spoofDeviceType: 'random',
  spoofDevicePixelRatio: 'random',
  spoofScreenResolution: 'random',
  //
  useFixedProfile: false,
  activeProfileId: null,
  generateNewProfileOnStart: false,
  //
  profiles: []
};


// Structure pour stocker les profils
let profiles = [];
let currentProfile = null;

let settings = { ...defaultSettings };

/**
 * Initialise l'extension en chargeant les paramètres et les profils.
 * @async
 */
async function initialize() {
  try {
    console.log('🚀 Initializing FingerprintGuard...');
    
    // Charger les paramètres avec validation
    const stored = await chrome.storage.sync.get(Object.keys(defaultSettings));
    settings = { ...defaultSettings, ...stored };
    
    // Valider les paramètres chargés
    validateSettings(settings);

    // Charger les profils existants avec gestion d'erreur
    const storedProfiles = await chrome.storage.local.get('profiles');
    profiles = Array.isArray(storedProfiles.profiles) ? storedProfiles.profiles : [];

    // Charger le profil actif avec validation
    if (settings.activeProfileId) {
      currentProfile = getProfileById(settings.activeProfileId);
      if (!currentProfile) {
        console.warn('⚠️ Active profile not found, resetting to null');
        currentProfile = null;
        settings.activeProfileId = null;
        await chrome.storage.sync.set({ activeProfileId: null });
      }
    } else {
      currentProfile = null;
    }

    // Gérer le profil actif avec gestion d'erreur
    if (settings.useFixedProfile) {
      try {
        if (settings.generateNewProfileOnStart) {
          if (!currentProfile) {
            currentProfile = generateNewProfile();
            settings.activeProfileId = currentProfile.id;
            await saveProfile(currentProfile);
            console.log('✅ New profile generated on startup');
          }
        } else if (settings.activeProfileId) {
          currentProfile = getProfileById(settings.activeProfileId);
        }
        
        if (!currentProfile) {
          currentProfile = generateNewProfile();
          settings.activeProfileId = currentProfile.id;
          await saveProfile(currentProfile);
          console.log('✅ Fallback profile created');
        }
      } catch (profileError) {
        console.error('❌ Error managing profiles:', profileError);
        // Fallback: disable fixed profile mode
        settings.useFixedProfile = false;
        currentProfile = null;
      }
    }

    console.log('✅ FingerprintGuard initialized successfully');
    console.log('📊 Settings loaded:', settings);
    console.log('👤 Current profile:', currentProfile?.id || 'None');
    
  } catch (error) {
    console.error('❌ Critical error during initialization:', error);
    // Fallback to default settings
    settings = { ...defaultSettings };
    currentProfile = null;
    
    // Notify user of initialization failure
    try {
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'FingerprintGuard Error',
        message: 'Extension failed to initialize properly. Using default settings.'
      });
    } catch (notifError) {
      console.error('Failed to show notification:', notifError);
    }
  }
}

/**
 * Valide les paramètres chargés
 * @param {object} settings - Les paramètres à valider
 */
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings object');
  }
  
  // Valider les types booléens
  const booleanFields = ['ghostMode', 'spoofNavigator', 'spoofUserAgent', 'spoofCanvas', 'spoofScreen', 'blockImages', 'blockJS', 'autoReloadAll', 'autoReloadCurrent', 'useFixedProfile', 'generateNewProfileOnStart'];
  
  booleanFields.forEach(field => {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      console.warn(`⚠️ Invalid boolean field ${field}, resetting to default`);
      settings[field] = defaultSettings[field];
    }
  });
  
  // Valider les nombres
  const numberFields = ['hardwareConcurrency', 'deviceMemory', 'minVersion', 'maxVersion', 'hDeviceMemory'];
  
  numberFields.forEach(field => {
    if (settings[field] !== undefined && (typeof settings[field] !== 'number' || isNaN(settings[field]))) {
      console.warn(`⚠️ Invalid number field ${field}, resetting to default`);
      settings[field] = defaultSettings[field];
    }
  });
}

initialize();

/**
 * Génère un nouveau profil d'usurpation basé sur les paramètres actuels.
 * @returns {object} Le nouveau profil généré.
 */
function generateNewProfile() {
  try {
    const profileId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const profile = {
      id: profileId,
      createdAt: new Date().toISOString(),
      version: '2.1.0', // Version du profil pour compatibilité future
      fakeNavigator: getFakeNavigatorProperties(settings),
      fakeUserAgentData: getFakeUserAgentData(settings, settings.browser),
      fakeUserAgent: getFakeUserAgent(settings),
      fakeScreen: getFakeScreenProperties(settings),
      rules: getNewRules(settings, 1),
      metadata: {
        generatedWith: settings.browser || 'random',
        platform: settings.platform || 'random',
        language: settings.language || 'random'
      }
    };

    // Valider le profil généré
    if (!validateProfile(profile)) {
      throw new Error('Generated profile failed validation');
    }

    console.log('✅ New profile generated:', profileId);
    return profile;
    
  } catch (error) {
    console.error('❌ Error generating new profile:', error);
    
    // Profil de fallback minimal mais fonctionnel
    return {
      id: `fallback_${Date.now()}`,
      createdAt: new Date().toISOString(),
      version: '2.1.0',
      fakeNavigator: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'en-US',
        hardwareConcurrency: 4,
        deviceMemory: 8
      },
      fakeUserAgentData: {
        brands: [{ brand: 'Chrome', version: '120' }],
        mobile: false,
        platform: 'Windows'
      },
      fakeUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      fakeScreen: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24,
        devicePixelRatio: 1
      },
      rules: [],
      metadata: { fallback: true }
    };
  }
}

/**
 * Valide un profil
 * @param {object} profile - Le profil à valider
 * @returns {boolean} True si le profil est valide
 */
function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') return false;
  if (!profile.id || typeof profile.id !== 'string') return false;
  if (!profile.createdAt) return false;
  if (!profile.fakeNavigator || typeof profile.fakeNavigator !== 'object') return false;
  if (!profile.fakeUserAgent || typeof profile.fakeUserAgent !== 'string') return false;
  if (!profile.fakeScreen || typeof profile.fakeScreen !== 'object') return false;
  
  return true;
}


/**
 * Sauvegarde un profil dans la liste des profils et dans le stockage local.
 * @async
 * @param {object} profile - Le profil à sauvegarder.
 */
async function saveProfile(profile) {
  profiles.push(profile);
  await chrome.storage.local.set({ profiles });
}

/**
 * Récupère un profil par son ID.
 * @param {string} profileId - L'ID du profil à récupérer.
 * @returns {object | undefined} Le profil trouvé ou undefined.
 */
function getProfileById(profileId) {
  return profiles.find(profile => profile.id === profileId);
}

/**
 * Obtient une valeur de configuration, en tenant compte du profil actif.
 * @param {string} key - La clé de la configuration à obtenir.
 * @returns {*} La valeur de la configuration.
 */
function getConfigValue(key) {
  if (settings.useFixedProfile && currentProfile) {
    // Assurez-vous que currentProfile.properties existe avant d'y accéder
    return currentProfile.properties && currentProfile.properties[key] !== undefined ? currentProfile.properties[key] : settings[key];
  }
  return settings[key];
}


// Écoute des changements de paramètres
chrome.storage.onChanged.addListener((changes) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    // Mettre à jour les valeurs de settings
    settings[key] = newValue;

    // Si on change de profil actif
    if (key === 'activeProfileId' && settings.useFixedProfile) {
      const newProfileId = newValue;
      currentProfile = getProfileById(newProfileId); // Utiliser la fonction pour obtenir le profil

      if (currentProfile) {
        console.log(`activeProfileId: ${currentProfile.id}`);
      } else {
        currentProfile = generateNewProfile();
        settings.activeProfileId = currentProfile.id;
        saveProfile(currentProfile);
      }
    }

    console.log(`paramètres modifiés: ${key} = ${newValue}`);
  }
  handleAutoReload();
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validation du message
  if (!message || typeof message !== 'object' || !message.type) {
    console.error('❌ Invalid message received:', message);
    sendResponse({ success: false, error: 'Invalid message format' });
    return;
  }

  const handleAsync = async () => {
    try {
      switch (message.type) {
        case 'getStatus':
          console.log('📊 Status requested');
          sendResponse({ success: true, data: settings });
          break;

        case 'updateSetting': {
          const { setting, value } = message;
          
          if (!setting || value === undefined) {
            throw new Error('Missing setting or value');
          }
          
          // Valider le paramètre avant de l'appliquer
          if (!Object.prototype.hasOwnProperty.call(defaultSettings, setting)) {
            throw new Error(`Unknown setting: ${setting}`);
          }
          
          settings[setting] = value;
          
          await chrome.storage.sync.set({ [setting]: value });
          console.log(`✅ Setting updated: ${setting} = ${value}`);
          sendResponse({ success: true });
          break;
        }

        case 'updateSettings': {
          const msg_settings = message.settings;
          
          if (!msg_settings || typeof msg_settings !== 'object') {
            throw new Error('Invalid settings object');
          }
          
          // Valider tous les paramètres avant de les appliquer
          const validSettings = {};
          Object.keys(msg_settings).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
              validSettings[key] = msg_settings[key];
              settings[key] = msg_settings[key];
            } else {
              console.warn(`⚠️ Ignoring unknown setting: ${key}`);
            }
          });
          
          await chrome.storage.sync.set(validSettings);
          console.log('✅ Multiple settings updated:', Object.keys(validSettings));
          sendResponse({ success: true, updated: Object.keys(validSettings) });
          break;
        }

        case 'generateNewProfile': {
          const newProfile = generateNewProfile();
          profiles.push(newProfile);
          
          // Limiter le nombre de profils stockés (max 50)
          if (profiles.length > 50) {
            profiles = profiles.slice(-50);
            console.log('⚠️ Profile limit reached, removed oldest profiles');
          }
          
          await chrome.storage.local.set({ profiles });
          console.log('✅ New profile saved:', newProfile.id);
          sendResponse({ success: true, data: newProfile });
          break;
        }

        case 'getProfiles':
          console.log('📁 Profiles requested');
          sendResponse({ success: true, data: profiles });
          break;

        case 'getActiveProfileId':
          console.log('👤 Active profile ID requested');
          sendResponse({ success: true, data: settings.activeProfileId });
          break;

        case 'deleteProfile': {
          const profileId = message.id;
          
          if (!profileId) {
            throw new Error('Profile ID is required');
          }
          
          const profileIndex = profiles.findIndex(profile => profile.id === profileId);
          
          if (profileIndex === -1) {
            throw new Error('Profile not found');
          }
          
          // Si on supprime le profil actif, le désactiver
          if (settings.activeProfileId === profileId) {
            settings.activeProfileId = null;
            currentProfile = null;
            await chrome.storage.sync.set({ activeProfileId: null });
            console.log('⚠️ Active profile deleted, reset to null');
          }
          
          profiles.splice(profileIndex, 1);
          await chrome.storage.local.set({ profiles });
          console.log('✅ Profile deleted:', profileId);
          sendResponse({ success: true });
          break;
        }
        
        case 'getSettings':
          console.log('⚙️ Settings requested');
          sendResponse({ success: true, data: settings });
          break;

        case 'exportProfile': {
          const profileId = message.id;
          const profile = getProfileById(profileId);
          
          if (!profile) {
            throw new Error('Profile not found');
          }
          
          const exportData = {
            ...profile,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'FingerprintGuard v2.1.0'
          };
          
          sendResponse({ success: true, data: exportData });
          break;
        }

        case 'importProfile': {
          const profileData = message.data;
          
          if (!validateProfile(profileData)) {
            throw new Error('Invalid profile data');
          }
          
          // Générer un nouvel ID pour éviter les conflits
          profileData.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          profileData.importedAt = new Date().toISOString();
          
          profiles.push(profileData);
          await chrome.storage.local.set({ profiles });
          
          console.log('✅ Profile imported:', profileData.id);
          sendResponse({ success: true, data: profileData });
          break;
        }

        default:
          console.warn('⚠️ Unknown message type:', message.type);
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  };

  // Exécuter de manière asynchrone pour les opérations de stockage
  handleAsync();
  return true; // Indique que la réponse sera envoyée de manière asynchrone
});

// Écoute les navigations et injecte les scripts
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.url.startsWith('chrome://') || details.url.startsWith("chrome-extension://")) {
    return;
  }

  console.log('navigation vers: ', details.url);

  if (settings.ghostMode) {
    console.log('activation ghost mode sur  la page: ', details.url);
    applyGhostMode(details.tabId);
    return;
  } else {
    //make sure that we remove rule 999
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [999],
    });
  }


  if (settings.spoofCanvas) {
    console.log('activation spoof canvas sur  la page: ', details.url);
    injectScript(details.tabId, './spoofer/spoof-canvas.js');
    injectScript(details.tabId, spoofWebGL); // Appel de la fonction spoofWebGL
  }

  if (settings.spoofScreen) {
    console.log('activation spoof screen sur la page: ', details.url);
    const fakeScreenProps = getFakeScreenProperties(settings);
    injectScript(details.tabId, applyScreenSpoofing, fakeScreenProps);
  }

  if (settings.spoofNavigator) {
    console.log('activation spoof navigator sur  la page: ', details.url);
    spoofNavigator(details.tabId, settings);
  }

  if (settings.spoofUserAgent) {
    console.log('activation spoof user agent sur  la page: ', details.url);
    spoofUserAgent(details.tabId, settings);
  } else {
    //desactive le rule id 1
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]
    })
  }
})

// Gérer le blocage des images et des scripts
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.url.startsWith('chrome://') || details.url.startsWith("chrome-extension://")) {
    return;
  }
  console.log('navigation vers: ', details.url);

  chrome.contentSettings.javascript.set({
    primaryPattern: '<all_urls>',
    setting: settings.blockJS ? 'block' : 'allow'
  });
  console.log('block js: ', settings.blockJS);

  chrome.contentSettings.images.set({
    primaryPattern: '<all_urls>',
    setting: settings.blockImages ? 'block' : 'allow'
  });
  console.log('block images: ', settings.blockImages);
});

/**
 * Gère le rechargement automatique des onglets en fonction des paramètres.
 * @async
 */
async function handleAutoReload() {
  const { autoReloadAll, autoReloadCurrent } = await chrome.storage.sync.get(['autoReloadAll', 'autoReloadCurrent']);
  if (autoReloadAll) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.tabs.reload(tab.id);
        console.log('rechargement automatique: ', tab.url);
      }
    }
  } else if (autoReloadCurrent) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('chrome-extension://')) {
      await chrome.tabs.reload(activeTab.id);
      console.log('rechargement automatique: ', activeTab.url);
    }
  }
}

/**
 * Applique l'usurpation des propriétés du navigateur et des données User-Agent.
 * @param {number} tabId - L'ID de l'onglet où appliquer l'usurpation.
 * @param {object} config - La configuration actuelle de l'extension.
 */
function spoofNavigator(tabId, config) {
  const fakeNavigator = settings.useFixedProfile && currentProfile
    ? getFakeNavigatorPropertiesFromProfile(currentProfile)
    : getFakeNavigatorProperties(config);

  const fakeUserAgentData = settings.useFixedProfile && currentProfile
    ? getFakeUserAgentDataFromProfile(currentProfile)
    : getFakeUserAgentData(config, config.browser);

  console.log('Usurpation de la navigation sur la page');
  injectScript(tabId, applySpoofingNavigator, fakeNavigator);
  injectScript(tabId, applyUserAgentData, fakeUserAgentData);
}


/**
 * Récupère les propriétés de navigateur falsifiées à partir d'un profil.
 * @param {object} profile - Le profil contenant les propriétés.
 * @returns {object} Les propriétés de navigateur falsifiées.
 */
function getFakeNavigatorPropertiesFromProfile(profile) {
  return profile.fakeNavigator;
}

/**
 * Récupère les données User-Agent falsifiées à partir d'un profil.
 * @param {object} profile - Le profil contenant les données User-Agent.
 * @returns {object} Les données User-Agent falsifiées.
 */
function getFakeUserAgentDataFromProfile(profile) {
  return profile.fakeUserAgentData;
}

/**
 * Récupère les règles de modification des en-têtes à partir d'un profil.
 * @param {object} profile - Le profil contenant les règles.
 * @returns {Array<object>} Les règles de modification des en-têtes.
 */
function getRulesFromProfiles(profile) {
  return profile.rules
}

/**
 * Récupère la chaîne User-Agent falsifiée à partir d'un profil.
 * @param {object} profile - Le profil contenant la chaîne User-Agent.
 * @returns {string} La chaîne User-Agent falsifiée.
 */
function getFakeUserAgentFromProfile(profile) {
  return profile.fakeUserAgent
}

/**
 * Applique l'usurpation de l'User-Agent via les règles declarativeNetRequest et l'injection de script.
 * @param {number} tabId - L'ID de l'onglet où appliquer l'usurpation.
 * @param {object} config - La configuration actuelle de l'extension.
 */
function spoofUserAgent(tabId, config) {
  const newRule = settings.activeProfileId && currentProfile ? getRulesFromProfiles(currentProfile) : getNewRules(config, 1); // 1 est un ID de règle unique
  console.log('usurpation de l\'user agent sur la page: ');
  // const newRule = getNewRules(config, 1); // 1 est un ID de règle unique
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: newRule,
  });
  console.log('injection de  l\'script de modification de user agent');
  if (!settings.spoofNavigator) {
    const fakeUserAgent = settings.activeProfileId && currentProfile
      ? getFakeUserAgentFromProfile(currentProfile)
      : getFakeUserAgent(settings);
    console.log('iniatilisation de l\'injection de script de modification de user agent  avec comme args : ', fakeUserAgent);
    console.log('le profile actuel est : ', currentProfile);
    injectScript(tabId, applyUserAgent, fakeUserAgent);
  }
}

/**
 * Injecte un script dans un onglet spécifié avec gestion d'erreur robuste.
 * @param {number} tabId - L'ID de l'onglet où injecter le script.
 * @param {string | function} fileOrFunc - Le chemin du fichier de script ou la fonction à injecter.
 * @param {Array<*>} [args] - Les arguments à passer à la fonction injectée.
 * @returns {Promise<boolean>} True si l'injection a réussi
 */
async function injectScript(tabId, fileOrFunc, args) {
  try {
    // Validation des paramètres
    if (!tabId || typeof tabId !== 'number') {
      throw new Error('Invalid tab ID');
    }
    
    if (!fileOrFunc) {
      throw new Error('No script file or function provided');
    }
    
    // Vérifier que l'onglet existe et est accessible
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) {
      console.warn(`⚠️ Tab ${tabId} not found or inaccessible`);
      return false;
    }
    
    // Vérifier que l'URL est injectable
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
      console.warn(`⚠️ Cannot inject into protected URL: ${tab.url}`);
      return false;
    }
    
    const scriptType = typeof fileOrFunc === 'string' ? `file: ${fileOrFunc}` : 'function';
    console.log(`💉 Injecting script (${scriptType}) into tab ${tabId}`);
    
    const injectionOptions = {
      world: 'MAIN',
      injectImmediately: true,
      target: { tabId }
    };
    
    if (typeof fileOrFunc === 'string') {
      injectionOptions.files = [fileOrFunc];
    } else if (typeof fileOrFunc === 'function') {
      injectionOptions.func = fileOrFunc;
      if (args !== undefined) {
        injectionOptions.args = Array.isArray(args) ? args : [args];
      }
    } else {
      throw new Error('Script must be a file path string or function');
    }
    
    await chrome.scripting.executeScript(injectionOptions);
    console.log(`✅ Script injected successfully into tab ${tabId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to inject script into tab ${tabId}:`, error);
    
    // Log detailed error information
    if (error.message.includes('Cannot access')) {
      console.warn('📄 Tab may be on a restricted page or extension page');
    } else if (error.message.includes('No tab with id')) {
      console.warn('🔍 Tab may have been closed');
    } else if (error.message.includes('The extensions gallery cannot be scripted')) {
      console.warn('🏪 Cannot inject into Chrome Web Store');
    }
    
    return false;
  }
}

/**
 * Injecte plusieurs scripts de manière séquentielle
 * @param {number} tabId - L'ID de l'onglet
 * @param {Array} scripts - Tableau d'objets {script, args}
 * @returns {Promise<boolean>} True si tous les scripts ont été injectés
 */
async function injectMultipleScripts(tabId, scripts) {
  try {
    let successCount = 0;
    
    for (const { script, args } of scripts) {
      const success = await injectScript(tabId, script, args);
      if (success) successCount++;
    }
    
    console.log(`✅ Injected ${successCount}/${scripts.length} scripts into tab ${tabId}`);
    return successCount === scripts.length;
    
  } catch (error) {
    console.error(`❌ Error injecting multiple scripts:`, error);
    return false;
  }
}



// La fonction applyGhostMode est importée depuis spoofing-apply.js



// La fonction applyUserAgent est importée depuis spoofing-apply.js

// La fonction spoofWebGL est importée depuis spoofing-apply.js



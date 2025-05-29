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
  //charger les paramètres
  const stored = await chrome.storage.sync.get(Object.keys(defaultSettings));
  settings = { ...defaultSettings, ...stored };

  // Charger les profils existants
  const storedProfiles = await chrome.storage.local.get('profiles');
  profiles = storedProfiles.profiles || [];

  // Charger le profil actif
  if (settings.activeProfileId) {
    currentProfile = getProfileById(settings.activeProfileId);
    if (!currentProfile) {
      //le profil actif n'existe plus, peut etre qu'il a ete supprimé
      currentProfile = null
      settings.activeProfileId = null
      chrome.storage.sync.set({ activeProfileId: null }, () => {
        console.log('activeProfileId mis à null ', settings.activeProfileId);
      });
    }
  } else {
    currentProfile = null;
  }

  // Gérer le profil actif
  if (settings.useFixedProfile) {
    if (settings.generateNewProfileOnStart) {
      if (!currentProfile) {
        currentProfile = generateNewProfile();
        settings.activeProfileId = currentProfile.id;
        await saveProfile(currentProfile);
      }
    } else if (settings.activeProfileId) {
      currentProfile = getProfileById(settings.activeProfileId);
    }
    if (!currentProfile) {
      currentProfile = generateNewProfile();
      settings.activeProfileId = currentProfile.id;
      await saveProfile(currentProfile);
    }
  }

  console.log('settings loaded:', settings);
  console.log('currentProfile loaded:', currentProfile);
}

initialize();

/**
 * Génère un nouveau profil d'usurpation basé sur les paramètres actuels.
 * @returns {object} Le nouveau profil généré.
 */
function generateNewProfile() {
  const profile = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    fakeNavigator: getFakeNavigatorProperties(settings),
    fakeUserAgentData: getFakeUserAgentData(settings, settings.browser),
    fakeUserAgent: getFakeUserAgent(settings),
    fakeScreen: getFakeScreenProperties(settings), // Ajout des propriétés d'écran au profil
    rules: getNewRules(settings, 1),
  };

  return profile;
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
  switch (message.type) {
    case 'getStatus':
      sendResponse(settings);
      console.log('Status envoyé:', settings);
      break;

    case 'updateSetting': {
      const { setting, value } = message;
      settings[setting] = value;

      chrome.storage.sync.set({ [setting]: value }, () => {
        console.log(`Paramètre ${setting} mis à ${value}`);
      });
      sendResponse({ success: true });
      break;
    }

    case 'updateSettings': {
      const msg_settings = message.settings;
      Object.keys(msg_settings).forEach(key => {
        settings[key] = msg_settings[key];
        chrome.storage.sync.set({ [key]: msg_settings[key] }, () => {
          console.log(`Paramètre ${key} mis à ${msg_settings[key]}`);
        });
      });
      sendResponse({ success: true });
      break;
    }

    case 'generateNewProfile': {
      const newProfile = generateNewProfile();
      profiles.push(newProfile);
      chrome.storage.local.set({ profiles }, () => {
        console.log('Profil enregistré:', newProfile);
      });
      sendResponse(newProfile);
      break;
    }

    case 'getProfiles':
      sendResponse(profiles);
      console.log('Profils envoyés:', profiles);
      break;

    case 'getActiveProfileId':
      sendResponse(settings.activeProfileId);
      console.log('ID du profil actif envoyé:', settings.activeProfileId);
      break;

    case 'deleteProfile': {
      const profileIndex = profiles.findIndex(profile => profile.id === message.id);
      if (profileIndex > -1) {
        profiles.splice(profileIndex, 1);
        chrome.storage.local.set({ profiles }, () => {
          console.log('Profil supprimé:', message.id);
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Profil non trouvé' });
      }
      break;
    }
    case 'getSettings':
      sendResponse(settings);
      console.log('Settings envoyés:', settings);
      break;

    default:
      console.warn('Type de message non reconnu:', message.type);
      sendResponse({ success: false, error: 'Type de message non reconnu' });
  }
  // return true; // Indicate that the response will be sent asynchronously
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
 * Injecte un script dans un onglet spécifié.
 * @param {number} tabId - L'ID de l'onglet où injecter le script.
 * @param {string | function} fileOrFunc - Le chemin du fichier de script ou la fonction à injecter.
 * @param {Array<*>} [args] - Les arguments à passer à la fonction injectée.
 */
function injectScript(tabId, fileOrFunc, args) {
  const scriptType = typeof fileOrFunc === 'string' ? `fichier : ${fileOrFunc}` : 'fonction';
  console.log(`Injection de script (${scriptType}) dans l'onglet ${tabId}`);
  chrome.scripting.executeScript({
    world: 'MAIN',
    injectImmediately: true,
    target: { tabId },
    files: typeof fileOrFunc === 'string' ? [fileOrFunc] : undefined,
    func: typeof fileOrFunc === 'function' ? fileOrFunc : undefined,
    args: [args]
  });
}



// La fonction applyGhostMode est importée depuis spoofing-apply.js



// La fonction applyUserAgent est importée depuis spoofing-apply.js

// La fonction spoofWebGL est importée depuis spoofing-apply.js



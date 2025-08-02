// Configuration par défaut pour FingerprintGuard v2.1.0

/**
 * Paramètres par défaut de l'extension
 * Ces valeurs seront utilisées lors:
 * - de l'installation initiale
 * - de la réinitialisation des paramètres
 */
export const DEFAULT_SETTINGS = {
  // Mode de protection principal
  protectionMode: 'lucky', // 'lucky', 'advanced', 'ghost'

  // Paramètres pour le mode 'advanced'
  advancedSettings: {
    spoofBrowser: true,
    spoofCanvas: true,
    spoofScreen: true,
    webrtc: true,
    audio: true,
    fonts: true,
    experimental: true,
    blockImages: false,
    blockJS: false,
  },

  // Rechargement automatique
  autoReloadAll: false,
  autoReloadCurrent: true,

  // Configuration du profil (pour le mode 'advanced')
  profile: {
    platform: 'random',
    language: 'random',
    hardwareConcurrency: 0, // 0 = aléatoire
    deviceMemory: 0, // 0 = aléatoire
    minVersion: 0, // version min pour user-agent
    maxVersion: 0, // version max pour user-agent
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
    contentEncoding: 'random',
    spoofDeviceType: 'random',
    spoofDevicePixelRatio: 'random',
    spoofScreenResolution: 'random',
    timezone: 'random', // Déplacé de advancedSettings
  },
  
  // Gestion des profils
  useFixedProfile: false,
  generateNewProfileOnStart: true, // Activé par défaut pour 'advanced'
  activeProfileId: null,
  profiles: [],
  theme: 'light',
};

export const VALIDATION_RULES = {
  stringFields: [
    'protectionMode', 'theme',
    // Champs de profil
    'profile.platform', 'profile.language', 'profile.resolution', 
    'profile.browser', // Ajouté pour permettre la spécification du navigateur
    'profile.contentEncoding', 
    'profile.spoofDeviceType', 'profile.spoofDevicePixelRatio', 'profile.spoofScreenResolution',
    'profile.timezone' // Ajouté pour permettre la spécification du fuseau horaire
  ],
  booleanFields: [
    'autoReloadAll', 'autoReloadCurrent', 'useFixedProfile', 'generateNewProfileOnStart',
    // Champs de paramètres avancés
    'advancedSettings.spoofBrowser', 'advancedSettings.spoofCanvas', 'advancedSettings.spoofScreen', 
    'advancedSettings.webrtc', 'advancedSettings.audio', 'advancedSettings.fonts', 
    'advancedSettings.experimental', 'advancedSettings.blockImages', 'advancedSettings.blockJS'
  ],
  numberFields: [
    // Champs de profil
    'profile.hardwareConcurrency', 'profile.deviceMemory', 'profile.minVersion', 'profile.maxVersion'
  ],
};

/**
 * Versions de navigateurs supportées pour le spoofing
 */
export const BROWSER_VERSIONS = {
  Chrome: [120, 119, 118, 117, 116, 115, 114, 113, 112, 111, 110],
  Firefox: [119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109],
  Safari: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
  Edge: [119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109],
  Opera: [104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94]
};

/**
 * Données de spoofing pour différentes plateformes et navigateurs
 */
export const SPOOFING_DATA = {
  platforms: {
    'Windows NT 10.0; Win64; x64': {
      platform: 'Win32',
      hardwareConcurrency: [4, 8, 12, 16],
      deviceMemory: [4, 8, 16, 32],
      languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES']
    },
    'Windows NT 10.0; WOW64': {
      platform: 'Win32',
      hardwareConcurrency: [2, 4, 8],
      deviceMemory: [4, 8, 16],
      languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE']
    },
    'Macintosh; Intel Mac OS X 10_15_7': {
      platform: 'MacIntel',
      hardwareConcurrency: [4, 8, 12],
      deviceMemory: [8, 16, 32],
      languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE']
    },
    'X11; Linux x86_64': {
      platform: 'Linux x86_64',
      hardwareConcurrency: [2, 4, 8, 16],
      deviceMemory: [4, 8, 16, 32],
      languages: ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES']
    }
  },
  
  screenResolutions: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1600, height: 900 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 }
  ],

  devicePixelRatios: [1, 1.25, 1.5, 2, 2.5, 3],

  timezones: [
    'America/New_York',
    'America/Los_Angeles', 
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ],

  webglVendors: [
    'Intel Inc.',
    'NVIDIA Corporation',
    'AMD',
    'Qualcomm',
    'Apple Inc.'
  ],

  webglRenderers: [
    'Intel(R) UHD Graphics 620',
    'NVIDIA GeForce GTX 1060',
    'AMD Radeon RX 580',
    'Intel(R) HD Graphics 4000',
    'NVIDIA GeForce RTX 3070'
  ]
};
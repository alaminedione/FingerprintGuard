/**
 * Configuration par défaut centralisée pour FingerprintGuard v2.1.0
 * Centralise tous les paramètres par défaut de l'extension
 */

export const DEFAULT_SETTINGS = {
  // Modes principaux
  ghostMode: false,
  spoofBrowser: false,
  spoofCanvas: false,
  spoofScreen: false,
  blockImages: false,
  blockJS: false,

  // Rechargement automatique
  autoReloadAll: false,
  autoReloadCurrent: false,

  // Propriétés Navigator
  platform: 'random',
  language: 'random',
  hardwareConcurrency: 0,
  deviceMemory: 0,
  minVersion: 0,
  maxVersion: 0,

  // User-Agent Data
  uaPlatform: 'random',
  uaPlatformVersion: 'random',
  uaArchitecture: 'random',
  uaBitness: 'random',
  uaWow64: 'random',
  uaModel: 'random',
  uaFullVersion: 'random',

  // En-têtes HTTP
  browser: 'random',
  secChUa: 'random',
  secChUaMobile: 'random',
  secChUaPlatform: 'random',
  secChUaFullVersion: 'random',
  secChUaPlatformVersion: 'random',
  hDeviceMemory: 0,
  referer: '',
  contentEncoding: 'random',

  // Spoofing d'écran
  spoofDeviceType: 'random',
  spoofDevicePixelRatio: 'random',
  spoofScreenResolution: 'random',

  // Gestion des profils
  useFixedProfile: false,
  activeProfileId: null,
  generateNewProfileOnStart: false,
  profiles: []
};

export const BROWSER_VERSIONS = {
  "Chrome": [120, 119, 118, 117, 116, 115, 114, 113, 112, 111],
  "Firefox": [121, 120, 119, 118, 117, 116, 115, 114, 113, 112],
  "Safari": [17, 16, 15, 14, 13],
  "Opera": [105, 104, 103, 102, 101, 100, 99, 98, 97, 96],
  "Edge": [120, 119, 118, 117, 116, 115, 114, 113, 112, 111],
};

export const SPOOFING_DATA = {
  // Résolutions d'écran réalistes
  screenResolutions: {
    desktop: [
      { width: 1920, height: 1080, ratio: 1 },
      { width: 1366, height: 768, ratio: 1 },
      { width: 1536, height: 864, ratio: 1.25 },
      { width: 1440, height: 900, ratio: 1 },
      { width: 2560, height: 1440, ratio: 1 },
      { width: 3840, height: 2160, ratio: 1.5 },
      { width: 1600, height: 900, ratio: 1 },
      { width: 1280, height: 720, ratio: 1 },
    ],
    mobile: [
      { width: 375, height: 667, ratio: 2 },
      { width: 414, height: 896, ratio: 3 },
      { width: 390, height: 844, ratio: 3 },
      { width: 428, height: 926, ratio: 3 },
      { width: 360, height: 640, ratio: 3 },
      { width: 412, height: 915, ratio: 2.75 },
    ],
    tablet: [
      { width: 768, height: 1024, ratio: 2 },
      { width: 820, height: 1180, ratio: 2 },
      { width: 810, height: 1080, ratio: 2.2 },
      { width: 1024, height: 1366, ratio: 2 },
    ]
  },

  // Timezones réalistes
  timezones: [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'America/Toronto', 'America/Chicago', 'Europe/Madrid'
  ],

  // GPU et renderers réalistes
  webglRenderers: [
    'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple GPU', 'Mali-G78 MP14', 'Adreno (TM) 640'
  ],

  // Languages supportées
  languages: {
    'fr-FR': ['fr-FR', 'fr'],
    'en-US': ['en-US', 'en'],
    'en-GB': ['en-GB', 'en'],
    'es-ES': ['es-ES', 'es'],
    'de-DE': ['de-DE', 'de'],
    'ja-JP': ['ja-JP', 'ja'],
    'zh-CN': ['zh-CN', 'zh']
  },

  // Audio fingerprints
  audioFingerprints: [
    35.73833084106445, 35.73833274841309, 35.7383346557617,
    35.73833465576172, 35.73833465576174, 35.73833465576176
  ]
};

export const VALIDATION_RULES = {
  // Champs booléens
  booleanFields: [
    'ghostMode', 'spoofBrowser', 'spoofCanvas', 'spoofScreen', 
    'blockImages', 'blockJS', 'autoReloadAll', 'autoReloadCurrent', 
    'useFixedProfile', 'generateNewProfileOnStart'
  ],

  // Champs numériques
  numberFields: [
    'hardwareConcurrency', 'deviceMemory', 'minVersion', 
    'maxVersion', 'hDeviceMemory'
  ],

  // Champs textuels
  stringFields: [
    'platform', 'language', 'browser', 'referer'
  ]
};
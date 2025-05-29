import { getRandomElement, getRandomInRange, generateBrowserVersion } from './utils.js';

// Génération des règles et données avancées
const browsersVersions = {
  "Chrome": [120, 119, 118, 117, 116, 115, 114, 113, 112, 111],
  "Firefox": [121, 120, 119, 118, 117, 116, 115, 114, 113, 112],
  "Safari": [17, 16, 15, 14, 13],
  "Opera": [105, 104, 103, 102, 101, 100, 99, 98, 97, 96],
  "Edge": [120, 119, 118, 117, 116, 115, 114, 113, 112, 111],
};

// Données avancées pour le spoofing
const advancedSpoofingData = {
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
  
  // Audio contexts fingerprinting
  audioFingerprints: [
    35.73833084106445, 35.73833274841309, 35.7383346557617,
    35.73833465576172, 35.73833465576174, 35.73833465576176
  ]
};

/**
 * Génère un objet de fausses propriétés pour l'objet `navigator`.
 * @param {object} config - L'objet de configuration contenant les préférences pour la génération.
 * @param {string} [config.browser='random'] - Le navigateur à simuler ('Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', ou 'random').
 * @param {string} [config.platform='random'] - La plateforme à simuler ('random', 'Windows NT 10.0; Win64; x64', etc.).
 * @param {string} [config.language='random'] - La langue à simuler ('random', 'en-US', 'fr-FR', etc.).
 * @param {number} [config.minVersion=0] - La version minimale du navigateur à simuler (0 pour aléatoire basé sur `browsersVersions`).
 * @param {number} [config.maxVersion=0] - La version maximale du navigateur à simuler (0 pour aléatoire basé sur `browsersVersions`).
 * @param {number} [config.hardwareConcurrency=0] - Le nombre de cœurs logiques à simuler (0 pour aléatoire).
 * @param {number} [config.deviceMemory=0] - La mémoire de l'appareil à simuler (0 pour aléatoire).
 * @returns {object} Un objet contenant les fausses propriétés du navigateur.
 */
export function getFakeNavigatorProperties(config) {
  const platforms = ['Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
  const languages = {
    'fr-FR': ['fr-FR', 'fr'],
    'en-US': ['en-US', 'en'],
    'en-GB': ['en-GB', 'en'],
    'es-ES': ['es-ES', 'es'],
    'de-DE': ['de-DE', 'de'],
    'ja-JP': ['ja-JP', 'ja'],
    'zh-CN': ['zh-CN', 'zh']
  };

  const platform = config.platform === 'random' ? getRandomElement(platforms) : (config.platform || getRandomElement(platforms));
  const language = config.language === 'random' ? getRandomElement(Object.keys(languages)) : (config.language || getRandomElement(Object.keys(languages)));

  let browserName = config.browser === 'random' ? getRandomElement(Object.keys(browsersVersions)) : config.browser;
  if (!browsersVersions[browserName]) { // Fallback si le nom du navigateur n'est pas dans notre liste
    browserName = 'Chrome';
  }

  const availableVersions = browsersVersions[browserName];
  const minVersion = config.minVersion === 0 ? availableVersions[availableVersions.length -1] : config.minVersion;
  const maxVersion = config.maxVersion === 0 ? availableVersions[0] : config.maxVersion;
  
  // Générer une version majeure et mineure plus réaliste pour le navigateur choisi
  let majorVersion = getRandomInRange(minVersion, maxVersion);
  // Pour Safari, les versions sont souvent X.Y (ex: 16.5), pour les autres X.Y.Z.A
  let fullBrowserVersion;
  let geckoVersion; // Pour Firefox

  if (browserName === 'Safari') {
    const minorSafari = getRandomInRange(0, 5); // ex: 16.0 à 16.5
    fullBrowserVersion = `${majorVersion}.${minorSafari}`;
  } else if (browserName === 'Firefox') {
    majorVersion = getRandomElement(availableVersions); // Firefox a des versions majeures spécifiques
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,2)}.0`; // ex: 115.0.0, 115.1.0
    // Simuler une version de Gecko (rv:) souvent proche ou identique à la version majeure de Firefox
    geckoVersion = `${majorVersion}.0`;
  } else { // Chrome, Edge, Opera
     majorVersion = getRandomElement(availableVersions) || getRandomInRange(110,125); // Fallback
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,9)}.${getRandomInRange(1000,5000)}.${getRandomInRange(0,99)}`;
  }


  const hardwareConcurrency = config.hardwareConcurrency === 0 ? getRandomElement([2, 4, 8, 16]) : parseInt(config.hardwareConcurrency);
  const deviceMemory = config.deviceMemory === 0 ? getRandomElement([4, 8, 16, 32]) : parseInt(config.deviceMemory);

  let userAgentString;
  let vendorString;
  let appNameString = 'Netscape'; // Souvent 'Netscape' pour compatibilité
  let appVersionString;

  const basePlatformString = platform.split(';')[0].trim(); // Ex: "Windows NT 10.0", "Macintosh", "X11"

  switch (browserName) {
    case 'Firefox':
      userAgentString = `Mozilla/5.0 (${platform}; rv:${geckoVersion || fullBrowserVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
      vendorString = ''; // Firefox ne définit pas navigator.vendor
      appVersionString = `5.0 (${basePlatformString})`; // Firefox appVersion est plus simple
      appNameString = 'Netscape';
      break;
    case 'Safari':
      // Safari sur Mac utilise une structure spécifique pour platform
      const macPlatformForUA = platform.includes('Macintosh') ? 'Macintosh; Intel Mac OS X 10_15_7' : platform;
      userAgentString = `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      vendorString = 'Apple Computer, Inc.';
      appVersionString = `5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      break;
    case 'Edge':
      userAgentString = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      vendorString = 'Google Inc.'; // Edge est basé sur Chromium
      appVersionString = `5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      break;
    case 'Opera':
      userAgentString = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      vendorString = 'Google Inc.'; // Opera est basé sur Chromium
      appVersionString = `5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      break;
    case 'Chrome':
    default: // Chrome par défaut
      userAgentString = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      vendorString = 'Google Inc.';
      appVersionString = `5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      break;
  }

  const fakeNavigator = {
    platform: basePlatformString,
    userAgent: userAgentString,
    language: language,
    languages: languages[language],
    hardwareConcurrency: hardwareConcurrency,
    deviceMemory: deviceMemory,
    vendor: vendorString,
    maxTouchPoints: platform.includes('Windows') ? 0 : (platform.includes('Linux') ? 0 : 5), // Linux desktop typically 0
    cookieEnabled: true,
    doNotTrack: '1',
    appName: appNameString,
    appCodeName: 'Mozilla', // Presque toujours 'Mozilla'
    appVersion: appVersionString,
    onLine: true,
  };
  console.log('fakeNavigator cree avec les propriétés suivantes: ', fakeNavigator);
  return fakeNavigator;
}

/**
 * Génère un objet de fausses données pour `navigator.userAgentData`.
 * @param {object} userAgentConfig - L'objet de configuration pour les données User-Agent.
 * @param {string} [userAgentConfig.uaPlatform='random'] - La plateforme OS à simuler pour User-Agent Data.
 * @param {string} [userAgentConfig.uaPlatformVersion='random'] - La version de la plateforme OS.
 * @param {string} [userAgentConfig.uaArchitecture='random'] - L'architecture CPU.
 * @param {string} [userAgentConfig.uaBitness='random'] - Le nombre de bits de l'architecture.
 * @param {boolean} [userAgentConfig.uaWow64='random'] - Si l'environnement est WOW64.
 * @param {string} [userAgentConfig.uaModel='random'] - Le modèle de l'appareil.
 * @param {string} [userAgentConfig.uaFullVersion='random'] - La version complète du navigateur.
 * @param {string} browserName - Le nom du navigateur principal (ex: 'Chrome', 'Firefox').
 * @returns {object} Un objet contenant les fausses données User-Agent.
 */
export function getFakeUserAgentData(userAgentConfig, browserName) {
  const brands = [
    "Google Chrome",
    "Chromium",
    "Microsoft Edge",
    "Firefox",
    "Safari"
  ];

  const platforms = {
    'Windows NT 10.0; Win64; x64': {
      platform: 'Windows',
      platformVersions: ['10.0.0', '10.0.19042', '10.0.22000', '10.0.22621']
    },
    'Windows NT 10.0; WOW64': {
      platform: 'Windows',
      platformVersions: ['10.0.0', '10.0.19042', '10.0.22000', '10.0.22621']
    },
    'Macintosh; Intel Mac OS X 10_15_7': {
      platform: 'macOS',
      platformVersions: ['10.15.7', '11.6.0', '12.0.1', '13.0.0']
    },
    'X11; Linux x86_64': {
      platform: 'Linux',
      platformVersions: ['5.15.0', '5.10.0', '6.0.0']
    }
  };

  const selectedPlatformKey = userAgentConfig.uaPlatform === 'random'
    ? getRandomElement(Object.keys(platforms))
    : userAgentConfig.uaPlatform;

  const platformInfo = platforms[selectedPlatformKey];

  const platform = platformInfo ? platformInfo.platform : 'Unknown';
  const platformVersion = userAgentConfig.uaPlatformVersion === 'random'
    ? (platformInfo ? getRandomElement(platformInfo.platformVersions) : `${getRandomInRange(6, 12)}.${getRandomInRange(0, 10)}.${getRandomInRange(0, 100)}`)
    : userAgentConfig.uaPlatformVersion;

  const architecture = userAgentConfig.uaArchitecture === 'random'
    ? getRandomElement(["x86", "x86_64", "arm64"])
    : userAgentConfig.uaArchitecture;

  const bitness = userAgentConfig.uaBitness === 'random'
    ? getRandomElement(["32", "64"])
    : userAgentConfig.uaBitness;

  const wow64 = userAgentConfig.uaWow64 === 'random'
    ? getRandomElement([true, false])
    : userAgentConfig.uaWow64;

  const model = userAgentConfig.uaModel === 'random'
    ? getRandomElement(["", "Pixel 7", "iPhone", "Samsung Galaxy S23"])
    : userAgentConfig.uaModel;

  const uaFullVersion = userAgentConfig.uaFullVersion === 'random'
    ? generateBrowserVersion(110, 125)
    : userAgentConfig.uaFullVersion;

  const selectedBrowserName = browserName === 'random' ? getRandomElement(brands) : browserName;

  const fakeUserAgentData = {
    brands: [
      { brand: selectedBrowserName, version: uaFullVersion },
      { brand: "Not A;Brand", version: generateBrowserVersion(8, 20) },
      { brand: "Chromium", version: generateBrowserVersion(110, 125) }
    ],
    mobile: model !== '', // Si un modèle est défini, on considère que c'est un mobile
    platform: platform,
    platformVersion: platformVersion,
    architecture: architecture,
    bitness: bitness,
    wow64: wow64,
    model: model,
    uaFullVersion: uaFullVersion,
    fullVersionList: [
      { brand: selectedBrowserName, version: uaFullVersion },
      { brand: "Not A;Brand", version: generateBrowserVersion(8, 20) },
      { brand: "Chromium", version: generateBrowserVersion(110, 125) }
    ],
  };
  console.log('fakeUserAgentData cree avec les propriétés suivantes: ', fakeUserAgentData);
  return fakeUserAgentData;
}

/**
 * Génère des règles pour `chrome.declarativeNetRequest` afin de modifier les en-têtes HTTP
 * de manière cohérente avec le navigateur et la plateforme configurés.
 * @param {object} config - L'objet de configuration.
 * @param {string} [config.browser='random'] - Le navigateur à simuler.
 * @param {string} [config.uaPlatform='random'] - La plateforme OS à utiliser pour l'User-Agent et Sec-CH-UA-Platform.
 * @param {number} [config.minVersion=0] - Version minimale du navigateur.
 * @param {number} [config.maxVersion=0] - Version maximale du navigateur.
 * @param {string} [config.secChUaMobile='random'] - Valeur pour l'en-tête Sec-CH-UA-Mobile.
 * @param {string} [config.secChUaPlatformVersion='random'] - Valeur pour l'en-tête Sec-CH-UA-Platform-Version.
 * @param {number} [config.hDeviceMemory=0] - Valeur pour l'en-tête Device-Memory.
 * @param {string} [config.referer=''] - Valeur pour l'en-tête Referer.
 * @param {number} ruleId - L'ID à assigner à la règle.
 * @returns {Array<object>} Un tableau contenant la règle de modification des en-têtes.
 */
export function getNewRules(config, ruleId) {
  let browserName = config.browser === 'random' ? getRandomElement(Object.keys(browsersVersions)) : config.browser;
  if (!browsersVersions[browserName]) {
    browserName = 'Chrome'; // Fallback
  }

  const availableVersions = browsersVersions[browserName];
  const minNavVersion = config.minVersion === 0 || !config.minVersion ? availableVersions[availableVersions.length -1] : config.minVersion;
  const maxNavVersion = config.maxVersion === 0 || !config.maxVersion ? availableVersions[0] : config.maxVersion;
  
  let majorVersion = getRandomInRange(minNavVersion, maxNavVersion);
  let fullBrowserVersion;
  let geckoVersion; // Pour Firefox
  let secChUaPlatformValue;

  const osPlatforms = ['Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
  const selectedUaPlatform = config.uaPlatform === 'random' ? getRandomElement(osPlatforms) : (config.uaPlatform || getRandomElement(osPlatforms));
  const basePlatformString = selectedUaPlatform.split(';')[0].trim(); // "Windows", "Macintosh", "X11"

  if (basePlatformString.includes('Windows')) secChUaPlatformValue = '"Windows"';
  else if (basePlatformString.includes('Macintosh')) secChUaPlatformValue = '"macOS"';
  else if (basePlatformString.includes('Linux')) secChUaPlatformValue = '"Linux"';
  else secChUaPlatformValue = '"Unknown"';


  if (browserName === 'Safari') {
    const minorSafari = getRandomInRange(0, 5);
    fullBrowserVersion = `${majorVersion}.${minorSafari}`;
  } else if (browserName === 'Firefox') {
    majorVersion = getRandomElement(availableVersions);
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,2)}.0`;
    geckoVersion = `${majorVersion}.0`;
  } else { // Chrome, Edge, Opera
    majorVersion = getRandomElement(availableVersions) || getRandomInRange(110,125);
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,9)}.${getRandomInRange(1000,5000)}.${getRandomInRange(0,99)}`;
  }

  let userAgentString;
  let brandsForSecChUa = [];

  switch (browserName) {
    case 'Firefox':
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}; rv:${geckoVersion || fullBrowserVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
      // Firefox ne supporte pas Sec-CH-UA, donc on pourrait les omettre ou mettre des valeurs génériques si nécessaire pour éviter la détection.
      // Pour l'instant, on les laisse vides ou on les supprime si possible.
      // Cependant, pour être plus "trompeur", on peut simuler ceux de Chrome.
      brandsForSecChUa = [
        { brand: "Firefox", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" }, // Valeur commune
        { brand: "Gecko", version: geckoVersion ? geckoVersion.split('.')[0] : fullBrowserVersion.split('.')[0] }
      ];
      break;
    case 'Safari':
      const macPlatformForUA = selectedUaPlatform.includes('Macintosh') ? 'Macintosh; Intel Mac OS X 10_15_7' : selectedUaPlatform;
      userAgentString = `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      brandsForSecChUa = [
        { brand: "Safari", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "AppleWebKit", version: "605" } // Version typique d'AppleWebKit pour Safari
      ];
      break;
    case 'Edge':
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      brandsForSecChUa = [
        { brand: "Microsoft Edge", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
      break;
    case 'Opera':
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion.split('.')[0]}`; // OPR version est souvent juste la majeure
      brandsForSecChUa = [
        { brand: "Opera", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
      break;
    case 'Chrome':
    default:
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      brandsForSecChUa = [
        { brand: "Google Chrome", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
      break;
  }

  const secChUaValue = config.secChUa === 'random'
    ? brandsForSecChUa.map(b => `"${b.brand}";v="${b.version}"`).join(', ')
    : config.secChUa;

  const secChUaFullVersionListValue = config.secChUaFullVersionList === 'random' // Ajout d'une option pour ce header
    ? brandsForSecChUa.map(b => `"${b.brand}";v="${b.brand === "Not A;Brand" ? b.version : fullBrowserVersion}"`).join(', ') // Utiliser fullBrowserVersion pour le navigateur principal
    : config.secChUaFullVersionList;


  const headers = [
    { header: "User-Agent", operation: "set", value: userAgentString },
    { header: "sec-ch-ua", operation: "set", value: secChUaValue },
    { header: "sec-ch-ua-mobile", operation: "set", value: config.secChUaMobile === 'random' ? "?0" : config.secChUaMobile },
    { header: "sec-ch-ua-platform", operation: "set", value: config.secChUaPlatform === 'random' ? secChUaPlatformValue : config.secChUaPlatform },
    { header: "sec-ch-ua-full-version", operation: "set", value: config.secChUaFullVersion === 'random' ? `"${fullBrowserVersion}"` : config.secChUaFullVersion },
    { header: "sec-ch-ua-platform-version", operation: "set", value: config.secChUaPlatformVersion === 'random' ? `"${getRandomInRange(10, 15)}.0.0"` : config.secChUaPlatformVersion }, // Format plus typique
    { header: "Device-Memory", operation: "set", value: config.hDeviceMemory === 0 ? String(getRandomElement([4, 8, 16])) : String(config.hDeviceMemory) }, // Ajusté pour être plus commun
    { header: "Referer", operation: "set", value: config.referer || "" },
    { header: "sec-ch-ua-full-version-list", operation: "set", value: secChUaFullVersionListValue }
  ];

  return [{
    id: ruleId,
    priority: 10,
    action: { type: "modifyHeaders", requestHeaders: headers },
    condition: {
      urlFilter: "*",
      resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "xmlhttprequest"],
    },
  }];
}

/**
 * Génère un objet contenant une fausse chaîne User-Agent et des propriétés associées (platform, appVersion)
 * qui sont cohérentes avec le navigateur et la plateforme spécifiés.
 * @param {object} config - L'objet de configuration.
 * @param {string} [config.browser='random'] - Le navigateur à simuler ('Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', ou 'random').
 * @param {number} [config.minVersion=0] - Version minimale du navigateur pour la chaîne User-Agent.
 * @param {number} [config.maxVersion=0] - Version maximale du navigateur pour la chaîne User-Agent.
 * @param {string} [config.uaPlatform='random'] - La plateforme OS à inclure dans la chaîne User-Agent (ex: 'Windows NT 10.0; Win64; x64').
 * @returns {{userAgent: string, platform: string, appVersion: string}} Un objet avec les fausses données User-Agent.
 */
export function getFakeUserAgent(config) {
  let browserName = config.browser === 'random' ? getRandomElement(Object.keys(browsersVersions)) : config.browser;
  if (!browsersVersions[browserName]) { // Fallback si le nom du navigateur n'est pas dans notre liste
    browserName = 'Chrome';
  }

  const availableVersions = browsersVersions[browserName];
  // Utiliser les versions du navigateur spécifié, ou des valeurs par défaut si non fournies
  const minNavVersion = config.minVersion === 0 || !config.minVersion ? availableVersions[availableVersions.length -1] : config.minVersion;
  const maxNavVersion = config.maxVersion === 0 || !config.maxVersion ? availableVersions[0] : config.maxVersion;

  let majorVersion = getRandomInRange(minNavVersion, maxNavVersion);
  let fullBrowserVersion;
  let geckoVersion; // Spécifique à Firefox

  if (browserName === 'Safari') {
    const minorSafari = getRandomInRange(0, 5);
    fullBrowserVersion = `${majorVersion}.${minorSafari}`;
  } else if (browserName === 'Firefox') {
    majorVersion = getRandomElement(availableVersions); // Firefox utilise souvent des versions majeures discrètes
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,2)}.0`; // ex: 115.0.0, 115.1.0
    geckoVersion = `${majorVersion}.0`; // Version de Gecko (rv:)
  } else { // Chrome, Edge, Opera
    majorVersion = getRandomElement(availableVersions) || getRandomInRange(110,125); // Fallback pour versions
    fullBrowserVersion = `${majorVersion}.${getRandomInRange(0,9)}.${getRandomInRange(1000,5000)}.${getRandomInRange(0,99)}`;
  }

  const osPlatforms = ['Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
  const selectedUaPlatform = config.uaPlatform === 'random' ? getRandomElement(osPlatforms) : (config.uaPlatform || getRandomElement(osPlatforms));
  const basePlatformString = selectedUaPlatform.split(';')[0].trim(); // Ex: "Windows NT 10.0", "Macintosh", "X11"

  let userAgentString;
  let appVersionString;

  switch (browserName) {
    case 'Firefox':
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}; rv:${geckoVersion || fullBrowserVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
      appVersionString = `5.0 (${basePlatformString})`; // Firefox appVersion est plus simple
      break;
    case 'Safari':
      // Assurer que la plateforme dans l'UA est correcte pour Safari/Mac
      const macPlatformForUA = selectedUaPlatform.includes('Macintosh') ? 'Macintosh; Intel Mac OS X 10_15_7' : selectedUaPlatform;
      userAgentString = `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      appVersionString = `5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      break;
    case 'Edge':
      // Edge utilise un format UA basé sur Chrome mais avec "Edg/"
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      appVersionString = `5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      break;
    case 'Opera':
      // Opera utilise un format UA basé sur Chrome mais avec "OPR/"
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      appVersionString = `5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      break;
    case 'Chrome':
    default: // Chrome par défaut
      userAgentString = `Mozilla/5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      appVersionString = `5.0 (${selectedUaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      break;
  }

  const fakeUserAgent_data_with_relatated_properties = {
    userAgent: userAgentString,
    platform: basePlatformString, // `navigator.platform` est généralement la partie OS principale
    appVersion: appVersionString
  };
  console.log('fakeUserAgent cree avec les propriétés suivantes: ', fakeUserAgent_data_with_relatated_properties);
  return fakeUserAgent_data_with_relatated_properties;
}
/**
 * Génère des propriétés d'écran falsifiées et cohérentes.
 * @param {object} config - L'objet de configuration.
 * @param {string} [config.spoofDeviceType='random'] - Type d'appareil à simuler ('random', 'desktop', 'mobile').
 * @param {string|number} [config.spoofDevicePixelRatio='random'] - Ratio de pixels de l'appareil.
 * @param {string} [config.spoofScreenResolution='random'] - Résolution d'écran souhaitée (ex: "1920x1080" ou "random").
 * @returns {object} Un objet contenant les fausses propriétés d'écran.
 */
export function getFakeScreenProperties(config) {
  let screenWidth, screenHeight, availWidth, availHeight, devicePixelRatio;

  const deviceType = config.spoofDeviceType === 'random' ? getRandomElement(['desktop', 'mobile']) : config.spoofDeviceType;

  // Déterminer devicePixelRatio
  if (config.spoofDevicePixelRatio === 'random') {
    devicePixelRatio = deviceType === 'mobile' ? getRandomElement([2, 2.5, 3]) : getRandomElement([1, 1.25, 1.5]);
  } else {
    devicePixelRatio = parseFloat(config.spoofDevicePixelRatio) || 1;
  }

  // Déterminer les résolutions d'écran
  if (config.spoofScreenResolution === 'random' || !config.spoofScreenResolution.includes('x')) {
    if (deviceType === 'mobile') {
      // Résolutions mobiles courantes (portrait)
      const mobileResolutions = [
        { width: 360, height: 640 }, { width: 375, height: 667 }, { width: 375, height: 812 }, // iPhones
        { width: 390, height: 844 }, { width: 414, height: 896 }, { width: 393, height: 852 }, // iPhones plus récents
        { width: 412, height: 915 }, { width: 428, height: 926 }, // Android
        { width: 320, height: 568 } // Ancien iPhone
      ];
      const res = getRandomElement(mobileResolutions);
      screenWidth = res.width;
      screenHeight = res.height;
    } else { // Desktop
      const desktopResolutions = [
        { width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1440, height: 900 },
        { width: 1536, height: 864 }, { width: 1600, height: 900 }, { width: 2560, height: 1440 }
      ];
      const res = getRandomElement(desktopResolutions);
      screenWidth = res.width;
      screenHeight = res.height;
    }
  } else {
    const parts = config.spoofScreenResolution.split('x');
    screenWidth = parseInt(parts[0], 10) || 1920;
    screenHeight = parseInt(parts[1], 10) || 1080;
  }

  // availWidth et availHeight sont généralement un peu plus petits
  availWidth = screenWidth;
  availHeight = screenHeight - getRandomInRange(20, 60); // Simuler la barre des tâches/dock

  // colorDepth et pixelDepth sont souvent 24
  const colorDepth = 24;
  const pixelDepth = 24;

  const fakeScreen = {
    width: screenWidth,
    height: screenHeight,
    availWidth: availWidth,
    availHeight: availHeight,
    colorDepth: colorDepth,
    pixelDepth: pixelDepth,
    devicePixelRatio: devicePixelRatio, // Sera utilisé pour window.devicePixelRatio
    };
    console.log('fakeScreenProperties générées:', fakeScreen);
    return fakeScreen;
  }

  /**
   * Génère des données WebRTC falsifiées pour éviter les fuites d'IP.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les données WebRTC falsifiées.
   */
  export function getFakeWebRTCData(config) {
    const fakeLocalIPs = [
      '192.168.1.100',
      '192.168.0.150',
      '10.0.0.25',
      '172.16.0.50',
      '192.168.2.75'
    ];

    const fakePublicIPs = [
      '203.0.113.1',
      '198.51.100.42',
      '203.0.113.195',
      '198.51.100.178'
    ];

    return {
      localIP: getRandomElement(fakeLocalIPs),
      publicIP: getRandomElement(fakePublicIPs),
      blockedCandidates: true,
      mediaDevicesBlocked: true
    };
  }

  /**
   * Génère des propriétés audio falsifiées pour éviter le fingerprinting audio.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés audio falsifiées.
   */
  export function getFakeAudioProperties(config) {
    const baseFingerprint = getRandomElement(advancedSpoofingData.audioFingerprints);
  
    // Ajouter un léger bruit pour rendre unique mais cohérent
    const noise = (Math.random() - 0.5) * 0.0001;
    const fakeFingerprint = baseFingerprint + noise;

    return {
      audioFingerprint: fakeFingerprint,
      sampleRate: getRandomElement([44100, 48000, 96000]),
      maxChannelCount: getRandomElement([2, 6, 8]),
      numberOfInputs: getRandomElement([0, 1, 2]),
      numberOfOutputs: getRandomElement([0, 1, 2]),
      channelCount: getRandomElement([1, 2]),
      channelCountMode: getRandomElement(['max', 'clamped-max', 'explicit']),
      channelInterpretation: getRandomElement(['speakers', 'discrete'])
    };
  }

  /**
   * Génère des propriétés de timezone falsifiées.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés de timezone falsifiées.
   */
  export function getFakeTimezoneProperties(config) {
    const timezone = config.fakeTimezone || getRandomElement(advancedSpoofingData.timezones);
  
    // Map des offsets pour chaque timezone
    const timezoneOffsets = {
      'UTC': 0,
      'America/New_York': 300,
      'America/Los_Angeles': 480,
      'America/Chicago': 360,
      'America/Toronto': 300,
      'Europe/London': 0,
      'Europe/Paris': -60,
      'Europe/Berlin': -60,
      'Europe/Madrid': -60,
      'Asia/Tokyo': -540,
      'Asia/Shanghai': -480,
      'Australia/Sydney': -660
    };

    const offset = timezoneOffsets[timezone] || 0;
  
    return {
      timezone: timezone,
      timezoneOffset: offset,
      locale: config.language || 'en-US',
      dateFormat: getRandomElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'])
    };
  }

  /**
   * Génère des propriétés WebGL falsifiées avancées.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés WebGL falsifiées.
   */
  export function getFakeWebGLProperties(config) {
    const renderer = getRandomElement(advancedSpoofingData.webglRenderers);
    const vendor = renderer.includes('Intel') ? 'Intel Inc.' : 
                   renderer.includes('NVIDIA') ? 'NVIDIA Corporation' : 
                   renderer.includes('AMD') ? 'Advanced Micro Devices, Inc.' : 
                   'Generic GPU Vendor';

    return {
      vendor: vendor,
      renderer: renderer,
      version: 'OpenGL ES 2.0',
      shadingLanguageVersion: 'WebGL GLSL ES 1.0',
      extensions: [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_color_buffer_half_float',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_texture_filter_anisotropic',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_half_float',
        'WEBGL_color_buffer_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_debug_renderer_info',
        'WEBGL_depth_texture',
        'WEBGL_lose_context'
      ],
      maxTextureSize: getRandomElement([4096, 8192, 16384]),
      maxVertexAttribs: getRandomElement([16, 32]),
      maxVaryingVectors: getRandomElement([8, 15, 30]),
      maxVertexUniformVectors: getRandomElement([1024, 4096]),
      maxFragmentUniformVectors: getRandomElement([1024, 4096])
    };
  }

  /**
   * Génère des propriétés de géolocalisation falsifiées.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés de géolocalisation falsifiées.
   */
  export function getFakeGeolocationProperties(config) {
    // Coordonnées de grandes villes pour paraître réaliste
    const fakeLocations = [
      { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
      { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' },
      { latitude: 51.5074, longitude: -0.1278, city: 'London' },
      { latitude: 48.8566, longitude: 2.3522, city: 'Paris' },
      { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo' },
      { latitude: 52.5200, longitude: 13.4050, city: 'Berlin' },
      { latitude: -33.8688, longitude: 151.2093, city: 'Sydney' }
    ];

    const location = getRandomElement(fakeLocations);
  
    // Ajouter un peu de bruit pour éviter la détection
    const latNoise = (Math.random() - 0.5) * 0.01;
    const lngNoise = (Math.random() - 0.5) * 0.01;

    return {
      latitude: location.latitude + latNoise,
      longitude: location.longitude + lngNoise,
      accuracy: getRandomInRange(10, 100),
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      blocked: config.blockGeolocation || false
    };
  }

  /**
   * Génère des propriétés de batterie falsifiées.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés de batterie falsifiées.
   */
  export function getFakeBatteryProperties(config) {
    const level = Math.random();
    const charging = Math.random() > 0.5;
  
    return {
      charging: charging,
      chargingTime: charging ? getRandomInRange(1800, 7200) : Infinity,
      dischargingTime: !charging ? getRandomInRange(3600, 28800) : Infinity,
      level: Math.round(level * 100) / 100,
      blocked: config.blockBattery || false
    };
  }

  /**
   * Génère des propriétés de connexion réseau falsifiées.
   * @param {object} config - L'objet de configuration.
   * @returns {object} Un objet contenant les propriétés de connexion falsifiées.
   */
  export function getFakeConnectionProperties(config) {
    const connectionTypes = ['ethernet', 'wifi', 'cellular', 'unknown'];
    const effectiveTypes = ['slow-2g', '2g', '3g', '4g'];
  
    return {
      downlink: getRandomInRange(1, 10),
      effectiveType: getRandomElement(effectiveTypes),
      rtt: getRandomInRange(50, 300),
      saveData: Math.random() > 0.8,
      type: getRandomElement(connectionTypes),
      blocked: config.blockConnection || false
    };
  }
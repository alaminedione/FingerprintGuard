/**
 * Module de génération de données de spoofing pour FingerprintGuard v2.1.0
 * Génère les propriétés falsifiées de manière cohérente
 */

import { getRandomElement, getRandomInRange, generateBrowserVersion } from '../utils.js';
import { BROWSER_VERSIONS, SPOOFING_DATA } from '../config/defaults.js';

/**
 * Génère des informations cohérentes sur le navigateur et la plateforme
 * @param {object} config - Configuration de l'extension
 * @returns {object} Informations générées sur le navigateur et la plateforme
 */
function generateBrowserAndPlatformInfo(config) {
  try {
    const platforms = [
      'Windows NT 10.0; Win64; x64', 
      'Windows NT 10.0; WOW64', 
      'Macintosh; Intel Mac OS X 10_15_7', 
      'X11; Linux x86_64'
    ];

    const selectedPlatform = config.platform === 'random' 
      ? getRandomElement(platforms) 
      : (config.platform || getRandomElement(platforms));
    
    const selectedUaPlatform = config.uaPlatform === 'random' 
      ? getRandomElement(platforms) 
      : (config.uaPlatform || getRandomElement(platforms));
    
    let browserName = config.browser === 'random' 
      ? getRandomElement(Object.keys(BROWSER_VERSIONS)) 
      : config.browser;
    
    if (!BROWSER_VERSIONS[browserName]) {
      console.warn(`⚠️ Unknown browser ${browserName}, falling back to Chrome`);
      browserName = 'Chrome';
    }

    const availableVersions = BROWSER_VERSIONS[browserName];
    const minNavVersion = config.minVersion || availableVersions[availableVersions.length - 1];
    const maxNavVersion = config.maxVersion || availableVersions[0];
    
    let majorVersion = getRandomInRange(
      Math.min(minNavVersion, maxNavVersion), 
      Math.max(minNavVersion, maxNavVersion)
    );
    
    let fullBrowserVersion;
    let geckoVersion;
    let secChUaPlatformValue;

    const basePlatformString = selectedPlatform.split(';')[0].trim();
    const baseUaPlatformString = selectedUaPlatform.split(';')[0].trim();

    // Déterminer la plateforme pour les en-têtes
    if (baseUaPlatformString.includes('Windows')) secChUaPlatformValue = '"Windows"';
    else if (baseUaPlatformString.includes('Macintosh')) secChUaPlatformValue = '"macOS"';
    else if (baseUaPlatformString.includes('Linux')) secChUaPlatformValue = '"Linux"';
    else secChUaPlatformValue = '"Unknown"';

    // Générer les versions selon le navigateur
    if (browserName === 'Safari') {
      const minorSafari = getRandomInRange(0, 5);
      fullBrowserVersion = `${majorVersion}.${minorSafari}`;
    } else if (browserName === 'Firefox') {
      majorVersion = getRandomElement(availableVersions) || majorVersion;
      fullBrowserVersion = `${majorVersion}.${getRandomInRange(0, 2)}.0`;
      geckoVersion = `${majorVersion}.0`;
    } else {
      // Chrome, Edge, Opera
      majorVersion = getRandomElement(availableVersions) || getRandomInRange(110, 125);
      fullBrowserVersion = `${majorVersion}.${getRandomInRange(0, 9)}.${getRandomInRange(1000, 5000)}.${getRandomInRange(0, 99)}`;
    }

    const macPlatformForUA = selectedPlatform.includes('Macintosh') 
      ? 'Macintosh; Intel Mac OS X 10_15_7' 
      : selectedPlatform;

    return {
      browserName,
      majorVersion,
      fullBrowserVersion,
      geckoVersion,
      selectedPlatform,
      selectedUaPlatform,
      basePlatformString,
      baseUaPlatformString,
      secChUaPlatformValue,
      macPlatformForUA
    };
  } catch (error) {
    console.error('❌ Error generating browser info:', error);
    
    // Configuration par défaut de fallback
    return {
      browserName: 'Chrome',
      majorVersion: 120,
      fullBrowserVersion: '120.0.0.0',
      geckoVersion: null,
      selectedPlatform: 'Windows NT 10.0; Win64; x64',
      selectedUaPlatform: 'Windows NT 10.0; Win64; x64',
      basePlatformString: 'Windows NT 10.0',
      baseUaPlatformString: 'Windows NT 10.0',
      secChUaPlatformValue: '"Windows"',
      macPlatformForUA: 'Windows NT 10.0; Win64; x64'
    };
  }
}

/**
 * Génère des propriétés de navigateur falsifiées
 * @param {object} config - Configuration de l'extension
 * @returns {object} Propriétés de navigateur falsifiées
 */
export function getFakeNavigatorProperties(config) {
  const browserInfo = generateBrowserAndPlatformInfo(config);
  const { browserName, fullBrowserVersion, geckoVersion, selectedPlatform, basePlatformString } = browserInfo;

  const language = config.language === 'random' 
    ? getRandomElement(Object.keys(SPOOFING_DATA.languages)) 
    : (config.language || getRandomElement(Object.keys(SPOOFING_DATA.languages)));
  
  const hardwareConcurrency = config.hardwareConcurrency || getRandomElement([2, 4, 8, 16]);
  const deviceMemory = config.deviceMemory || getRandomElement([4, 8, 16, 32]);

  const { userAgentString, vendorString, appNameString, appVersionString } = 
    generateUserAgentStrings(browserInfo);

  const fakeNavigator = {
    platform: basePlatformString,
    userAgent: userAgentString,
    language: language,
    languages: SPOOFING_DATA.languages[language],
    hardwareConcurrency: hardwareConcurrency,
    deviceMemory: deviceMemory,
    vendor: vendorString,
    maxTouchPoints: selectedPlatform.includes('Windows') ? 0 : (selectedPlatform.includes('Linux') ? 0 : 5),
    cookieEnabled: true,
    doNotTrack: '1',
    appName: appNameString,
    appCodeName: 'Mozilla',
    appVersion: appVersionString,
    onLine: true,
  };

  console.log('✅ Fake navigator properties generated:', fakeNavigator);
  return fakeNavigator;
}

/**
 * Génère les chaînes User-Agent selon le navigateur
 * @param {object} browserInfo - Informations sur le navigateur
 * @returns {object} Chaînes générées
 */
function generateUserAgentStrings(browserInfo) {
  const { 
    browserName, 
    fullBrowserVersion, 
    geckoVersion, 
    selectedPlatform, 
    basePlatformString,
    macPlatformForUA 
  } = browserInfo;

  let userAgentString, vendorString, appNameString = 'Netscape', appVersionString;

  switch (browserName) {
    case 'Firefox':
      userAgentString = `Mozilla/5.0 (${selectedPlatform}; rv:${geckoVersion || fullBrowserVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
      vendorString = '';
      appVersionString = `5.0 (${basePlatformString})`;
      break;
      
    case 'Safari':
      userAgentString = `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      vendorString = 'Apple Computer, Inc.';
      appVersionString = `5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
      break;
      
    case 'Edge':
      userAgentString = `Mozilla/5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      vendorString = 'Google Inc.';
      appVersionString = `5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 Edg/${fullBrowserVersion}`;
      break;
      
    case 'Opera':
      userAgentString = `Mozilla/5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      vendorString = 'Google Inc.';
      appVersionString = `5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion.split('.')[0]}.0.0.0 Safari/537.36 OPR/${fullBrowserVersion}`;
      break;
      
    case 'Chrome':
    default:
      userAgentString = `Mozilla/5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      vendorString = 'Google Inc.';
      appVersionString = `5.0 (${selectedPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
      break;
  }

  return { userAgentString, vendorString, appNameString, appVersionString };
}

/**
 * Génère des données User-Agent falsifiées
 * @param {object} config - Configuration de l'extension
 * @param {string} browserName - Nom du navigateur
 * @returns {object} Données User-Agent falsifiées
 */
export function getFakeUserAgentData(config, browserName) {
  const browserInfo = generateBrowserAndPlatformInfo(config);
  const { fullBrowserVersion, baseUaPlatformString, browserName: generatedBrowserName } = browserInfo;

  const platforms = {
    'Windows': ['10.0.0', '10.0.19042', '10.0.22000', '10.0.22621'],
    'macOS': ['10.15.7', '11.6.0', '12.0.1', '13.0.0'],
    'Linux': ['5.15.0', '5.10.0', '6.0.0'],
    'Android': ['10', '11', '12', '13'],
    'iOS': ['14', '15', '16']
  };

  const platform = baseUaPlatformString;
  const platformVersion = config.uaPlatformVersion === 'random'
    ? (platforms[platform] ? getRandomElement(platforms[platform]) : `${getRandomInRange(6, 12)}.${getRandomInRange(0, 10)}.${getRandomInRange(0, 100)}`)
    : config.uaPlatformVersion;

  const architecture = config.uaArchitecture === 'random'
    ? getRandomElement(["x86", "x64", "arm", "arm64"])
    : config.uaArchitecture;

  const bitness = config.uaBitness === 'random'
    ? getRandomElement(["32", "64"])
    : config.uaBitness;

  const wow64 = config.uaWow64 === 'random'
    ? getRandomElement([true, false])
    : config.uaWow64;

  const model = config.uaModel === 'random'
    ? getRandomElement(["", "Pixel 7", "iPhone", "Samsung Galaxy S23"])
    : config.uaModel;

  const uaFullVersion = config.uaFullVersion === 'random'
    ? fullBrowserVersion
    : config.uaFullVersion;

  const brands = [
    { brand: generatedBrowserName, version: uaFullVersion.split('.')[0] },
    { brand: "Not A;Brand", version: generateBrowserVersion(8, 20).split('.')[0] },
    { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
  ];

  const fakeUserAgentData = {
    brands,
    mobile: model !== '',
    platform,
    platformVersion,
    architecture,
    bitness,
    wow64,
    model,
    uaFullVersion,
    fullVersionList: [
      { brand: generatedBrowserName, version: uaFullVersion },
      { brand: "Not A;Brand", version: generateBrowserVersion(8, 20) },
      { brand: "Chromium", version: fullBrowserVersion }
    ],
  };

  console.log('✅ Fake UserAgentData generated:', fakeUserAgentData);
  return fakeUserAgentData;
}

/**
 * Génère des propriétés d'écran falsifiées
 * @param {object} config - Configuration de l'extension  
 * @returns {object} Propriétés d'écran falsifiées
 */
export function getFakeScreenProperties(config) {
  // Déterminer le type d'appareil
  let deviceType = config.spoofDeviceType === 'random' 
    ? getRandomElement(['desktop', 'mobile', 'tablet'])
    : config.spoofDeviceType;

  // Fallback si le type n'est pas reconnu
  if (!SPOOFING_DATA.screenResolutions[deviceType]) {
    deviceType = 'desktop';
  }

  // Sélectionner une résolution
  const resolution = config.spoofScreenResolution === 'random'
    ? getRandomElement(SPOOFING_DATA.screenResolutions[deviceType])
    : JSON.parse(config.spoofScreenResolution || '{"width": 1920, "height": 1080, "ratio": 1}');

  // Déterminer le ratio de pixels
  const devicePixelRatio = config.spoofDevicePixelRatio === 'random'
    ? resolution.ratio || getRandomElement([1, 1.25, 1.5, 2, 2.5, 3])
    : parseFloat(config.spoofDevicePixelRatio) || 1;

  const fakeScreen = {
    width: resolution.width,
    height: resolution.height,
    availWidth: resolution.width,
    availHeight: resolution.height - (deviceType === 'desktop' ? 40 : 0), // Barre des tâches
    colorDepth: 24,
    pixelDepth: 24,
    devicePixelRatio
  };

  console.log('✅ Fake screen properties generated:', fakeScreen);
  return fakeScreen;
}

/**
 * Génère des règles de modification des en-têtes HTTP
 * @param {object} config - Configuration de l'extension
 * @param {number} ruleId - ID de la règle
 * @returns {Array} Règles de modification des en-têtes
 */
export function getNewRules(config, ruleId) {
  const browserInfo = generateBrowserAndPlatformInfo(config);
  const { browserName, fullBrowserVersion, geckoVersion, selectedUaPlatform, secChUaPlatformValue } = browserInfo;

  const { userAgentString } = generateUserAgentStrings(browserInfo);
  const brands = generateBrandsForHeaders(browserName, fullBrowserVersion, geckoVersion);

  const secChUaValue = config.secChUa === 'random'
    ? brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ')
    : config.secChUa;

  const secChUaFullVersionListValue = config.secChUaFullVersionList === 'random'
    ? brands.map(b => `"${b.brand}";v="${b.brand === "Not A;Brand" ? b.version : fullBrowserVersion}"`).join(', ')
    : config.secChUaFullVersionList;

  const headers = [
    { header: "User-Agent", operation: "set", value: userAgentString },
    { header: "sec-ch-ua", operation: "set", value: secChUaValue },
    { header: "sec-ch-ua-mobile", operation: "set", value: config.secChUaMobile === 'random' ? "?0" : config.secChUaMobile },
    { header: "sec-ch-ua-platform", operation: "set", value: config.secChUaPlatform === 'random' ? secChUaPlatformValue : config.secChUaPlatform },
    { header: "sec-ch-ua-full-version", operation: "set", value: config.secChUaFullVersion === 'random' ? `"${fullBrowserVersion}"` : config.secChUaFullVersion },
    { header: "sec-ch-ua-platform-version", operation: "set", value: config.secChUaPlatformVersion === 'random' ? `"${getRandomInRange(10, 15)}.0.0"` : config.secChUaPlatformVersion },
    { header: "Device-Memory", operation: "set", value: config.hDeviceMemory === 0 ? String(getRandomElement([4, 8, 16])) : String(config.hDeviceMemory) },
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
 * Génère les brands pour les en-têtes Client Hints
 * @param {string} browserName - Nom du navigateur
 * @param {string} fullBrowserVersion - Version complète
 * @param {string} geckoVersion - Version Gecko (pour Firefox)
 * @returns {Array} Liste des brands
 */
function generateBrandsForHeaders(browserName, fullBrowserVersion, geckoVersion) {
  switch (browserName) {
    case 'Firefox':
      return [
        { brand: "Firefox", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Gecko", version: geckoVersion ? geckoVersion.split('.')[0] : fullBrowserVersion.split('.')[0] }
      ];
      
    case 'Safari':
      return [
        { brand: "Safari", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "AppleWebKit", version: "605" }
      ];
      
    case 'Edge':
      return [
        { brand: "Microsoft Edge", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
      
    case 'Opera':
      return [
        { brand: "Opera", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
      
    case 'Chrome':
    default:
      return [
        { brand: "Google Chrome", version: fullBrowserVersion.split('.')[0] },
        { brand: "Not A;Brand", version: "99" },
        { brand: "Chromium", version: fullBrowserVersion.split('.')[0] }
      ];
  }
}

/**
 * Génère un faux User-Agent simple
 * @param {object} config - Configuration de l'extension
 * @returns {object} Objet contenant User-Agent, platform et appVersion
 */
export function getFakeUserAgent(config) {
  const browserInfo = generateBrowserAndPlatformInfo(config);
  const { basePlatformString } = browserInfo;
  const { userAgentString, appVersionString } = generateUserAgentStrings(browserInfo);

  return {
    userAgent: userAgentString,
    platform: basePlatformString,
    appVersion: appVersionString
  };
}
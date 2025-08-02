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
    
    let majorVersion = getRandomElement(availableVersions) || availableVersions[0];
    let fullBrowserVersion;
    let geckoVersion;

    const basePlatformString = selectedPlatform.split(';')[0].trim();
    const baseUaPlatformString = selectedUaPlatform.split(';')[0].trim();

    let secChUaPlatformValue;
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
      fullBrowserVersion = `${majorVersion}.0`;
      geckoVersion = `${majorVersion}.0`;
    } else {
      // Chrome, Edge, Opera
      fullBrowserVersion = `${majorVersion}.0.0.0`;
    }

    const macPlatformForUA = selectedPlatform.includes('Macintosh') 
      ? 'Macintosh; Intel Mac OS X 10_15_7' 
      : selectedPlatform;

    const platformData = SPOOFING_DATA.platforms[selectedPlatform] || SPOOFING_DATA.platforms['Windows NT 10.0; Win64; x64'];

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
      macPlatformForUA,
      platformData
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
 * Génère les propriétés Navigator falsifiées
 * @param {object} config - Configuration de l'extension
 * @returns {object} Propriétés Navigator falsifiées
 */
export function getFakeNavigatorProperties(config) {
  try {
    const browserInfo = generateBrowserAndPlatformInfo(config);
    const platformData = browserInfo.platformData;

    // Générer les propriétés cohérentes
    const hardwareConcurrency = config.hardwareConcurrency === 0 || config.hardwareConcurrency === 'random'
      ? getRandomElement(platformData.hardwareConcurrency)
      : config.hardwareConcurrency || getRandomElement(platformData.hardwareConcurrency);

    const deviceMemory = config.deviceMemory === 0 || config.deviceMemory === 'random'
      ? getRandomElement(platformData.deviceMemory)
      : config.deviceMemory || getRandomElement(platformData.deviceMemory);

    const language = config.language === 'random'
      ? getRandomElement(platformData.languages)
      : config.language || getRandomElement(platformData.languages);

    const languages = [language, 'en'];

    return {
      userAgent: generateUserAgent(browserInfo),
      platform: getPlatformString(browserInfo.selectedPlatform),
      language: language,
      languages: languages,
      hardwareConcurrency: hardwareConcurrency,
      deviceMemory: deviceMemory,
      vendor: getVendorString(browserInfo.browserName),
      appVersion: getAppVersionString(browserInfo),
      oscpu: getOsCpuString(browserInfo.selectedPlatform),
      cookieEnabled: true,
      onLine: true,
      doNotTrack: getRandomElement([null, '1']),
      maxTouchPoints: getMaxTouchPoints(browserInfo.selectedPlatform)
    };
  } catch (error) {
    console.error('❌ Error generating Navigator properties:', error);
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      platform: 'Win32',
      language: 'en-US',
      languages: ['en-US', 'en'],
      hardwareConcurrency: 4,
      deviceMemory: 8,
      vendor: 'Google Inc.',
      appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      oscpu: undefined,
      cookieEnabled: true,
      onLine: true,
      doNotTrack: null,
      maxTouchPoints: 0
    };
  }
}

/**
 * Génère les données User-Agent falsifiées
 * @param {object} config - Configuration de l'extension
 * @param {string} browser - Navigateur cible
 * @returns {object} Données User-Agent falsifiées
 */
export function getFakeUserAgentData(config, browser) {
  try {
    const browserInfo = generateBrowserAndPlatformInfo({ ...config, browser });
    
    const brands = generateBrands(browserInfo.browserName, browserInfo.majorVersion);
    const mobile = browserInfo.selectedPlatform.includes('Mobile') || browserInfo.selectedPlatform.includes('Android');
    
    return {
      brands: brands,
      mobile: mobile,
      platform: getPlatformForUA(browserInfo.selectedPlatform),
      architecture: getArchitecture(browserInfo.selectedPlatform),
      bitness: getBitness(browserInfo.selectedPlatform),
      model: '',
      platformVersion: getPlatformVersion(browserInfo.selectedPlatform),
      uaFullVersion: browserInfo.fullBrowserVersion,
      fullVersionList: generateFullVersionList(browserInfo.browserName, browserInfo.fullBrowserVersion),
      wow64: browserInfo.selectedPlatform.includes('WOW64')
    };
  } catch (error) {
    console.error('❌ Error generating User-Agent data:', error);
    return {
      brands: [{ brand: 'Google Chrome', version: '120' }],
      mobile: false,
      platform: 'Windows',
      architecture: 'x86',
      bitness: '64',
      model: '',
      platformVersion: '10.0.0',
      uaFullVersion: '120.0.0.0',
      fullVersionList: [{ brand: 'Google Chrome', version: '120.0.0.0' }],
      wow64: false
    };
  }
}

/**
 * Génère la chaîne User-Agent falsifiée
 * @param {object} config - Configuration de l'extension
 * @returns {string} Chaîne User-Agent falsifiée
 */
export function getFakeUserAgent(config) {
  try {
    const browserInfo = generateBrowserAndPlatformInfo(config);
    return generateUserAgent(browserInfo);
  } catch (error) {
    console.error('❌ Error generating User-Agent:', error);
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }
}

/**
 * Génère les propriétés d'écran falsifiées
 * @param {object} config - Configuration de l'extension
 * @returns {object} Propriétés d'écran falsifiées
 */
export function getFakeScreenProperties(config) {
  try {
    let resolution;
    
    if (config.spoofScreenResolution === 'random' || !config.spoofScreenResolution) {
      resolution = getRandomElement(SPOOFING_DATA.screenResolutions);
    } else {
      const customRes = config.spoofScreenResolution.split('x');
      if (customRes.length === 2) {
        resolution = {
          width: parseInt(customRes[0]),
          height: parseInt(customRes[1])
        };
      } else {
        resolution = getRandomElement(SPOOFING_DATA.screenResolutions);
      }
    }

    const devicePixelRatio = config.spoofDevicePixelRatio === 'random'
      ? getRandomElement(SPOOFING_DATA.devicePixelRatios)
      : parseFloat(config.spoofDevicePixelRatio) || 1;

    const availHeight = resolution.height - getRandomInRange(40, 80); // Taskbar height
    const availWidth = resolution.width;

    return {
      width: resolution.width,
      height: resolution.height,
      availWidth: availWidth,
      availHeight: availHeight,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: devicePixelRatio
    };
  } catch (error) {
    console.error('❌ Error generating screen properties:', error);
    return {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: 1
    };
  }
}

/**
 * Génère de nouvelles règles de modification des en-têtes HTTP
 * @param {object} config - Configuration de l'extension
 * @param {number} ruleId - ID de la règle
 * @returns {Array} Règles de modification
 */
export function getNewRules(config, ruleId = 1) {
  try {
    const browserInfo = generateBrowserAndPlatformInfo(config);
    const userAgent = generateUserAgent(browserInfo);
    
    return [{
      id: ruleId,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "User-Agent", operation: "set", value: userAgent },
          { header: "Sec-CH-UA", operation: "set", value: generateSecChUa(browserInfo) },
          { header: "Sec-CH-UA-Mobile", operation: "set", value: "?0" },
          { header: "Sec-CH-UA-Platform", operation: "set", value: browserInfo.secChUaPlatformValue },
          { header: "Accept-Language", operation: "set", value: getAcceptLanguage(config.language) }
        ]
      },
      condition: {
        urlFilter: "*",
        resourceTypes: [
          "main_frame", "sub_frame", "stylesheet", "script", "image", 
          "font", "object", "xmlhttprequest", "ping", "csp_report", 
          "media", "websocket", "other"
        ]
      }
    }];
  } catch (error) {
    console.error('❌ Error generating rules:', error);
    return [];
  }
}

// Fonctions utilitaires

function generateUserAgent(browserInfo) {
  const { browserName, fullBrowserVersion, macPlatformForUA } = browserInfo;
  
  switch (browserName) {
    case 'Chrome':
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
    case 'Firefox':
      return `Mozilla/5.0 (${macPlatformForUA}; rv:${fullBrowserVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
    case 'Safari':
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${fullBrowserVersion} Safari/605.1.15`;
    case 'Edge':
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36 Edg/${fullBrowserVersion}`;
    case 'Opera':
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36 OPR/${fullBrowserVersion}`;
    default:
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
  }
}

function getPlatformString(platform) {
  if (platform.includes('Windows')) return 'Win32';
  if (platform.includes('Macintosh')) return 'MacIntel';
  if (platform.includes('Linux')) return 'Linux x86_64';
  return 'Unknown';
}

function getVendorString(browserName) {
  switch (browserName) {
    case 'Chrome':
    case 'Edge':
    case 'Opera':
      return 'Google Inc.';
    case 'Firefox':
      return '';
    case 'Safari':
      return 'Apple Computer, Inc.';
    default:
      return 'Google Inc.';
  }
}

function getAppVersionString(browserInfo) {
  return `5.0 (${browserInfo.macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserInfo.fullBrowserVersion} Safari/537.36`;
}

function getOsCpuString(platform) {
  if (platform.includes('Windows')) return 'Windows NT 10.0';
  if (platform.includes('Macintosh')) return 'Intel Mac OS X';
  if (platform.includes('Linux')) return 'X11; Linux x86_64';
  return undefined;
}

function getMaxTouchPoints(platform) {
  // Si la plateforme est mobile (Android ou iOS), retourne un nombre aléatoire de points de contact
  if (platform.includes('Android') || platform.includes('iPhone') || platform.includes('iPad')) {
    return getRandomInRange(1, 10);
  }
  // Sinon, retourne 0 pour les plateformes de bureau
  return 0;
}

function getPlatformForUA(platform) {
  if (platform.includes('Windows')) return 'Windows';
  if (platform.includes('Macintosh')) return 'macOS';
  if (platform.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function getArchitecture(platform) {
  if (platform.includes('x64') || platform.includes('x86_64')) return 'x86';
  if (platform.includes('ARM')) return 'arm';
  return 'x86';
}

function getBitness(platform) {
  if (platform.includes('x64') || platform.includes('64')) return '64';
  return '32';
}

function getPlatformVersion(platform) {
  if (platform.includes('Windows NT 10.0')) return '10.0.0';
  if (platform.includes('Mac OS X 10_15')) return '10.15.7';
  if (platform.includes('Linux')) return '';
  return '10.0.0';
}

function generateBrands(browserName, majorVersion) {
  const brands = [];
  
  switch (browserName) {
    case 'Chrome':
      brands.push({ brand: 'Google Chrome', version: majorVersion.toString() });
      brands.push({ brand: 'Chromium', version: majorVersion.toString() });
      break;
    case 'Edge':
      brands.push({ brand: 'Microsoft Edge', version: majorVersion.toString() });
      brands.push({ brand: 'Chromium', version: majorVersion.toString() });
      break;
    case 'Opera':
      brands.push({ brand: 'Opera', version: majorVersion.toString() });
      brands.push({ brand: 'Chromium', version: majorVersion.toString() });
      break;
    default:
      brands.push({ brand: 'Google Chrome', version: majorVersion.toString() });
      break;
  }
  
  brands.push({ brand: 'Not_A Brand', version: '8' });
  return brands;
}

function generateFullVersionList(browserName, fullVersion) {
  const brands = generateBrands(browserName, parseInt(fullVersion.split('.')[0]));
  return brands.map(brand => ({ brand: brand.brand, version: fullVersion }));
}

function generateSecChUa(browserInfo) {
  const brands = generateBrands(browserInfo.browserName, browserInfo.majorVersion);
  return brands.map(brand => `"${brand.brand}";v="${brand.version}"`).join(', ');
}

function getAcceptLanguage(language) {
  const lang = language || 'en-US';
  return `${lang},${lang.split('-')[0]};q=0.9`;
}
/**
 * Module de génération de données de spoofing pour FingerprintGuard v3.0.0
 * Génère un profil d'empreinte digitale complet et cohérent.
 */

import { getRandomElement, getRandomInRange } from '../utils.js';
import { BROWSER_VERSIONS, SPOOFING_DATA } from '../config/defaults.js';

// --- Fonctions de génération de bas niveau (internes au module) ---

function generateBrowserAndPlatformInfo(config = {}) {
  try {
    const ecosystems = {
      windows: {
        platforms: ['Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64'],
        browsers: ['Chrome', 'Firefox', 'Edge', 'Opera']
      },
      macos: {
        platforms: ['Macintosh; Intel Mac OS X 10_15_7'],
        browsers: ['Chrome', 'Firefox', 'Safari', 'Opera']
      },
      linux: {
        platforms: ['X11; Linux x86_64'],
        browsers: ['Chrome', 'Firefox', 'Opera']
      }
    };

    let selectedPlatform, browserName;

    if (config.platform === 'random' || !config.platform) {
      const selectedOs = getRandomElement(Object.keys(ecosystems));
      selectedPlatform = getRandomElement(ecosystems[selectedOs].platforms);
      browserName = getRandomElement(ecosystems[selectedOs].browsers);
    } else {
      selectedPlatform = config.platform;
      const os = selectedPlatform.includes('Win') ? 'windows' : (selectedPlatform.includes('Mac') ? 'macos' : 'linux');
      browserName = (config.browser === 'random' || !config.browser || !ecosystems[os].browsers.includes(config.browser)) 
        ? getRandomElement(ecosystems[os].browsers)
        : config.browser;
    }

    if (!BROWSER_VERSIONS[browserName]) {
      console.warn(`⚠️ Unknown browser ${browserName}, falling back to Chrome`);
      browserName = 'Chrome';
    }

    const availableVersions = BROWSER_VERSIONS[browserName];
    const majorVersion = getRandomElement(availableVersions) || availableVersions[0];
    let fullBrowserVersion, geckoVersion;

    if (browserName === 'Safari') {
      fullBrowserVersion = `${majorVersion}.${getRandomInRange(0, 5)}`;
    } else if (browserName === 'Firefox') {
      fullBrowserVersion = `${majorVersion}.0`;
      geckoVersion = `${majorVersion}.0`;
    } else { // Chrome, Edge, Opera
      fullBrowserVersion = `${majorVersion}.0.0.0`;
    }

    const platformData = SPOOFING_DATA.platforms[selectedPlatform] || SPOOFING_DATA.platforms['Windows NT 10.0; Win64; x64'];
    const macPlatformForUA = selectedPlatform.includes('Macintosh') ? 'Macintosh; Intel Mac OS X 10_15_7' : selectedPlatform;
    
    let secChUaPlatformValue;
    if (selectedPlatform.includes('Windows')) secChUaPlatformValue = '"Windows"';
    else if (selectedPlatform.includes('Macintosh')) secChUaPlatformValue = '"macOS"';
    else if (selectedPlatform.includes('Linux')) secChUaPlatformValue = '"Linux"';
    else secChUaPlatformValue = '"Unknown"';

    return {
      browserName,
      majorVersion,
      fullBrowserVersion,
      geckoVersion,
      selectedPlatform,
      platformData,
      macPlatformForUA,
      secChUaPlatformValue
    };
  } catch (error) {
    console.error('❌ Error generating browser info:', error);
    // Fallback robuste
    return {
      browserName: 'Chrome',
      majorVersion: 126,
      fullBrowserVersion: '126.0.0.0',
      geckoVersion: null,
      selectedPlatform: 'Windows NT 10.0; Win64; x64',
      platformData: SPOOFING_DATA.platforms['Windows NT 10.0; Win64; x64'],
      macPlatformForUA: 'Windows NT 10.0; Win64; x64',
      secChUaPlatformValue: '"Windows"'
    };
  }
}

function generateUserAgent(browserInfo) {
  const { browserName, fullBrowserVersion, macPlatformForUA, geckoVersion } = browserInfo;
  switch (browserName) {
    case 'Chrome':
      return `Mozilla/5.0 (${macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fullBrowserVersion} Safari/537.36`;
    case 'Firefox':
      return `Mozilla/5.0 (${macPlatformForUA}; rv:${geckoVersion}) Gecko/20100101 Firefox/${fullBrowserVersion}`;
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

function generateBrands(browserName, majorVersion) {
    const brands = [];
    const chromiumVersion = majorVersion;

    switch (browserName) {
        case 'Chrome':
            brands.push({ brand: 'Google Chrome', version: String(majorVersion) });
            brands.push({ brand: 'Chromium', version: String(chromiumVersion) });
            break;
        case 'Edge':
            brands.push({ brand: 'Microsoft Edge', version: String(majorVersion) });
            brands.push({ brand: 'Chromium', version: String(chromiumVersion) });
            break;
        case 'Opera':
            brands.push({ brand: 'Opera', version: String(majorVersion) });
            brands.push({ brand: 'Chromium', version: String(chromiumVersion) });
            break;
        default: // Pour Safari et Firefox, on ne met pas de brand Chromium
            break;
    }
    brands.push({ brand: 'Not_A Brand', version: '8' });
    return brands;
}


// --- Fonctions d'assemblage (exportées) ---

/**
 * Génère un profil d'empreinte digitale complet et cohérent.
 * C'est le point d'entrée principal pour le spoofing.
 * @param {object} config - La configuration du profil utilisateur (peut être vide).
 * @returns {object} Un objet contenant toutes les données de spoofing cohérentes.
 */
export function generateCoherentProfile(config = {}) {
  const browserInfo = generateBrowserAndPlatformInfo(config);
  const { platformData, selectedPlatform, browserName } = browserInfo;

  // --- Navigator Object ---
  const language = config.language === 'random' || !config.language
    ? getRandomElement(platformData.languages)
    : config.language;

  const hardwareConcurrency = config.hardwareConcurrency === 0 || config.hardwareConcurrency === 'random' || !config.hardwareConcurrency
    ? getRandomElement(platformData.hardwareConcurrency)
    : config.hardwareConcurrency;

  const deviceMemory = config.deviceMemory === 0 || config.deviceMemory === 'random' || !config.deviceMemory
    ? getRandomElement(platformData.deviceMemory)
    : config.deviceMemory;

  const fakeNavigator = {
    userAgent: generateUserAgent(browserInfo),
    language: language,
    languages: [language, 'en'],
    platform: selectedPlatform.includes('Win') ? 'Win32' : (selectedPlatform.includes('Mac') ? 'MacIntel' : 'Linux x86_64'),
    vendor: browserName === 'Firefox' ? '' : (browserName === 'Safari' ? 'Apple Computer, Inc.' : 'Google Inc.'),
    appVersion: `5.0 (${browserInfo.macPlatformForUA})`,
    hardwareConcurrency,
    deviceMemory,
    cookieEnabled: true,
    onLine: true,
    doNotTrack: getRandomElement([null, '1']),
    maxTouchPoints: 0, // Toujours 0 pour desktop
  };
  
  if (browserName === 'Firefox') {
    fakeNavigator.oscpu = selectedPlatform.includes('Win') ? 'Windows NT 10.0' : (selectedPlatform.includes('Mac') ? 'Intel Mac OS X 10.15' : 'Linux x86_64');
  }
  
  if (browserName !== 'Firefox' && browserName !== 'Safari') {
      fakeNavigator.appVersion = `5.0 (${browserInfo.macPlatformForUA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserInfo.fullBrowserVersion} Safari/537.36`;
  } else if (browserName === 'Safari') {
      fakeNavigator.appVersion = `5.0 (${browserInfo.macPlatformForUA}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browserInfo.fullBrowserVersion} Safari/605.1.15`;
  }


  // --- User Agent Client Hints (pour les navigateurs Chromium) ---
  const brands = generateBrands(browserName, browserInfo.majorVersion);
  const fakeUserAgentData = {
    brands,
    mobile: false,
    platform: browserInfo.secChUaPlatformValue.replace(/"/g, ''), // "Windows" -> Windows
    architecture: selectedPlatform.includes('x64') ? 'x86' : 'arm',
    bitness: selectedPlatform.includes('WOW64') ? '32' : (selectedPlatform.includes('x64') ? '64' : '32'),
    model: '',
    platformVersion: selectedPlatform.includes('Linux') ? '' : (selectedPlatform.match(/(\d+_\d+_\d+)|(\d+\.\d+)/)?.[0].replace(/_/g, '.') || '10.0'),
    uaFullVersion: browserInfo.fullBrowserVersion,
    fullVersionList: brands.map(b => ({ brand: b.brand, version: browserInfo.fullBrowserVersion })),
    wow64: selectedPlatform.includes('WOW64'),
  };

  // --- Screen Properties ---
  const resolution = (config.spoofScreenResolution === 'random' || !config.spoofScreenResolution)
    ? getRandomElement(SPOOFING_DATA.screenResolutions)
    : { width: parseInt(config.spoofScreenResolution.split('x')[0]), height: parseInt(config.spoofScreenResolution.split('x')[1]) };
  
  const fakeScreenProperties = {
    width: resolution.width,
    height: resolution.height,
    availWidth: resolution.width,
    availHeight: resolution.height - getRandomInRange(40, 80), // Simule la barre des tâches
    colorDepth: 24,
    pixelDepth: 24,
    devicePixelRatio: config.spoofDevicePixelRatio === 'random' || !config.spoofDevicePixelRatio
      ? getRandomElement(SPOOFING_DATA.devicePixelRatios)
      : parseFloat(config.spoofDevicePixelRatio)
  };

  // --- HTTP Header Rules ---
  const secChUa = brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ');
  const rules = [{
    id: 1,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "User-Agent", operation: "set", value: fakeNavigator.userAgent },
        { header: "Accept-Language", operation: "set", value: `${language},${language.split('-')[0]};q=0.9` }
      ]
    },
    condition: { resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"] }
  }];

  if (browserName !== 'Firefox' && browserName !== 'Safari') {
      rules[0].action.requestHeaders.push(
          { header: "Sec-CH-UA", operation: "set", value: secChUa },
          { header: "Sec-CH-UA-Mobile", operation: "set", value: "?0" },
          { header: "Sec-CH-UA-Platform", operation: "set", value: browserInfo.secChUaPlatformValue }
      );
  }

  return {
    fakeNavigator,
    fakeUserAgentData,
    fakeScreenProperties,
    rules
  };
}
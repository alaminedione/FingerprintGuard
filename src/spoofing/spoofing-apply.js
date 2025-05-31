/**
 * Module d'application de spoofing pour FingerprintGuard v2.1.0
 * Contient toutes les fonctions d'injection de spoofing dans les pages web
 */

/**
 * Applique les propriétés de navigateur falsifiées à l'objet `navigator` global
 * @param {object} fakeNavigator - Propriétés de navigateur à usurper
 */
export function applySpoofingNavigator(fakeNavigator) {
  try {
    const propertiesToSpoof = Object.keys(fakeNavigator);

    // Appliquer le spoofing pour chaque propriété
    propertiesToSpoof.forEach((prop) => {
      try {
        Object.defineProperty(navigator, prop, {
          get: () => fakeNavigator[prop],
          configurable: true,
          enumerable: true,
        });
        console.log(`✅ Navigator property '${prop}' spoofed with value:`, fakeNavigator[prop]);
      } catch (error) {
        console.warn(`⚠️ Could not spoof navigator.${prop}:`, error.message);
      }
    });

    // Application du spoofing des plugins et mimeTypes
    applySpoofingPlugins();

    console.log('✅ Navigator spoofing applied successfully');
  } catch (error) {
    console.error('❌ Error applying navigator spoofing:', error);
  }
}

/**
 * Applique le spoofing des plugins et mimeTypes
 */
function applySpoofingPlugins() {
  try {
    // Fake PluginArray vide pour éviter la détection
    const fakePlugins = [];
    Object.defineProperty(fakePlugins, 'length', { get: () => 0 });
    fakePlugins.item = (index) => null;
    fakePlugins.namedItem = (name) => null;
    fakePlugins.refresh = () => {}; // No-op

    // Fake MimeTypeArray vide
    const fakeMimeTypes = [];
    Object.defineProperty(fakeMimeTypes, 'length', { get: () => 0 });
    fakeMimeTypes.item = (index) => null;
    fakeMimeTypes.namedItem = (name) => null;

    // Appliquer les spoofs
    Object.defineProperty(navigator, 'plugins', {
      get: () => fakePlugins,
      configurable: true,
      enumerable: true
    });

    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => fakeMimeTypes,
      configurable: true,
      enumerable: true
    });

    console.log('✅ Navigator plugins and mimeTypes spoofed');
  } catch (error) {
    console.warn('⚠️ Could not spoof plugins/mimeTypes:', error.message);
  }
}

/**
 * Applique les données User-Agent falsifiées à `navigator.userAgentData`
 * @param {object} fakeUserAgentData - Objet User-Agent Data falsifié
 */
export function applyUserAgentData(fakeUserAgentData) {
  try {
    // Créer un objet avec les méthodes nécessaires
    const spoofedUserAgentData = {
      ...fakeUserAgentData,
      
      // Méthode getHighEntropyValues avec validation
      getHighEntropyValues(hints) {
        const validHints = Array.isArray(hints) ? hints : [];
        const result = {};
        
        validHints.forEach(hint => {
          switch (hint) {
            case 'architecture':
              result.architecture = fakeUserAgentData.architecture || 'x86';
              break;
            case 'bitness':
              result.bitness = fakeUserAgentData.bitness || '64';
              break;
            case 'model':
              result.model = fakeUserAgentData.model || '';
              break;
            case 'platformVersion':
              result.platformVersion = fakeUserAgentData.platformVersion || '10.0.0';
              break;
            case 'uaFullVersion':
              result.uaFullVersion = fakeUserAgentData.uaFullVersion || '120.0.0.0';
              break;
            case 'fullVersionList':
              result.fullVersionList = fakeUserAgentData.fullVersionList || [];
              break;
            case 'wow64':
              result.wow64 = fakeUserAgentData.wow64 || false;
              break;
          }
        });
        
        return Promise.resolve(result);
      },

      // Méthode toJSON pour la sérialisation
      toJSON() {
        return {
          brands: fakeUserAgentData.brands,
          mobile: fakeUserAgentData.mobile,
          platform: fakeUserAgentData.platform
        };
      }
    };

    Object.defineProperty(navigator, 'userAgentData', {
      get: () => spoofedUserAgentData,
      configurable: true,
      enumerable: true
    });

    console.log('✅ UserAgentData spoofed:', navigator.userAgentData);
  } catch (error) {
    console.error('❌ Error applying userAgentData spoofing:', error);
  }
}

/**
 * Applique une chaîne User-Agent, plateforme et version d'application falsifiées
 * @param {object} userAgentObj - Objet contenant les nouvelles valeurs
 */
export function applyUserAgent(userAgentObj) {
  try {
    // Appliquer le User-Agent
    if (userAgentObj.userAgent) {
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgentObj.userAgent,
        configurable: true,
        enumerable: true
      });
      console.log('✅ Navigator.userAgent spoofed:', userAgentObj.userAgent);
    }

    // Appliquer la plateforme
    if (userAgentObj.platform) {
      Object.defineProperty(navigator, 'platform', {
        value: userAgentObj.platform,
        configurable: true,
        enumerable: true
      });
      console.log('✅ Navigator.platform spoofed:', userAgentObj.platform);
    }

    // Appliquer la version de l'application
    if (userAgentObj.appVersion) {
      Object.defineProperty(navigator, 'appVersion', {
        value: userAgentObj.appVersion,
        configurable: true,
        enumerable: true
      });
      console.log('✅ Navigator.appVersion spoofed:', userAgentObj.appVersion);
    }
  } catch (error) {
    console.error('❌ Error applying userAgent spoofing:', error);
  }
}

/**
 * Applique le spoofing WebGL pour masquer les informations GPU
 */
export function spoofWebGL() {
  try {
    // Spoofing pour WebGL 1.0
    if (window.WebGLRenderingContext) {
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
          return 'Google Inc.';
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
          return 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader)';
        }
        return originalGetParameter.call(this, parameter);
      };

      const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
      WebGLRenderingContext.prototype.getExtension = function (name) {
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 37445,
            UNMASKED_RENDERER_WEBGL: 37446,
          };
        }
        return originalGetExtension.call(this, name);
      };
    }

    // Spoofing pour WebGL 2.0
    if (window.WebGL2RenderingContext) {
      const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) {
          return 'Google Inc.';
        }
        if (parameter === 37446) {
          return 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader)';
        }
        return originalGetParameter2.call(this, parameter);
      };

      const originalGetExtension2 = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        if (name === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_VENDOR_WEBGL: 37445,
            UNMASKED_RENDERER_WEBGL: 37446,
          };
        }
        return originalGetExtension2.call(this, name);
      };
    }

    console.log('✅ WebGL spoofing applied');
  } catch (error) {
    console.error('❌ Error applying WebGL spoofing:', error);
  }
}

/**
 * Applique les propriétés d'écran falsifiées
 * @param {object} fakeScreen - Propriétés d'écran falsifiées
 */
export function applyScreenSpoofing(fakeScreen) {
  try {
    // Spoofing des propriétés de l'objet screen
    const screenProperties = ['width', 'height', 'availWidth', 'availHeight', 'colorDepth', 'pixelDepth'];
    
    screenProperties.forEach(prop => {
      if (fakeScreen[prop] !== undefined) {
        try {
          Object.defineProperty(window.screen, prop, {
            value: fakeScreen[prop],
            configurable: true,
            writable: false,
            enumerable: true
          });
          console.log(`✅ Screen.${prop} spoofed:`, fakeScreen[prop]);
        } catch (error) {
          console.warn(`⚠️ Could not spoof screen.${prop}:`, error.message);
        }
      }
    });
    
    // Spoofing de window.devicePixelRatio
    if (fakeScreen.devicePixelRatio !== undefined) {
      try {
        Object.defineProperty(window, 'devicePixelRatio', {
          value: fakeScreen.devicePixelRatio,
          configurable: true,
          writable: false,
          enumerable: true
        });
        console.log('✅ Window.devicePixelRatio spoofed:', fakeScreen.devicePixelRatio);
      } catch (error) {
        console.warn('⚠️ Could not spoof devicePixelRatio:', error.message);
      }
    }

    // Spoofing des propriétés CSS media queries
    if (window.matchMedia) {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = function(query) {
        const result = originalMatchMedia.call(window, query);
        
        // Intercepter les requêtes de résolution
        if (query.includes('device-pixel-ratio') && fakeScreen.devicePixelRatio) {
          const ratio = fakeScreen.devicePixelRatio;
          const match = query.match(/device-pixel-ratio:\s*(\d+(?:\.\d+)?)/);
          if (match) {
            const queryRatio = parseFloat(match[1]);
            result.matches = Math.abs(ratio - queryRatio) < 0.1;
          }
        }
        
        return result;
      };
      console.log('✅ MatchMedia spoofing applied');
    }

    console.log('✅ Screen spoofing applied successfully:', {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio
    });
  } catch (error) {
    console.error('❌ Error applying screen spoofing:', error);
  }
}

/**
 * Applique le "Ghost Mode" - masque la plupart des propriétés du navigateur
 * @param {number} tabId - ID de l'onglet où appliquer le Ghost Mode
 */
export async function applyGhostMode(tabId) {
  try {
    console.log('👻 Applying ghost mode to tab:', tabId);

    // Injection du script de Ghost Mode
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      injectImmediately: true,
      world: 'MAIN',
      func: () => {
        const makeUndefined = (obj, prop) => {
          try {
            Object.defineProperty(obj, prop, {
              get: () => undefined,
              configurable: false,
              enumerable: true
            });
            console.log(`🔒 Property ${prop} set to undefined`);
          } catch (e) {
            console.debug(`Cannot modify ${prop}:`, e.message);
          }
        };

        // Propriétés à masquer
        const propsToHide = [
          'userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency',
          'deviceMemory', 'vendor', 'appVersion', 'userAgentData', 'oscpu',
          'connection', 'getBattery', 'getGamepads', 'permissions', 'mediaDevices',
          'serviceWorker', 'geolocation', 'clipboard', 'credentials', 'keyboard',
          'locks', 'mediaCapabilities', 'mediaSession', 'plugins', 'presentation',
          'scheduling', 'usb', 'xr', 'mimeTypes', 'cookieEnabled', 'onLine',
          'maxTouchPoints', 'doNotTrack'
        ];

        // Appliquer le masquage
        propsToHide.forEach(prop => {
          if (navigator.hasOwnProperty(prop) || prop in navigator) {
            makeUndefined(navigator, prop);
          }
        });

        // Bloquer Canvas
        try {
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function () {
            console.log('🚫 Canvas getContext() blocked by Ghost Mode');
            return null;
          };

          // Bloquer toBlob
          const originalToBlob = HTMLCanvasElement.prototype.toBlob;
          HTMLCanvasElement.prototype.toBlob = function () {
            console.log('🚫 Canvas toBlob() blocked by Ghost Mode');
            return null;
          };

          // Bloquer toDataURL
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function () {
            console.log('🚫 Canvas toDataURL() blocked by Ghost Mode');
            return 'data:,';
          };
        } catch (e) {
          console.debug('Cannot block Canvas methods:', e.message);
        }

        // Bloquer WebRTC
        try {
          if (window.RTCPeerConnection) {
            window.RTCPeerConnection = undefined;
          }
          if (window.webkitRTCPeerConnection) {
            window.webkitRTCPeerConnection = undefined;
          }
          if (window.mozRTCPeerConnection) {
            window.mozRTCPeerConnection = undefined;
          }
          console.log('🚫 WebRTC blocked by Ghost Mode');
        } catch (e) {
          console.debug('Cannot block WebRTC:', e.message);
        }

        // Bloquer l'accès aux informations d'écran
        const screenProps = ['width', 'height', 'availWidth', 'availHeight', 'colorDepth', 'pixelDepth'];
        screenProps.forEach(prop => {
          makeUndefined(window.screen, prop);
        });
        makeUndefined(window, 'devicePixelRatio');

        console.log('👻 Ghost Mode injection completed');
      }
    });

    // Appliquer les règles de modification des en-têtes HTTP
    const ghostModeRule = {
      id: 999,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "User-Agent", operation: "remove" },
          { header: "Accept-Language", operation: "remove" },
          { header: "DNT", operation: "remove" },
          { header: "Sec-CH-UA", operation: "remove" },
          { header: "Sec-CH-UA-Mobile", operation: "remove" },
          { header: "Sec-CH-UA-Platform", operation: "remove" },
          { header: "Sec-CH-UA-Platform-Version", operation: "remove" },
          { header: "sec-ch-ua-full-version-list", operation: "remove" },
          { header: "Device-Memory", operation: "remove" },
          { header: "Referer", operation: "remove" },
          { header: "Sec-Fetch-Site", operation: "remove" },
          { header: "Sec-Ch-Device-Memory", operation: "remove" },
          { header: "Sec-ch-drp", operation: "remove" },
          { header: "viewport-width", operation: "remove" },
          { header: "viewport-height", operation: "remove" },
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
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [999, 1],
      addRules: [ghostModeRule]
    });
    
    console.log('✅ Ghost Mode applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Error applying Ghost Mode:', error);
    return false;
  }
}
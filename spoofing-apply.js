/**
 * Applique les propriétés de navigateur falsifiées à l'objet `navigator` global.
 * Cette fonction est destinée à être injectée dans le contexte de la page.
 * @param {object} fakeNavigator - Un objet contenant les propriétés de navigateur à usurper.
 */
export function applySpoofingNavigator(fakeNavigator) {
  // Obtenir les clés de l'objet fakeNavigator
  const propertiesToSpoof = Object.keys(fakeNavigator);

  // Appliquer le spoofing pour chaque propriété
  propertiesToSpoof.forEach((prop) => {
    Object.defineProperty(navigator, prop, {
      get: () => fakeNavigator[prop],
      configurable: true,
      enumerable: true,
    });
    console.log(`spoof de la propriété ${prop} avec la valeur ${fakeNavigator[prop]}`);
  });

  // --- Spoofing navigator.plugins and navigator.mimeTypes ---

  // Fake PluginArray
  const fakePlugins = []; // Start with an empty list, can be populated with generic plugins later
  Object.defineProperty(fakePlugins, 'length', { get: () => fakePlugins.length });
  fakePlugins.item = (index) => fakePlugins[index];
  fakePlugins.namedItem = (name) => fakePlugins.find(p => p.name === name);
  fakePlugins.refresh = () => {}; // No-op

  // Fake MimeTypeArray
  const fakeMimeTypes = []; // Start with an empty list
  Object.defineProperty(fakeMimeTypes, 'length', { get: () => fakeMimeTypes.length });
  fakeMimeTypes.item = (index) => fakeMimeTypes[index];
  fakeMimeTypes.namedItem = (name) => fakeMimeTypes.find(m => m.type === name);

  // Example of adding a generic plugin and its MIME types (optional, can be expanded)
  /*
  const genericPlugin = {
    name: 'Generic Browser Plugin',
    description: 'A non-identifiable browser plugin',
    filename: 'genericplugin.dll',
    length: 1, // Number of MIME types it handles
    item: (index) => genericPlugin.mimeTypes[index],
    namedItem: (name) => genericPlugin.mimeTypes.find(m => m.type === name),
    mimeTypes: [
      {
        type: 'application/x-generic-plugin',
        suffixes: 'gen',
        description: 'Generic Plugin Data',
        enabledPlugin: genericPlugin // Circular reference
      }
    ]
  };
  genericPlugin.mimeTypes[0].enabledPlugin = genericPlugin; // Ensure circular ref is set
  fakePlugins.push(genericPlugin);
  fakeMimeTypes.push(genericPlugin.mimeTypes[0]);
  */

  Object.defineProperty(navigator, 'plugins', {
    get: () => fakePlugins,
    configurable: true,
    enumerable: true
  });
  console.log('navigator.plugins spoofed.');

  Object.defineProperty(navigator, 'mimeTypes', {
    get: () => fakeMimeTypes,
    configurable: true,
    enumerable: true
  });
  console.log('navigator.mimeTypes spoofed.');
}

/**
 * Applique les données User-Agent falsifiées à `navigator.userAgentData`.
 * Cette fonction est destinée à être injectée dans le contexte de la page.
 * @param {object} fakeUserAgentData - L'objet User-Agent Data falsifié.
 */
export function applyUserAgentData(fakeUserAgentData) {
  Object.defineProperty(navigator, 'userAgentData', {
    get: () => fakeUserAgentData,
    configurable: true,
    enumerable: true
  });

  console.log('userAgentData modifié:', navigator.userAgentData);
}

/**
 * Applique une chaîne User-Agent, une plateforme et une version d'application falsifiées à l'objet `navigator`.
 * Cette fonction est destinée à être injectée dans le contexte de la page.
 * @param {object} userAgentObj - Un objet contenant les nouvelles valeurs.
 * @param {string} userAgentObj.userAgent - La nouvelle chaîne User-Agent.
 * @param {string} userAgentObj.platform - La nouvelle plateforme.
 * @param {string} userAgentObj.appVersion - La nouvelle version de l'application.
 */
export function applyUserAgent(userAgentObj) {
  // Appliquer le User-Agent
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgentObj.userAgent,
    configurable: true,
    enumerable: true
  });

  // Appliquer la plateforme
  Object.defineProperty(navigator, 'platform', {
    value: userAgentObj.platform,
    configurable: true,
    enumerable: true
  });

  // Appliquer la version de l'application
  Object.defineProperty(navigator, 'appVersion', {
    value: userAgentObj.appVersion,
    configurable: true,
    enumerable: true
  });
}

/**
 * Modifie les méthodes `getParameter` et `getExtension` de `WebGLRenderingContext`
 * pour retourner des informations de vendeur et de moteur de rendu falsifiées.
 * Cette fonction est destinée à être injectée dans le contexte de la page.
 */
export function spoofWebGL() {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function (parameter) {
    // UNMASKED_VENDOR_WEBGL
    if (parameter === 37445) {
      return 'Google Inc.';
    }
    // UNMASKED_RENDERER_WEBGL
    if (parameter === 37446) {
      return 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Google)), SwiftShader)';
    }
    return getParameter.call(this, parameter);
  };

  const getExtension = WebGLRenderingContext.prototype.getExtension;
  WebGLRenderingContext.prototype.getExtension = function (name) {
    if (name === 'WEBGL_debug_renderer_info') {
      return {
        UNMASKED_VENDOR_WEBGL: 37445,
        UNMASKED_RENDERER_WEBGL: 37446,
      };
    }
    return getExtension.call(this, name);
  };
}

/**
 * Applique le "Ghost Mode" :
 * - Masque de nombreuses propriétés de l'objet `navigator` en les rendant `undefined`.
 * - Empêche l'utilisation de l'API Canvas en faisant retourner `null` à `getContext`.
 * - Supprime de nombreux en-têtes HTTP via `declarativeNetRequest`.
 * @param {number} tabId - L'ID de l'onglet où appliquer le Ghost Mode.
 */
export function applyGhostMode(tabId) {
  chrome.scripting.executeScript({
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
          console.log(`Modifié ${prop} en undefined`);
        } catch (e) {
          console.debug(`Impossible de modifier ${prop}:`, e);
        }
      };

      // Liste des propriétés à rendre undefined
      const propsToHide = [
        'userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency',
        'deviceMemory', 'vendor', 'appVersion', 'userAgentData', 'oscpu',
        'connection', 'getBattery', 'getGamepads', 'permissions', 'mediaDevices',
        'serviceWorker', 'geolocation', 'clipboard', 'credentials', 'keyboard',
        'locks', 'mediaCapabilities', 'mediaSession', 'plugins', 'presentation',
        'scheduling', 'usb', 'xr', 'mimeTypes',
        //web audio


      ];

      // Appliquer undefined à toutes les propriétés
      propsToHide.forEach(prop => makeUndefined(navigator, prop));

      // Rendre Canvas inutilisable
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      };
    }
  });

  // Modifier les en-têtes HTTP
  const rule = {
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
        { header: "sec-ch-ua-mobile", operation: "remove" },
        { header: "sec-ch-ua-platform", operation: "remove" },
        { header: "sec-ch-ua-platform-version", operation: "remove" },
        { header: "Device-Memory", operation: "remove" },
        { header: "Referer", operation: "remove" },
        { header: "Sec-Fetch-Site", operation: "remove" },
        // { header: "Accept-Encoding", operation: "remove" },
        { header: "Sec-Ch-Device-Memory", operation: "remove" },
        { header: "Sec-ch-drp", operation: "remove" },
        { header: "viewport-width", operation: "remove" },
        { header: "viewport-height", operation: "remove" },
      ]
    },
    condition: {
      urlFilter: "*",
      resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"]
    }
  };

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [999, 1],
    addRules: [rule]
  });
}
/**
 * Applique les propriétés d'écran falsifiées.
 * Cette fonction est destinée à être injectée dans le contexte de la page.
 * @param {object} fakeScreen - Un objet contenant les fausses propriétés d'écran.
 * @param {number} fakeScreen.width - Largeur de l'écran.
 * @param {number} fakeScreen.height - Hauteur de l'écran.
 * @param {number} fakeScreen.availWidth - Largeur disponible de l'écran.
 * @param {number} fakeScreen.availHeight - Hauteur disponible de l'écran.
 * @param {number} fakeScreen.colorDepth - Profondeur de couleur.
 * @param {number} fakeScreen.pixelDepth - Profondeur de pixel.
 * @param {number} fakeScreen.devicePixelRatio - Ratio de pixels de l'appareil.
 */
export function applyScreenSpoofing(fakeScreen) {
  try {
    Object.defineProperty(window.screen, 'width', { value: fakeScreen.width, configurable: true, writable: false, enumerable: true });
    Object.defineProperty(window.screen, 'height', { value: fakeScreen.height, configurable: true, writable: false, enumerable: true });
    Object.defineProperty(window.screen, 'availWidth', { value: fakeScreen.availWidth, configurable: true, writable: false, enumerable: true });
    Object.defineProperty(window.screen, 'availHeight', { value: fakeScreen.availHeight, configurable: true, writable: false, enumerable: true });
    Object.defineProperty(window.screen, 'colorDepth', { value: fakeScreen.colorDepth, configurable: true, writable: false, enumerable: true });
    Object.defineProperty(window.screen, 'pixelDepth', { value: fakeScreen.pixelDepth, configurable: true, writable: false, enumerable: true });
    
    // Spoof window.devicePixelRatio
    // Note: Directement modifier window.devicePixelRatio peut être difficile ou impossible dans certains navigateurs
    // ou peut ne pas affecter le rendu réel. Cependant, le rendre disponible via l'API JS est l'objectif ici.
    Object.defineProperty(window, 'devicePixelRatio', { value: fakeScreen.devicePixelRatio, configurable: true, writable: false, enumerable: true });

    console.log('Screen properties spoofed:', {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio
    });
  } catch (e) {
    console.error('Error applying screen spoofing:', e);
  }
}
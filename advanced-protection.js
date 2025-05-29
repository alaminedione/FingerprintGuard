/**
 * Advanced Protection Module for FingerprintGuard
 * Protections contre les techniques avancées de fingerprinting
 * Version: 2.1.0
 */

/**
 * Protection WebRTC pour éviter les fuites d'IP
 */
export function protectWebRTC() {
  // Désactiver les fuites WebRTC
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
  const originalRTCPeerConnection = window.RTCPeerConnection;
  const originalRTCDataChannel = window.RTCDataChannel;

  // Bloquer getUserMedia
  if (navigator.mediaDevices) {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: function() {
        return Promise.reject(new DOMException('NotAllowedError', 'Permission denied'));
      },
      configurable: true
    });
  }

  // Intercepter RTCPeerConnection
  window.RTCPeerConnection = function(...args) {
    const pc = new originalRTCPeerConnection(...args);
    
    // Intercepter createOffer pour modifier les SDP
    const originalCreateOffer = pc.createOffer;
    pc.createOffer = function(options) {
      return originalCreateOffer.call(this, options).then(offer => {
        // Supprimer les candidats ICE qui révèlent l'IP locale
        offer.sdp = offer.sdp.replace(/c=IN IP4 (\d+\.){3}\d+/g, 'c=IN IP4 0.0.0.0');
        offer.sdp = offer.sdp.replace(/a=candidate:\d+ \d+ UDP \d+ (\d+\.){3}\d+/g, 'a=candidate:0 1 UDP 0 0.0.0.0');
        return offer;
      });
    };

    return pc;
  };

  // Copier les propriétés statiques
  Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
  Object.defineProperty(window.RTCPeerConnection, 'prototype', {
    value: originalRTCPeerConnection.prototype
  });

  console.log('🛡️ WebRTC protection activated');
}

/**
 * Protection contre le fingerprinting des fonts
 */
export function protectFonts() {
  // Liste de fonts standards pour éviter la détection
  const commonFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact'
  ];

  // Intercepter les méthodes de détection de fonts
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

  // Ajouter du bruit aux mesures
  function addNoise(value) {
    return value + (Math.random() - 0.5) * 2;
  }

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get: function() {
      const value = originalOffsetWidth.get.call(this);
      if (this.style && this.style.fontFamily) {
        return Math.round(addNoise(value));
      }
      return value;
    }
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    get: function() {
      const value = originalOffsetHeight.get.call(this);
      if (this.style && this.style.fontFamily) {
        return Math.round(addNoise(value));
      }
      return value;
    }
  });

  // Limiter les fonts disponibles
  Object.defineProperty(document, 'fonts', {
    get: function() {
      return {
        check: function(font) {
          const fontFamily = font.split(' ').pop().replace(/['"]/g, '');
          return commonFonts.includes(fontFamily);
        },
        load: function() {
          return Promise.resolve();
        },
        ready: Promise.resolve(),
        status: 'loaded',
        size: commonFonts.length
      };
    }
  });

  console.log('🔤 Font fingerprinting protection activated');
}

/**
 * Protection contre le fingerprinting de timezone
 */
export function protectTimezone(fakeTimezone = 'UTC') {
  const originalDate = Date;
  const originalDateNow = Date.now;
  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

  // Timezone offset pour UTC
  const timezoneOffsets = {
    'UTC': 0,
    'America/New_York': 300, // EST
    'Europe/London': 0, // GMT
    'Europe/Paris': -60, // CET
    'Asia/Tokyo': -540, // JST
    'America/Los_Angeles': 480 // PST
  };

  const targetOffset = timezoneOffsets[fakeTimezone] || 0;

  // Override getTimezoneOffset
  Date.prototype.getTimezoneOffset = function() {
    return targetOffset;
  };

  // Override toTimeString et related methods
  const originalToTimeString = Date.prototype.toTimeString;
  Date.prototype.toTimeString = function() {
    const utcTime = this.getTime() - (targetOffset * 60000);
    const adjustedDate = new originalDate(utcTime);
    return originalToTimeString.call(adjustedDate);
  };

  // Override Intl.DateTimeFormat pour la cohérence
  const originalIntlDateTimeFormat = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function(...args) {
    if (args.length === 0 || !args[0]) {
      args[0] = 'en-US';
    }
    if (typeof args[1] === 'object') {
      args[1].timeZone = fakeTimezone;
    } else {
      args[1] = { timeZone: fakeTimezone };
    }
    return new originalIntlDateTimeFormat(...args);
  };

  console.log(`🕐 Timezone protection activated: ${fakeTimezone}`);
}

/**
 * Protection contre le fingerprinting audio
 */
export function protectAudioContext() {
  const originalAudioContext = window.AudioContext || window.webkitAudioContext;
  
  if (!originalAudioContext) return;

  const audioContextHandler = {
    construct: function(target, args) {
      const context = new target(...args);
      
      // Intercepter createOscillator
      const originalCreateOscillator = context.createOscillator;
      context.createOscillator = function() {
        const oscillator = originalCreateOscillator.call(this);
        
        // Ajouter du bruit à la fréquence
        const originalFrequency = oscillator.frequency;
        Object.defineProperty(oscillator, 'frequency', {
          get: function() {
            return {
              ...originalFrequency,
              value: originalFrequency.value + (Math.random() - 0.5) * 0.01
            };
          }
        });
        
        return oscillator;
      };

      // Intercepter createAnalyser
      const originalCreateAnalyser = context.createAnalyser;
      context.createAnalyser = function() {
        const analyser = originalCreateAnalyser.call(this);
        
        // Modifier getFloatFrequencyData
        const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
        analyser.getFloatFrequencyData = function(array) {
          originalGetFloatFrequencyData.call(this, array);
          // Ajouter du bruit
          for (let i = 0; i < array.length; i++) {
            array[i] += (Math.random() - 0.5) * 0.1;
          }
        };
        
        return analyser;
      };

      return context;
    }
  };

  window.AudioContext = new Proxy(originalAudioContext, audioContextHandler);
  if (window.webkitAudioContext) {
    window.webkitAudioContext = new Proxy(originalAudioContext, audioContextHandler);
  }

  console.log('🔊 Audio context protection activated');
}

/**
 * Protection contre les techniques de timing
 */
export function protectTiming() {
  // Réduire la précision de performance.now()
  const originalPerformanceNow = performance.now;
  performance.now = function() {
    return Math.floor(originalPerformanceNow.call(this) / 100) * 100;
  };

  // Modifier Date.now() pour réduire la précision
  const originalDateNow = Date.now;
  Date.now = function() {
    return Math.floor(originalDateNow() / 1000) * 1000;
  };

  // Intercepter requestAnimationFrame timing
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRequestAnimationFrame.call(this, function(timestamp) {
      // Réduire la précision du timestamp
      const reducedTimestamp = Math.floor(timestamp / 100) * 100;
      callback(reducedTimestamp);
    });
  };

  console.log('⏱️ Timing protection activated');
}

/**
 * Protection contre les API expérimentales et sensibles
 */
export function protectExperimentalAPIs() {
  // Masquer les API expérimentales
  const experimentalAPIs = [
    'navigator.scheduling',
    'navigator.deviceMemory',
    'navigator.connection',
    'navigator.getBattery',
    'navigator.getGamepads',
    'navigator.permissions',
    'navigator.usb',
    'navigator.serial',
    'navigator.hid',
    'navigator.bluetooth',
    'navigator.presentation',
    'navigator.virtualKeyboard',
    'navigator.keyboard',
    'navigator.locks',
    'navigator.mediaSession',
    'navigator.xr',
    'window.speechSynthesis',
    'window.SpeechRecognition',
    'window.webkitSpeechRecognition'
  ];

  experimentalAPIs.forEach(apiPath => {
    const pathParts = apiPath.split('.');
    let obj = window;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      obj = obj[pathParts[i]];
      if (!obj) return;
    }
    
    const prop = pathParts[pathParts.length - 1];
    
    try {
      Object.defineProperty(obj, prop, {
        get: () => undefined,
        configurable: true,
        enumerable: false
      });
    } catch (e) {
      // Ignorer les erreurs pour les propriétés non configurables
    }
  });

  // Masquer les capteurs de mouvement
  if (window.DeviceMotionEvent) {
    window.DeviceMotionEvent = undefined;
  }
  if (window.DeviceOrientationEvent) {
    window.DeviceOrientationEvent = undefined;
  }

  console.log('🧪 Experimental APIs protection activated');
}

/**
 * Protection contre la détection de plugins
 */
export function protectPlugins() {
  // Créer une liste de plugins générique
  const fakePlugins = [];
  
  // Plugin PDF générique
  const pdfPlugin = {
    name: 'Chrome PDF Plugin',
    description: 'Portable Document Format',
    filename: 'internal-pdf-viewer',
    length: 1
  };
  
  fakePlugins.push(pdfPlugin);

  // Override navigator.plugins
  Object.defineProperty(navigator, 'plugins', {
    get: function() {
      const pluginArray = [];
      pluginArray.push(...fakePlugins);
      
      Object.defineProperty(pluginArray, 'length', {
        value: fakePlugins.length
      });
      
      pluginArray.item = function(index) {
        return this[index] || null;
      };
      
      pluginArray.namedItem = function(name) {
        return this.find(plugin => plugin.name === name) || null;
      };
      
      pluginArray.refresh = function() {
        // No-op
      };
      
      return pluginArray;
    },
    configurable: true
  });

  console.log('🔌 Plugin protection activated');
}

/**
 * Protection contre le fingerprinting de la mémoire
 */
export function protectMemory() {
  // Falsifier navigator.deviceMemory
  Object.defineProperty(navigator, 'deviceMemory', {
    get: function() {
      const commonMemorySizes = [2, 4, 8, 16];
      return commonMemorySizes[Math.floor(Math.random() * commonMemorySizes.length)];
    },
    configurable: true
  });

  // Falsifier performance.memory si disponible
  if (performance.memory) {
    const originalMemory = performance.memory;
    
    Object.defineProperty(performance, 'memory', {
      get: function() {
        return {
          get usedJSHeapSize() {
            return Math.floor(Math.random() * 50000000) + 10000000;
          },
          get totalJSHeapSize() {
            return this.usedJSHeapSize + Math.floor(Math.random() * 10000000);
          },
          get jsHeapSizeLimit() {
            return this.totalJSHeapSize + Math.floor(Math.random() * 100000000);
          }
        };
      },
      configurable: true
    });
  }

  console.log('💾 Memory protection activated');
}

/**
 * Protection contre le fingerprinting via CSS
 */
export function protectCSS() {
  // Intercepter getComputedStyle
  const originalGetComputedStyle = window.getComputedStyle;
  
  window.getComputedStyle = function(element, pseudoElement) {
    const styles = originalGetComputedStyle.call(this, element, pseudoElement);
    
    // Créer un proxy pour modifier certaines propriétés
    return new Proxy(styles, {
      get: function(target, property) {
        // Masquer certaines propriétés spécifiques au système
        if (property === 'fontFamily') {
          return 'Arial, sans-serif';
        }
        
        if (property === 'fontSmooth' || property === 'webkitFontSmoothing') {
          return 'auto';
        }
        
        return target[property];
      }
    });
  };

  console.log('🎨 CSS protection activated');
}

/**
 * Active toutes les protections avancées
 */
export function enableAllAdvancedProtections(options = {}) {
  try {
    if (options.webrtc !== false) protectWebRTC();
    if (options.fonts !== false) protectFonts();
    if (options.timezone !== false) protectTimezone(options.timezoneValue || 'UTC');
    if (options.audio !== false) protectAudioContext();
    if (options.timing !== false) protectTiming();
    if (options.experimental !== false) protectExperimentalAPIs();
    if (options.plugins !== false) protectPlugins();
    if (options.memory !== false) protectMemory();
    if (options.css !== false) protectCSS();
    
    console.log('🛡️ All advanced protections activated');
    return true;
  } catch (error) {
    console.error('❌ Error activating advanced protections:', error);
    return false;
  }
}

/**
 * Détecte les tentatives de fingerprinting actives
 */
export function detectFingerprintingAttempts() {
  const detectionLog = [];
  
  // Détecter les accès suspects à canvas
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(...args) {
    if (args[0] === '2d' || args[0] === 'webgl' || args[0] === 'webgl2') {
      detectionLog.push({
        type: 'canvas_access',
        context: args[0],
        timestamp: Date.now(),
        stack: new Error().stack
      });
    }
    return originalGetContext.apply(this, args);
  };

  // Détecter les accès aux propriétés sensibles
  const sensitiveProps = ['plugins', 'mimeTypes', 'languages', 'platform', 'userAgent'];
  
  sensitiveProps.forEach(prop => {
    let accessCount = 0;
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, prop);
    
    if (originalDescriptor && originalDescriptor.get) {
      Object.defineProperty(navigator, prop, {
        get: function() {
          accessCount++;
          if (accessCount > 5) { // Seuil de détection
            detectionLog.push({
              type: 'suspicious_access',
              property: prop,
              count: accessCount,
              timestamp: Date.now()
            });
          }
          return originalDescriptor.get.call(this);
        },
        configurable: true
      });
    }
  });

  // API pour récupérer les détections
  window.getFingerprintingDetections = function() {
    return [...detectionLog];
  };

  console.log('🔍 Fingerprinting detection activated');
}
/**
 * Module utilitaires refactorisé pour FingerprintGuard v2.1.0
 * Fonctions utilitaires réutilisables et validées
 */

/**
 * Sélectionne un élément aléatoire dans un tableau
 * @param {Array} arr - Tableau source
 * @returns {*} Élément aléatoire ou undefined si tableau vide
 */
export function getRandomElement(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    console.warn('⚠️ getRandomElement called with empty or invalid array');
    return undefined;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Génère un nombre entier aléatoire dans une plage (inclusive)
 * @param {number} min - Borne minimale
 * @param {number} max - Borne maximale  
 * @returns {number} Nombre entier aléatoire
 */
export function getRandomInRange(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') {
    console.warn('⚠️ getRandomInRange called with non-number arguments');
    return 0;
  }

  if (min > max) {
    [min, max] = [max, min]; // Swap si nécessaire
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère une chaîne de version de navigateur au format "major.minor.0"
 * @param {number} minVersion - Version majeure minimale
 * @param {number} maxVersion - Version majeure maximale
 * @returns {string} Chaîne de version
 */
export function generateBrowserVersion(minVersion, maxVersion) {
  if (typeof minVersion !== 'number' || typeof maxVersion !== 'number') {
    console.warn('⚠️ generateBrowserVersion called with non-number arguments');
    return '120.0.0';
  }

  const major = getRandomInRange(minVersion, maxVersion);
  const minor = getRandomInRange(0, 99);
  return `${major}.${minor}.0`;
}

/**
 * Valide un objet selon un schéma de propriétés
 * @param {object} obj - Objet à valider
 * @param {object} schema - Schéma de validation
 * @returns {boolean} True si valide
 */
export function validateObject(obj, schema) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const [key, validator] of Object.entries(schema)) {
    if (validator.required && !(key in obj)) {
      console.warn(`⚠️ Required property missing: ${key}`);
      return false;
    }

    if (key in obj && validator.type && typeof obj[key] !== validator.type) {
      console.warn(`⚠️ Invalid type for property ${key}: expected ${validator.type}, got ${typeof obj[key]}`);
      return false;
    }

    if (key in obj && validator.validate && !validator.validate(obj[key])) {
      console.warn(`⚠️ Validation failed for property ${key}`);
      return false;
    }
  }

  return true;
}

/**
 * Formate une date en chaîne lisible
 * @param {Date|string|number} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDate(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Date invalide';
    }
    return d.toLocaleString();
  } catch (error) {
    console.warn('⚠️ Error formatting date:', error);
    return 'Date invalide';
  }
}

/**
 * Génère un ID unique pour les profils
 * @param {string} prefix - Préfixe pour l'ID
 * @returns {string} ID unique
 */
export function generateUniqueId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Debounce une fonction (limite la fréquence d'exécution)
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai d'attente en ms
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle une fonction (limite le taux d'exécution)
 * @param {Function} func - Fonction à throttler
 * @param {number} limit - Limite en ms
 * @returns {Function} Fonction throttlée
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Clone en profondeur un objet
 * @param {*} obj - Objet à cloner
 * @returns {*} Copie de l'objet
 */
export function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn('⚠️ Error deep cloning object:', error);
    return obj;
  }
}

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} Nouveau tableau mélangé
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    console.warn('⚠️ shuffleArray called with non-array argument');
    return [];
  }

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Vérifie si un tableau est vide ou non défini
 * @param {*} arr - Valeur à vérifier
 * @returns {boolean} True si vide
 */
export function isEmpty(arr) {
  return !arr || (Array.isArray(arr) && arr.length === 0) || (typeof arr === 'object' && Object.keys(arr).length === 0);
}

/**
 * Tronque une chaîne à une longueur donnée
 * @param {string} str - Chaîne à tronquer
 * @param {number} maxLength - Longueur maximale
 * @param {string} suffix - Suffixe à ajouter (défaut: '...')
 * @returns {string} Chaîne tronquée
 */
export function truncateString(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') {
    return String(str);
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convertit une taille en octets en format lisible
 * @param {number} bytes - Nombre d'octets
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} Taille formatée
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Génère une couleur hexadécimale aléatoire
 * @returns {string} Couleur au format #RRGGBB
 */
export function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Vérifie si un objet est un objet plain (non null, non array, non function)
 * @param {*} obj - Valeur à vérifier
 * @returns {boolean} True si objet plain
 */
export function isPlainObject(obj) {
  return obj !== null &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    obj.constructor === Object;
}

/**
 * Fusionne récursivement deux objets
 * @param {object} target - Objet cible
 * @param {object} source - Objet source
 * @returns {object} Objet fusionné
 */
export function deepMerge(target, source) {
  if (!isPlainObject(target)) target = {};
  if (!isPlainObject(source)) return target;

  Object.keys(source).forEach(key => {
    if (isPlainObject(source[key]) && isPlainObject(target[key])) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });

  return target;
}

/**
 * Retourne une promesse qui se résout après un délai
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise} Promesse qui se résout après le délai
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exécute une fonction avec un retry automatique en cas d'échec
 * @param {Function} fn - Fonction à exécuter
 * @param {number} maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @param {number} delay - Délai entre les tentatives en ms (défaut: 1000)
 * @returns {Promise} Résultat de la fonction
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${i + 1}/${maxRetries + 1} failed:`, error.message);

      if (i < maxRetries) {
        await sleep(delay * Math.pow(2, i)); // Backoff exponentiel
      }
    }
  }

  throw lastError;
}

/**
 * Schémas de validation courants
 */
export const VALIDATION_SCHEMAS = {
  profile: {
    id: { required: true, type: 'string' },
    createdAt: { required: true, type: 'string' },
    version: { required: true, type: 'string' },
    fakeNavigator: { required: true, type: 'object' },
    fakeUserAgent: { required: true, type: 'string' },
    fakeScreen: { required: true, type: 'object' }
  },

  settings: {
    ghostMode: { type: 'boolean' },
    spoofBrowser: { type: 'boolean' },
    spoofCanvas: { type: 'boolean' },
    spoofScreen: { type: 'boolean' },
    platform: { type: 'string' },
    language: { type: 'string' }
  }
};

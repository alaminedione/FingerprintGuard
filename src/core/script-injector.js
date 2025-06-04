/**
 * Gestionnaire d'injection de scripts pour FingerprintGuard v2.1.0
 * Centralise toutes les opérations d'injection de scripts
 */

export class ScriptInjector {
  constructor() {
    this.injectionQueue = [];
    this.isProcessing = false;
  }

  /**
   * Injecte un script dans un onglet avec gestion d'erreur robuste
   * @param {number} tabId - ID de l'onglet
   * @param {string|Function} scriptOrFile - Script ou fichier à injecter  
   * @param {*} [args] - Arguments pour les fonctions
   * @returns {Promise<boolean>} Succès de l'injection
   */
  async inject(tabId, scriptOrFile, args) {
    try {
      // Validation des paramètres
      if (!this.validateTabId(tabId)) {
        throw new Error('Invalid tab ID');
      }

      if (!scriptOrFile) {
        throw new Error('No script or file provided');
      }

      // Vérifier l'accessibilité de l'onglet
      const tab = await this.getTab(tabId);
      if (!tab || !this.isInjectableUrl(tab.url)) {
        console.warn(`⚠️ Cannot inject into tab ${tabId}: ${tab?.url || 'unknown URL'}`);
        return false;
      }

      const scriptType = typeof scriptOrFile === 'string' ? `file: ${scriptOrFile}` : 'function';
      console.log(`💉 Injecting script (${scriptType}) into tab ${tabId}`);

      const injectionOptions = this.buildInjectionOptions(tabId, scriptOrFile, args);
      await chrome.scripting.executeScript(injectionOptions);
      
      console.log(`✅ Script injected successfully into tab ${tabId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to inject script into tab ${tabId}:`, error);
      this.logInjectionError(error);
      return false;
    }
  }

  /**
   * Injecte plusieurs scripts de manière séquentielle
   * @param {number} tabId - ID de l'onglet
   * @param {Array} scripts - Tableau d'objets {script, args}
   * @returns {Promise<boolean>} True si tous les scripts ont été injectés
   */
  async injectMultiple(tabId, scripts) {
    try {
      if (!Array.isArray(scripts) || scripts.length === 0) {
        console.warn('⚠️ No scripts provided for injection');
        return true;
      }

      let successCount = 0;
      
      for (const { script, args } of scripts) {
        const success = await this.inject(tabId, script, args);
        if (success) successCount++;
      }

      console.log(`✅ Injected ${successCount}/${scripts.length} scripts into tab ${tabId}`);
      return successCount === scripts.length;

    } catch (error) {
      console.error('❌ Error injecting multiple scripts:', error);
      return false;
    }
  }

  /**
   * Ajoute une injection à la queue pour traitement différé
   * @param {number} tabId - ID de l'onglet
   * @param {string|Function} scriptOrFile - Script à injecter
   * @param {*} [args] - Arguments
   */
  queueInjection(tabId, scriptOrFile, args) {
    this.injectionQueue.push({ tabId, scriptOrFile, args, timestamp: Date.now() });
    this.processQueue();
  }

  /**
   * Traite la queue d'injection
   */
  async processQueue() {
    if (this.isProcessing || this.injectionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.injectionQueue.length > 0) {
        const injection = this.injectionQueue.shift();
        
        // Ignorer les injections trop anciennes (> 30 secondes)
        if (Date.now() - injection.timestamp > 30000) {
          console.warn('⚠️ Skipping old injection request');
          continue;
        }

        await this.inject(injection.tabId, injection.scriptOrFile, injection.args);
        // Petit délai entre les injections
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ Error processing injection queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Valide un ID d'onglet
   * @param {*} tabId - ID à valider
   * @returns {boolean}
   */
  validateTabId(tabId) {
    return tabId && typeof tabId === 'number' && tabId > 0;
  }

  /**
   * Récupère un onglet de manière sécurisée
   * @param {number} tabId - ID de l'onglet
   * @returns {Promise<object|null>}
   */
  async getTab(tabId) {
    try {
      return await chrome.tabs.get(tabId);
    } catch (error) {
      console.debug(`Tab ${tabId} not found or inaccessible:`, error.message);
      return null;
    }
  }

  /**
   * Vérifie si une URL est injectable
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  isInjectableUrl(url) {
    if (!url) return false;
    
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'about:',
      'edge://',
      'opera://',
      'vivaldi://',
      'brave://'
    ];

    return !restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * Construit les options d'injection
   * @param {number} tabId - ID de l'onglet
   * @param {string|Function} scriptOrFile - Script ou fichier
   * @param {*} [args] - Arguments
   * @returns {object}
   */
  buildInjectionOptions(tabId, scriptOrFile, args) {
    const options = {
      world: 'MAIN',
      injectImmediately: true,
      target: { tabId }
    };

    if (typeof scriptOrFile === 'string') {
      options.files = [scriptOrFile];
    } else if (typeof scriptOrFile === 'function') {
      options.func = scriptOrFile;
      if (args !== undefined) {
        options.args = Array.isArray(args) ? args : [args];
      }
    } else {
      throw new Error('Script must be a file path string or function');
    }

    return options;
  }

  /**
   * Log les erreurs d'injection avec des détails utiles
   * @param {Error} error - Erreur à analyser
   */
  logInjectionError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('cannot access')) {
      console.warn('📄 Tab may be on a restricted page or extension page');
    } else if (message.includes('no tab with id')) {
      console.warn('🔍 Tab may have been closed');
    } else if (message.includes('extensions gallery')) {
      console.warn('🏪 Cannot inject into Chrome Web Store');
    } else if (message.includes('invalid tab id')) {
      console.warn('🆔 Invalid or expired tab ID');
    }
  }

  /**
   * Nettoie la queue d'injection
   */
  clearQueue() {
    this.injectionQueue = [];
    console.log('🧹 Injection queue cleared');
  }

  /**
   * Injecte tous les scripts nécessaires dans un onglet
   * @param {number} tabId - ID de l'onglet
   * @param {string} url - URL de l'onglet
   * @returns {Promise<boolean>} Succès de l'injection
   */
  async injectScripts(tabId, url) {
    try {
      if (!this.validateTabId(tabId) || !this.isInjectableUrl(url)) {
        console.warn(`⚠️ Cannot inject scripts into tab ${tabId}: ${url}`);
        return false;
      }

      console.log(`💉 Injecting protection scripts into tab ${tabId}`);

      // Injecter le script de protection avancée
      const advancedProtectionSuccess = await this.inject(tabId, 'advanced-protection.js');
      
      // Injecter le script de protection WebRTC
      const webrtcSuccess = await this.inject(tabId, 'spoofer/webrtc-protection.js');
      
      // Injecter le script de spoofing Canvas
      const canvasSuccess = await this.inject(tabId, 'spoofer/spoof-canvas.js');

      const successCount = [advancedProtectionSuccess, webrtcSuccess, canvasSuccess].filter(Boolean).length;
      console.log(`✅ Injected ${successCount}/3 protection scripts into tab ${tabId}`);
      
      return successCount > 0;
    } catch (error) {
      console.error(`❌ Error injecting scripts into tab ${tabId}:`, error);
      return false;
    }
  }

  /**
   * Retourne des statistiques sur l'injecteur
   * @returns {object}
   */
  getStats() {
    return {
      queueLength: this.injectionQueue.length,
      isProcessing: this.isProcessing,
      oldestInQueueAge: this.injectionQueue.length > 0 
        ? Date.now() - this.injectionQueue[0].timestamp 
        : 0
    };
  }
}
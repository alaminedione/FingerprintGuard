/**
 * Injecteur de script polyvalent pour FingerprintGuard v3.0.0
 * Supporte deux modes d'injection : direct (fiable) et furtif (expérimental).
 */
export class ScriptInjector {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
  }

  /**
   * Injecte et exécute une fonction dans l'onglet spécifié.
   * Le mode d'injection est choisi en fonction des paramètres de l'utilisateur.
   * @param {number} tabId - L'ID de l'onglet cible.
   * @param {Function} func - La fonction à injecter.
   * @param {Array} args - Les arguments pour la fonction.
   */
  async inject(tabId, func, args = []) {
    const { useStealthInjection } = this.settingsManager.get('advancedSettings');

    if (useStealthInjection) {
      await this.stealthInject(tabId, func, args);
    } else {
      await this.directInject(tabId, func, args);
    }
  }

  /**
   * Injection directe : fiable et robuste, fonctionne sur tous les sites.
   */
  async directInject(tabId, func, args) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: func,
        args: args,
        world: 'MAIN'
      });
    } catch (error) {
      this.handleInjectionError(error, tabId);
    }
  }

  /**
   * Injection furtive : peut être bloquée par la CSP de certains sites.
   */
  async stealthInject(tabId, func, args) {
    const functionString = func.toString();
    const argsString = JSON.stringify(args[0] || {});
    const payload = `(${functionString})(${argsString});`;

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (injectedPayload) => {
          const script = document.createElement('script');
          script.textContent = injectedPayload;
          (document.head || document.documentElement).appendChild(script);
          script.remove();
        },
        args: [payload],
        world: 'MAIN'
      });
    } catch (error) {
      this.handleInjectionError(error, tabId);
    }
  }

  /**
   * Gère les erreurs d'injection de manière centralisée.
   */
  handleInjectionError(error, tabId) {
    if (error.message.includes('Cannot access a chrome://') || 
        error.message.includes('Cannot access contents of the page') ||
        error.message.includes('The tab was closed.')) {
      // Erreurs attendues, pas de log nécessaire.
    } else {
      console.error(`❌ Script injection failed for tab ${tabId}:`, error);
    }
  }
}

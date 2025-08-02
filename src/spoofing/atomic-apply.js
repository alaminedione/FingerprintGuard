/**
 * Module d'application de spoofing atomique pour FingerprintGuard v3.0.0
 * Contient la logique pour appliquer un profil de spoofing complet en une seule fois.
 */

/**
 * Applique de manière atomique toutes les modifications de l'empreinte digitale.
 * Cette fonction est destinée à être injectée en tant que script de contenu.
 * @param {object} profile - L'objet de profil cohérent généré par generateCoherentProfile.
 */
export function applyAtomicSpoofing(profile) {
  console.log('⚛️ Applying atomic spoofing with profile:', profile);

  const { fakeNavigator, fakeUserAgentData, fakeScreenProperties } = profile;

  // 1. Spoofing de l'objet Navigator
  try {
    for (const key in fakeNavigator) {
      Object.defineProperty(navigator, key, {
        value: fakeNavigator[key],
        writable: false,
        configurable: true
      });
    }
  } catch (e) {
    console.error('❌ Error applying navigator spoofing:', e);
  }

  // 2. Spoofing de l'API User Agent Client Hints (si applicable)
  try {
    if (navigator.userAgentData) {
      Object.defineProperty(navigator, 'userAgentData', {
        value: fakeUserAgentData,
        writable: false,
        configurable: true
      });
    }
  } catch (e) {
    console.error('❌ Error applying User-Agent Client Hints spoofing:', e);
  }

  // 3. Spoofing des propriétés de l'écran
  try {
    for (const key in fakeScreenProperties) {
      Object.defineProperty(screen, key, {
        value: fakeScreenProperties[key],
        writable: false,
        configurable: true
      });
    }
  } catch (e) {
    console.error('❌ Error applying screen spoofing:', e);
  }

  // 4. Spoofing de WebGL
  try {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      // Usurper le vendeur et le moteur de rendu
      if (parameter === 37445) { // VENDOR
        return 'Google Inc. (Intel)';
      }
      if (parameter === 37446) { // RENDERER
        return 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)';
      }
      // Pour tout autre paramètre, utiliser la fonction originale
      return originalGetParameter.apply(this, arguments);
    };
  } catch (e) {
    console.error('❌ Error applying WebGL spoofing:', e);
  }
}

/**
 * Applique le "Ghost Mode" en désactivant ou en neutralisant les API sensibles.
 */
export function applyGhostMode() {
  console.log('👻 Applying Ghost Mode...');

  // Désactiver WebGL
  try {
    Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined, writable: false, configurable: false });
    Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined, writable: false, configurable: false });
  } catch (e) {
    console.error('❌ Error disabling WebGL:', e);
  }

  // Neutraliser le Canvas
  try {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, args) {
      if (type === '2d' || type.includes('webgl')) {
        return null; // Empêche l'obtention du contexte
      }
      return originalGetContext.apply(this, arguments);
    };
  } catch (e) {
    console.error('❌ Error neutralizing Canvas:', e);
  }
}

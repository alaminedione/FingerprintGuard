/**
 * Service Worker de Test - FingerprintGuard v2.1.0
 * Version simplifiée pour diagnostiquer les erreurs de registration
 */

// Static imports at the top
import { SettingsManager } from './core/settings-manager.js';
import { ProfileManager } from './core/profile-manager.js';
import { ScriptInjector } from './core/script-injector.js';
import { SpoofingService } from './core/spoofing-service.js';

console.log('🚀 FingerprintGuard Service Worker loading...');

// Test basique de fonctionnement
self.addEventListener('install', (event) => {
  console.log('✅ FingerprintGuard Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ FingerprintGuard Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Test de message simple
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data?.type === 'ping') {
    event.source.postMessage({
      type: 'pong',
      timestamp: Date.now()
    });
  }
});

// Import et initialisation conditionnelle
let fingerprintGuard = null;

async function initializeFull() {
  try {
    console.log('📦 Loading full FingerprintGuard modules...');
    
    // Classe principale simplifiée
    class FingerprintGuardLite {
      constructor() {
        this.settingsManager = new SettingsManager();
        this.profileManager = new ProfileManager(this.settingsManager);
        this.scriptInjector = new ScriptInjector();
        this.spoofingService = new SpoofingService(this.settingsManager, this.profileManager);
        this.initialized = false;
      }

      async initialize() {
        try {
          console.log('⚙️ Initializing FingerprintGuard...');
          
          await this.settingsManager.initialize();
          await this.profileManager.initialize();
          
          this.setupEventListeners();
          
          this.initialized = true;
          console.log('✅ FingerprintGuard initialized successfully');
          
        } catch (error) {
          console.error('❌ FingerprintGuard initialization failed:', error);
          throw error;
        }
      }

      setupEventListeners() {
        // Message listener
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          this.handleMessage(message, sender, sendResponse);
          return true; // Keep channel open for async response
        });

        // Navigation listeners (simplified)
        if (chrome.webNavigation) {
          chrome.webNavigation.onCommitted.addListener((details) => {
            if (details.frameId === 0) { // Main frame only
              this.spoofingService.handleNavigation(details);
            }
          });
        }
      }

      async handleMessage(message, sender, sendResponse) {
        try {
          if (!message?.type) {
            return sendResponse({ success: false, error: 'Invalid message format' });
          }

          switch (message.type) {
            case 'getStatus':
              return sendResponse({
                success: true,
                data: await this.settingsManager.getAll()
              });

            case 'updateSetting':
              const result = await this.settingsManager.set(message.key, message.value);
              return sendResponse({ success: result });

            default:
              return sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
          }
        } catch (error) {
          console.error('❌ Error handling message:', error);
          return sendResponse({ success: false, error: error.message });
        }
      }
    }
    
    fingerprintGuard = new FingerprintGuardLite();
    await fingerprintGuard.initialize();
    
    console.log('🎉 FingerprintGuard fully loaded and ready!');
    
  } catch (error) {
    console.error('💥 Failed to initialize full FingerprintGuard:', error);
    
    // Fallback: mode minimal
    console.log('🔄 Falling back to minimal mode...');
    fingerprintGuard = { initialized: false, error: error.message };
  }
}

// Initialisation différée pour éviter les erreurs de registration
setTimeout(() => {
  initializeFull().catch(error => {
    console.error('💀 Critical error during delayed initialization:', error);
  });
}, 100);

// Export pour debugging
self.fingerprintGuard = fingerprintGuard;

console.log('🔄 FingerprintGuard Service Worker setup complete');
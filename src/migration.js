/**
 * Script de migration pour FingerprintGuard v2.1.0
 * Aide à la transition entre l'ancien et le nouveau code
 */

/**
 * Classe pour gérer la migration des données et de la configuration
 */
export class MigrationHelper {
  constructor() {
    this.migrations = [
      { version: '2.1.0', handler: this.migrateTo210 }
    ];
  }

  /**
   * Exécute toutes les migrations nécessaires
   * @returns {Promise<object>} Résultats de la migration
   */
  async runMigrations() {
    console.log('🔄 Starting migration process...');
    
    const results = {
      success: true,
      migrationsRun: 0,
      errors: []
    };

    try {
      // Vérifier la version actuelle
      const currentVersion = await this.getCurrentVersion();
      console.log('📌 Current version:', currentVersion);

      // Exécuter les migrations nécessaires
      for (const migration of this.migrations) {
        if (this.needsMigration(currentVersion, migration.version)) {
          try {
            console.log(`⬆️ Running migration to ${migration.version}...`);
            await migration.handler.call(this);
            results.migrationsRun++;
            console.log(`✅ Migration to ${migration.version} completed`);
          } catch (error) {
            console.error(`❌ Migration to ${migration.version} failed:`, error);
            results.errors.push({
              version: migration.version,
              error: error.message
            });
          }
        }
      }

      // Mettre à jour la version
      await this.setVersion('2.1.0');
      
      console.log('✅ Migration process completed');
      return results;

    } catch (error) {
      console.error('❌ Migration process failed:', error);
      results.success = false;
      results.errors.push({ general: error.message });
      return results;
    }
  }

  /**
   * Migration vers la version 2.1.0
   */
  async migrateTo210() {
    console.log('🔧 Migrating to v2.1.0...');

    // Migrer les paramètres
    await this.migrateSettings();
    
    // Migrer les profils
    await this.migrateProfiles();
    
    // Nettoyer les anciens fichiers si nécessaire
    await this.cleanupOldFiles();
    
    console.log('✅ v2.1.0 migration completed');
  }

  /**
   * Migre les paramètres vers le nouveau format
   */
  async migrateSettings() {
    try {
      const settings = await chrome.storage.sync.get();
      const migratedSettings = {};
      let changesMade = false;

      // Migration des paramètres spécifiques
      const settingsMigrations = {
        // Anciens noms vers nouveaux noms
        'navSpoofBrowser': 'spoofBrowser',
        'canvasSpoofing': 'spoofCanvas',
        'screenSpoofing': 'spoofScreen',
        // Nouveaux paramètres avec valeurs par défaut
        'advancedProtection': {
          webrtc: true,
          audio: true,
          fonts: true,
          timezone: true,
          experimental: true
        }
      };

      // Appliquer les migrations
      for (const [oldKey, newKeyOrValue] of Object.entries(settingsMigrations)) {
        if (oldKey in settings) {
          if (typeof newKeyOrValue === 'string') {
            // Renommage simple
            migratedSettings[newKeyOrValue] = settings[oldKey];
            delete migratedSettings[oldKey];
            changesMade = true;
          }
        } else if (typeof newKeyOrValue === 'object') {
          // Nouveaux paramètres complexes
          migratedSettings[oldKey] = newKeyOrValue;
          changesMade = true;
        }
      }

      // Valider et corriger les types de données
      const validatedSettings = this.validateAndFixSettings({ ...settings, ...migratedSettings });
      
      if (changesMade || JSON.stringify(settings) !== JSON.stringify(validatedSettings)) {
        await chrome.storage.sync.set(validatedSettings);
        console.log('✅ Settings migrated and validated');
      }

    } catch (error) {
      console.error('❌ Error migrating settings:', error);
      throw error;
    }
  }

  /**
   * Migre les profils vers le nouveau format
   */
  async migrateProfiles() {
    try {
      const { profiles = [] } = await chrome.storage.local.get('profiles');
      
      if (!Array.isArray(profiles) || profiles.length === 0) {
        console.log('ℹ️ No profiles to migrate');
        return;
      }

      const migratedProfiles = profiles.map(profile => {
        // Assurer la compatibilité avec le nouveau format
        const migrated = {
          ...profile,
          version: profile.version || '2.1.0',
          metadata: profile.metadata || {
            generatedWith: 'migrated',
            platform: 'unknown',
            language: 'unknown'
          }
        };

        // Valider la structure du profil
        if (!migrated.fakeNavigator) {
          migrated.fakeNavigator = {
            platform: 'Win32',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            language: 'en-US',
            hardwareConcurrency: 4,
            deviceMemory: 8
          };
        }

        if (!migrated.fakeScreen) {
          migrated.fakeScreen = {
            width: 1920,
            height: 1080,
            availWidth: 1920,
            availHeight: 1040,
            colorDepth: 24,
            pixelDepth: 24,
            devicePixelRatio: 1
          };
        }

        return migrated;
      });

      await chrome.storage.local.set({ profiles: migratedProfiles });
      console.log(`✅ Migrated ${migratedProfiles.length} profiles`);

    } catch (error) {
      console.error('❌ Error migrating profiles:', error);
      throw error;
    }
  }

  /**
   * Valide et corrige les paramètres
   */
  validateAndFixSettings(settings) {
    const fixed = { ...settings };

    // Fixes pour les types booléens
    const booleanFields = [
      'ghostMode', 'spoofBrowser', 'spoofCanvas', 'spoofScreen',
      'blockImages', 'blockJS', 'autoReloadAll', 'autoReloadCurrent',
      'useFixedProfile', 'generateNewProfileOnStart'
    ];

    booleanFields.forEach(field => {
      if (field in fixed && typeof fixed[field] !== 'boolean') {
        fixed[field] = Boolean(fixed[field]);
        console.log(`🔧 Fixed boolean field: ${field}`);
      }
    });

    // Fixes pour les nombres
    const numberFields = [
      'hardwareConcurrency', 'deviceMemory', 'minVersion', 'maxVersion', 'hDeviceMemory'
    ];

    numberFields.forEach(field => {
      if (field in fixed) {
        const num = Number(fixed[field]);
        if (isNaN(num) || num < 0) {
          fixed[field] = 0;
          console.log(`🔧 Fixed number field: ${field}`);
        } else {
          fixed[field] = num;
        }
      }
    });

    // Fixes pour les chaînes
    const stringFields = ['platform', 'language', 'browser', 'referer'];
    
    stringFields.forEach(field => {
      if (field in fixed && typeof fixed[field] !== 'string') {
        fixed[field] = String(fixed[field] || '');
        console.log(`🔧 Fixed string field: ${field}`);
      }
    });

    return fixed;
  }

  /**
   * Nettoie les anciens fichiers ou données
   */
  async cleanupOldFiles() {
    try {
      // Ici nous pourrions nettoyer d'anciennes données obsolètes
      // Pour l'instant, on se contente de nettoyer les storage obsolètes
      
      const obsoleteKeys = [
        'oldSetting1',
        'deprecatedConfig',
        'tempData'
      ];

      // Nettoyer du sync storage
      const syncData = await chrome.storage.sync.get();
      const syncKeysToRemove = Object.keys(syncData).filter(key => 
        obsoleteKeys.includes(key) || key.startsWith('temp_')
      );

      if (syncKeysToRemove.length > 0) {
        await chrome.storage.sync.remove(syncKeysToRemove);
        console.log(`🧹 Cleaned up ${syncKeysToRemove.length} obsolete sync keys`);
      }

      // Nettoyer du local storage
      const localData = await chrome.storage.local.get();
      const localKeysToRemove = Object.keys(localData).filter(key => 
        obsoleteKeys.includes(key) || key.startsWith('cache_')
      );

      if (localKeysToRemove.length > 0) {
        await chrome.storage.local.remove(localKeysToRemove);
        console.log(`🧹 Cleaned up ${localKeysToRemove.length} obsolete local keys`);
      }

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      // Ne pas faire échouer la migration pour des erreurs de nettoyage
    }
  }

  /**
   * Récupère la version actuelle
   */
  async getCurrentVersion() {
    try {
      const { extensionVersion } = await chrome.storage.local.get('extensionVersion');
      return extensionVersion || '2.0.0'; // Version par défaut
    } catch (error) {
      console.warn('⚠️ Could not get current version, assuming 2.0.0');
      return '2.0.0';
    }
  }

  /**
   * Définit la nouvelle version
   */
  async setVersion(version) {
    try {
      await chrome.storage.local.set({ extensionVersion: version });
      console.log(`📌 Version set to ${version}`);
    } catch (error) {
      console.error('❌ Could not set version:', error);
    }
  }

  /**
   * Vérifie si une migration est nécessaire
   */
  needsMigration(currentVersion, targetVersion) {
    // Logique simple de comparaison de version
    const current = this.parseVersion(currentVersion);
    const target = this.parseVersion(targetVersion);
    
    return current.major < target.major || 
           (current.major === target.major && current.minor < target.minor) ||
           (current.major === target.major && current.minor === target.minor && current.patch < target.patch);
  }

  /**
   * Parse une version semver
   */
  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  /**
   * Exporte les comptes-rendus de migration
   */
  async exportMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      settingsCount: 0,
      profilesCount: 0,
      errors: []
    };

    try {
      const settings = await chrome.storage.sync.get();
      const { profiles = [] } = await chrome.storage.local.get('profiles');
      
      report.settingsCount = Object.keys(settings).length;
      report.profilesCount = profiles.length;

      return report;
    } catch (error) {
      report.errors.push(error.message);
      return report;
    }
  }
}

// Auto-exécution de la migration lors de l'import
const migrationHelper = new MigrationHelper();
// La migration sera appelée depuis le background script principal
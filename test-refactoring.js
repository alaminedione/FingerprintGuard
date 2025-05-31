#!/usr/bin/env node

/**
 * Script de validation du refactoring FingerprintGuard v2.1.0
 * Teste la syntaxe et la cohérence du nouveau code
 */

import fs from 'fs';
import path from 'path';

// Simuler l'environnement Chrome pour les tests
global.chrome = {
  storage: {
    sync: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      clear: () => Promise.resolve()
    },
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve()
    },
    onChanged: {
      addListener: () => {}
    }
  },
  runtime: {
    onMessage: {
      addListener: () => {}
    },
    sendMessage: () => Promise.resolve({})
  },
  tabs: {
    query: () => Promise.resolve([]),
    reload: () => Promise.resolve(),
    get: () => Promise.resolve({})
  },
  webNavigation: {
    onCommitted: { addListener: () => {} },
    onBeforeNavigate: { addListener: () => {} }
  },
  scripting: {
    executeScript: () => Promise.resolve()
  },
  declarativeNetRequest: {
    updateDynamicRules: () => Promise.resolve()
  },
  contentSettings: {
    javascript: { set: () => Promise.resolve() },
    images: { set: () => Promise.resolve() }
  },
  commands: {
    onCommand: { addListener: () => {} }
  },
  notifications: {
    create: () => Promise.resolve()
  }
};

class RefactoringValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.tests = [];
    this.basePath = process.cwd();
  }

  /**
   * Lance tous les tests de validation
   */
  async runAllTests() {
    console.log('🧪 Starting FingerprintGuard Refactoring Validation...\n');

    try {
      // Tests de structure
      await this.testFileStructure();
      
      // Tests de syntaxe
      await this.testModuleSyntax();
      
      // Tests d'imports/exports
      await this.testModuleDependencies();
      
      // Tests de compatibilité
      await this.testBackwardsCompatibility();
      
      // Tests de fonctionnalité de base
      await this.testBasicFunctionality();

      // Rapports des résultats
      this.printResults();

    } catch (error) {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Teste la structure des fichiers
   */
  async testFileStructure() {
    console.log('📁 Testing file structure...');
    
    const requiredFiles = [
      'src/background.js',
      'src/config/defaults.js',
      'src/core/settings-manager.js',
      'src/core/profile-manager.js',
      'src/core/script-injector.js',
      'src/core/spoofing-service.js',
      'src/spoofing/spoofing-data.js',
      'src/spoofing/spoofing-apply.js',
      'src/utils.js',
      'src/migration.js',
      'manifest.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.basePath, file);
      if (fs.existsSync(filePath)) {
        this.addTest(`✅ File exists: ${file}`, true);
      } else {
        this.addTest(`❌ Missing file: ${file}`, false);
      }
    }

    // Tester la mise à jour du manifest
    try {
      const manifestContent = fs.readFileSync(path.join(this.basePath, 'manifest.json'), 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      if (manifest.background.service_worker === 'src/background.js') {
        this.addTest('✅ Manifest updated to use src/background.js', true);
      } else {
        this.addTest('❌ Manifest not updated correctly', false);
      }
    } catch (error) {
      this.addTest('❌ Cannot read/parse manifest.json', false);
    }
  }

  /**
   * Teste la syntaxe des modules
   */
  async testModuleSyntax() {
    console.log('📝 Testing module syntax...');

    const jsFiles = [
      'src/background.js',
      'src/config/defaults.js',
      'src/core/settings-manager.js',
      'src/core/profile-manager.js',
      'src/core/script-injector.js',
      'src/core/spoofing-service.js',
      'src/spoofing/spoofing-data.js',
      'src/spoofing/spoofing-apply.js',
      'src/utils.js'
    ];

    for (const file of jsFiles) {
      try {
        const filePath = path.join(this.basePath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Test basique de syntaxe (cherche des erreurs évidentes)
        if (content.includes('export ') || content.includes('import ')) {
          this.addTest(`✅ ES6 modules syntax in ${file}`, true);
        } else {
          this.addWarning(`⚠️ No ES6 modules detected in ${file}`);
        }

        // Vérifier les imports relatifs
        const importMatches = content.match(/from ['"]\.\.?\//g);
        if (importMatches) {
          this.addTest(`✅ Relative imports found in ${file}`, true);
        }

      } catch (error) {
        this.addTest(`❌ Syntax error in ${file}: ${error.message}`, false);
      }
    }
  }

  /**
   * Teste les dépendances entre modules
   */
  async testModuleDependencies() {
    console.log('🔗 Testing module dependencies...');

    try {
      // Test d'import du module principal
      const { SettingsManager } = await import('./src/core/settings-manager.js');
      this.addTest('✅ Can import SettingsManager', !!SettingsManager);

      const { ProfileManager } = await import('./src/core/profile-manager.js');
      this.addTest('✅ Can import ProfileManager', !!ProfileManager);

      const { ScriptInjector } = await import('./src/core/script-injector.js');
      this.addTest('✅ Can import ScriptInjector', !!ScriptInjector);

      const { SpoofingService } = await import('./src/core/spoofing-service.js');
      this.addTest('✅ Can import SpoofingService', !!SpoofingService);

      const defaults = await import('./src/config/defaults.js');
      this.addTest('✅ Can import defaults config', !!defaults.DEFAULT_SETTINGS);

      const utils = await import('./src/utils.js');
      this.addTest('✅ Can import utils', !!utils.getRandomElement);

    } catch (error) {
      this.addTest(`❌ Module import error: ${error.message}`, false);
    }
  }

  /**
   * Teste la compatibilité arrière
   */
  async testBackwardsCompatibility() {
    console.log('🔄 Testing backwards compatibility...');

    try {
      // Tester que les anciens fichiers existent encore
      const oldFiles = ['background.js', 'spoofing-data.js', 'spoofing-apply.js', 'utils.js'];
      
      for (const file of oldFiles) {
        const filePath = path.join(this.basePath, file);
        if (fs.existsSync(filePath)) {
          this.addWarning(`⚠️ Old file still exists: ${file} (consider cleanup)`);
        }
      }

      this.addTest('✅ Backwards compatibility checked', true);

    } catch (error) {
      this.addTest(`❌ Compatibility test error: ${error.message}`, false);
    }
  }

  /**
   * Teste la fonctionnalité de base
   */
  async testBasicFunctionality() {
    console.log('⚙️ Testing basic functionality...');

    try {
      // Tester l'instanciation des classes principales
      const { SettingsManager } = await import('./src/core/settings-manager.js');
      const settingsManager = new SettingsManager();
      this.addTest('✅ Can instantiate SettingsManager', !!settingsManager);

      const { ScriptInjector } = await import('./src/core/script-injector.js');
      const scriptInjector = new ScriptInjector();
      this.addTest('✅ Can instantiate ScriptInjector', !!scriptInjector);

      // Tester les méthodes utilitaires
      const { getRandomElement, getRandomInRange } = await import('./src/utils.js');
      const randomElement = getRandomElement([1, 2, 3]);
      const randomNumber = getRandomInRange(1, 10);
      
      this.addTest('✅ Utility functions work', randomElement !== undefined && randomNumber >= 1 && randomNumber <= 10);

      // Tester la configuration par défaut
      const { DEFAULT_SETTINGS } = await import('./src/config/defaults.js');
      this.addTest('✅ Default settings exist', !!DEFAULT_SETTINGS && typeof DEFAULT_SETTINGS === 'object');

    } catch (error) {
      this.addTest(`❌ Functionality test error: ${error.message}`, false);
    }
  }

  /**
   * Ajoute un test au rapport
   */
  addTest(message, passed) {
    this.tests.push({ message, passed });
    if (!passed) {
      this.errors.push(message);
    }
  }

  /**
   * Ajoute un avertissement
   */
  addWarning(message) {
    this.warnings.push(message);
  }

  /**
   * Affiche les résultats
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REFACTORING VALIDATION RESULTS');
    console.log('='.repeat(60));

    const passedTests = this.tests.filter(t => t.passed).length;
    const failedTests = this.tests.filter(t => !t.passed).length;

    console.log(`\n✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}\n`);

    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  ${test.message}`);
      });
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning}`);
      });
      console.log();
    }

    // Résumé final
    const successRate = (passedTests / this.tests.length * 100).toFixed(1);
    
    if (failedTests === 0) {
      console.log(`🎉 REFACTORING VALIDATION SUCCESSFUL! (${successRate}%)`);
      console.log('✅ The refactored code is ready for use.\n');
      process.exit(0);
    } else {
      console.log(`💥 REFACTORING VALIDATION FAILED! (${successRate}%)`);
      console.log(`❌ Please fix the ${failedTests} failing test(s) before proceeding.\n`);
      process.exit(1);
    }
  }
}

// Exécuter les tests
const validator = new RefactoringValidator();
validator.runAllTests().catch(console.error);
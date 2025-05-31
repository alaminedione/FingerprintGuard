#!/usr/bin/env node

/**
 * Script de test pour Chrome Extension
 * Vérifie la compatibilité et les erreurs potentielles
 */

import fs from 'fs';
import path from 'path';

class ExtensionTester {
    constructor() {
        this.issues = [];
        this.warnings = [];
    }

    async testExtension() {
        console.log('🔍 Testing Chrome Extension compatibility...\n');

        // 1. Vérifier le manifest
        await this.checkManifest();
        
        // 2. Vérifier les fichiers référencés
        await this.checkReferencedFiles();
        
        // 3. Vérifier les imports/exports
        await this.checkModuleCompatibility();
        
        // 4. Vérifier les permissions
        await this.checkPermissions();
        
        // Générer le rapport
        this.generateReport();
    }

    async checkManifest() {
        console.log('📋 Checking manifest.json...');
        
        try {
            const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
            
            // Vérifier la version du manifest
            if (manifest.manifest_version !== 3) {
                this.addIssue('Manifest version should be 3 for modern Chrome extensions');
            }
            
            // Vérifier le service worker
            if (manifest.background?.service_worker) {
                const swPath = manifest.background.service_worker;
                if (!fs.existsSync(swPath)) {
                    this.addIssue(`Service worker not found: ${swPath}`);
                } else {
                    console.log(`  ✅ Service worker found: ${swPath}`);
                }
            }
            
            // Vérifier les fichiers de l'action
            if (manifest.action?.default_popup) {
                const popupPath = manifest.action.default_popup;
                if (!fs.existsSync(popupPath)) {
                    this.addIssue(`Popup file not found: ${popupPath}`);
                } else {
                    console.log(`  ✅ Popup file found: ${popupPath}`);
                }
            }
            
            // Vérifier les icônes
            if (manifest.icons) {
                Object.entries(manifest.icons).forEach(([size, iconPath]) => {
                    if (!fs.existsSync(iconPath)) {
                        this.addWarning(`Icon not found: ${iconPath} (${size}px)`);
                    }
                });
            }
            
            console.log('  ✅ Manifest structure valid');
            
        } catch (error) {
            this.addIssue(`Manifest parsing error: ${error.message}`);
        }
    }

    async checkReferencedFiles() {
        console.log('📁 Checking referenced files...');
        
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
        
        // Vérifier les web accessible resources
        if (manifest.web_accessible_resources) {
            manifest.web_accessible_resources.forEach(resource => {
                if (resource.resources) {
                    resource.resources.forEach(file => {
                        if (!fs.existsSync(file)) {
                            this.addIssue(`Web accessible resource not found: ${file}`);
                        } else {
                            console.log(`  ✅ Web resource found: ${file}`);
                        }
                    });
                }
            });
        }
        
        // Vérifier options_ui
        if (manifest.options_ui?.page) {
            const optionsPage = manifest.options_ui.page;
            if (!fs.existsSync(optionsPage)) {
                this.addIssue(`Options page not found: ${optionsPage}`);
            } else {
                console.log(`  ✅ Options page found: ${optionsPage}`);
            }
        }
    }

    async checkModuleCompatibility() {
        console.log('🔗 Checking module compatibility...');
        
        const swPath = 'src/background.js';
        if (!fs.existsSync(swPath)) {
            this.addIssue('Service worker file missing');
            return;
        }
        
        try {
            const content = fs.readFileSync(swPath, 'utf-8');
            
            // Vérifier les imports ES6
            const imports = content.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g);
            if (imports) {
                console.log(`  📦 Found ${imports.length} ES6 imports`);
                
                imports.forEach(importLine => {
                    const pathMatch = importLine.match(/from\s+['"]([^'"]+)['"]/);
                    if (pathMatch) {
                        const importPath = pathMatch[1];
                        const resolvedPath = path.resolve('src', importPath);
                        
                        if (!fs.existsSync(resolvedPath)) {
                            this.addIssue(`Import path not found: ${importPath} (resolved: ${resolvedPath})`);
                        } else {
                            console.log(`    ✅ Import resolved: ${importPath}`);
                        }
                    }
                });
            }
            
            // Vérifier les APIs Chrome utilisées
            const chromeAPIs = content.match(/chrome\\.\\w+/g);
            if (chromeAPIs) {
                const uniqueAPIs = [...new Set(chromeAPIs)];
                console.log(`  🔌 Chrome APIs used: ${uniqueAPIs.join(', ')}`);
            }
            
        } catch (error) {
            this.addIssue(`Module compatibility check failed: ${error.message}`);
        }
    }

    async checkPermissions() {
        console.log('🔐 Checking permissions...');
        
        try {
            const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
            const permissions = manifest.permissions || [];
            const hostPermissions = manifest.host_permissions || [];
            
            console.log(`  📋 Permissions requested: ${permissions.length}`);
            console.log(`  🌐 Host permissions: ${hostPermissions.length}`);
            
            // Vérifier les permissions critiques
            const criticalPermissions = ['storage', 'scripting', 'tabs'];
            criticalPermissions.forEach(perm => {
                if (!permissions.includes(perm)) {
                    this.addWarning(`Missing potentially needed permission: ${perm}`);
                }
            });
            
        } catch (error) {
            this.addIssue(`Permission check failed: ${error.message}`);
        }
    }

    addIssue(message) {
        this.issues.push(message);
        console.log(`  ❌ ${message}`);
    }

    addWarning(message) {
        this.warnings.push(message);
        console.log(`  ⚠️  ${message}`);
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 CHROME EXTENSION TEST REPORT');
        console.log('='.repeat(60) + '\n');

        console.log(`🔴 Issues Found: ${this.issues.length}`);
        console.log(`🟡 Warnings: ${this.warnings.length}\n`);

        if (this.issues.length === 0 && this.warnings.length === 0) {
            console.log('🎉 EXCELLENT! Extension is ready for Chrome.');
            console.log('\n📋 Next steps:');
            console.log('1. Load the extension in Chrome Developer Mode');
            console.log('2. Check chrome://extensions/ for any runtime errors');
            console.log('3. Test all functionality in browser');
        } else {
            if (this.issues.length > 0) {
                console.log('🔴 CRITICAL ISSUES:');
                console.log('-'.repeat(30));
                this.issues.forEach((issue, index) => {
                    console.log(`${index + 1}. ${issue}`);
                });
                console.log();
            }

            if (this.warnings.length > 0) {
                console.log('⚠️  WARNINGS:');
                console.log('-'.repeat(30));
                this.warnings.forEach((warning, index) => {
                    console.log(`${index + 1}. ${warning}`);
                });
                console.log();
            }
        }

        console.log('='.repeat(60));
    }
}

// Lancement du test
const tester = new ExtensionTester();
tester.testExtension().catch(console.error);
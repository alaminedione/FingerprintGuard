#!/usr/bin/env node

/**
 * Final Test Script for Ghost Mode Deactivation with Badge Support
 */

const fs = require('fs');
const path = require('path');

class FinalDeactivationTest {
  constructor() {
    this.errors = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const prefix = {
      'error': '❌',
      'success': '✅',
      'info': 'ℹ️'
    }[type];
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.errors.push(message);
    else if (type === 'success') this.success.push(message);
  }

  testBackgroundScript() {
    this.log('Testing background script implementation...', 'info');
    
    try {
      const backgroundPath = path.join(__dirname, 'src', 'background.js');
      const content = fs.readFileSync(backgroundPath, 'utf8');
      
      // Test that problematic updateBadgeAndIcon call is removed
      if (content.includes('updateBadgeAndIcon()')) {
        this.log('Old updateBadgeAndIcon call still present', 'error');
        return false;
      }
      this.log('Old updateBadgeAndIcon call properly removed', 'success');
      
      // Test that new updateExtensionBadge function exists
      if (!content.includes('async updateExtensionBadge()')) {
        this.log('updateExtensionBadge function not found', 'error');
        return false;
      }
      this.log('updateExtensionBadge function found', 'success');
      
      // Test that function is called in deactivation handler
      if (!content.includes('await this.updateExtensionBadge();')) {
        this.log('updateExtensionBadge not called in handlers', 'error');
        return false;
      }
      this.log('updateExtensionBadge properly called in handlers', 'success');
      
      // Test badge logic
      if (!content.includes('chrome.action.setBadgeText')) {
        this.log('Badge text setting not implemented', 'error');
        return false;
      }
      this.log('Badge text setting implemented', 'success');
      
      if (!content.includes('chrome.action.setBadgeBackgroundColor')) {
        this.log('Badge color setting not implemented', 'error');
        return false;
      }
      this.log('Badge color setting implemented', 'success');
      
      // Test ghost mode detection
      if (!content.includes('isGhostMode') || !content.includes('isJustProtectMe')) {
        this.log('Ghost mode detection logic not found', 'error');
        return false;
      }
      this.log('Ghost mode detection logic found', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error reading background script: ${error.message}`, 'error');
      return false;
    }
  }

  testPopupIntegration() {
    this.log('Testing popup integration...', 'info');
    
    try {
      const popupPath = path.join(__dirname, 'popup.js');
      const content = fs.readFileSync(popupPath, 'utf8');
      
      // Test that popup uses correct message types
      if (!content.includes("type: 'deactivateJustProtectMe'")) {
        this.log('Deactivation message type not found', 'error');
        return false;
      }
      this.log('Deactivation message type correct', 'success');
      
      if (!content.includes("type: 'regenerateProfile'")) {
        this.log('Regeneration message type not found', 'error');
        return false;
      }
      this.log('Regeneration message type correct', 'success');
      
      // Test error handling
      if (!content.includes('catch (error)')) {
        this.log('Error handling not found in popup', 'error');
        return false;
      }
      this.log('Error handling present in popup', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error reading popup script: ${error.message}`, 'error');
      return false;
    }
  }

  testHTMLStructure() {
    this.log('Testing HTML structure...', 'info');
    
    try {
      const htmlPath = path.join(__dirname, 'popup.html');
      const content = fs.readFileSync(htmlPath, 'utf8');
      
      // Test button presence
      if (!content.includes('id="deactivateGhostMode"')) {
        this.log('Deactivate button not found', 'error');
        return false;
      }
      this.log('Deactivate button found', 'success');
      
      if (!content.includes('id="regenerateGhostProfile"')) {
        this.log('Regenerate button not found', 'error');
        return false;
      }
      this.log('Regenerate button found', 'success');
      
      // Test styling
      if (!content.includes('ghost-actions')) {
        this.log('Ghost actions styling not found', 'error');
        return false;
      }
      this.log('Ghost actions styling found', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error reading HTML file: ${error.message}`, 'error');
      return false;
    }
  }

  async runTests() {
    this.log('🚀 Running Final Ghost Mode Deactivation Tests...', 'info');
    this.log('=' * 50, 'info');
    
    const tests = [
      { name: 'Background Script', test: () => this.testBackgroundScript() },
      { name: 'Popup Integration', test: () => this.testPopupIntegration() },
      { name: 'HTML Structure', test: () => this.testHTMLStructure() }
    ];
    
    let passed = 0;
    
    for (const { name, test } of tests) {
      this.log(`\nTesting ${name}:`, 'info');
      if (test()) {
        passed++;
        this.log(`${name}: PASSED`, 'success');
      } else {
        this.log(`${name}: FAILED`, 'error');
      }
    }
    
    this.log('\n' + '=' * 50, 'info');
    this.log('FINAL RESULTS:', 'info');
    this.log(`Tests Passed: ${passed}/${tests.length}`, passed === tests.length ? 'success' : 'error');
    this.log(`Total Successes: ${this.success.length}`, 'success');
    this.log(`Total Errors: ${this.errors.length}`, this.errors.length === 0 ? 'success' : 'error');
    
    if (this.errors.length > 0) {
      this.log('\nErrors found:', 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    const allPassed = passed === tests.length && this.errors.length === 0;
    this.log(`\n🎯 Ghost Mode Deactivation: ${allPassed ? 'READY FOR USE' : 'NEEDS ATTENTION'}`, 
             allPassed ? 'success' : 'error');
    
    return allPassed;
  }
}

// Run tests
if (require.main === module) {
  const tester = new FinalDeactivationTest();
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = FinalDeactivationTest;
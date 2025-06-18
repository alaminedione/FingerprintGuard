#!/usr/bin/env node

/**
 * Test Script for Ghost Mode Deactivation in Popup
 * Validates the implementation of ghost mode deactivation functionality
 */

const fs = require('fs');
const path = require('path');

class PopupGhostModeTest {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'error': '❌',
      'warning': '⚠️',
      'success': '✅',
      'info': 'ℹ️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    else if (type === 'warning') this.warnings.push(message);
    else if (type === 'success') this.success.push(message);
  }

  async testPopupHTML() {
    this.log('Testing popup HTML structure...', 'info');
    
    try {
      const popupPath = path.join(__dirname, 'popup.html');
      const content = fs.readFileSync(popupPath, 'utf8');
      
      // Test ghost mode indicator structure
      if (!content.includes('id="ghostModeIcon"')) {
        this.log('Ghost mode indicator element not found', 'error');
        return false;
      }
      this.log('Ghost mode indicator element found', 'success');
      
      // Test ghost actions container
      if (!content.includes('class="ghost-actions"')) {
        this.log('Ghost actions container not found', 'error');
        return false;
      }
      this.log('Ghost actions container found', 'success');
      
      // Test deactivate button
      if (!content.includes('id="deactivateGhostMode"')) {
        this.log('Deactivate ghost mode button not found', 'error');
        return false;
      }
      this.log('Deactivate ghost mode button found', 'success');
      
      // Test regenerate button
      if (!content.includes('id="regenerateGhostProfile"')) {
        this.log('Regenerate ghost profile button not found', 'error');
        return false;
      }
      this.log('Regenerate ghost profile button found', 'success');
      
      // Test CSS styles for ghost actions
      if (!content.includes('.ghost-actions')) {
        this.log('Ghost actions CSS styles not found', 'error');
        return false;
      }
      this.log('Ghost actions CSS styles found', 'success');
      
      // Test button styling
      if (!content.includes('.ghost-deactivate') || !content.includes('.ghost-regenerate')) {
        this.log('Ghost button specific styles not found', 'error');
        return false;
      }
      this.log('Ghost button specific styles found', 'success');
      
      return true;
    } catch (error) {
      this.log(`Error reading popup.html: ${error.message}`, 'error');
      return false;
    }
  }

  async testPopupJS() {
    this.log('Testing popup JavaScript functionality...', 'info');
    
    try {
      const popupJSPath = path.join(__dirname, 'popup.js');
      const content = fs.readFileSync(popupJSPath, 'utf8');
      
      // Test element initialization
      if (!content.includes('this.deactivateGhostButton') || !content.includes('this.regenerateGhostButton')) {
        this.log('Ghost mode button elements not initialized', 'error');
        return false;
      }
      this.log('Ghost mode button elements properly initialized', 'success');
      
      // Test event listeners
      if (!content.includes('deactivateGhostButton.addEventListener') || 
          !content.includes('regenerateGhostButton.addEventListener')) {
        this.log('Ghost mode button event listeners not found', 'error');
        return false;
      }
      this.log('Ghost mode button event listeners found', 'success');
      
      // Test deactivateGhostMode function
      if (!content.includes('async deactivateGhostMode()')) {
        this.log('deactivateGhostMode function not found', 'error');
        return false;
      }
      this.log('deactivateGhostMode function found', 'success');
      
      // Test regenerateGhostProfile function
      if (!content.includes('async regenerateGhostProfile()')) {
        this.log('regenerateGhostProfile function not found', 'error');
        return false;
      }
      this.log('regenerateGhostProfile function found', 'success');
      
      // Test message format (should use 'type' not 'action')
      if (content.includes("action: 'deactivateJustProtectMe'") || 
          content.includes("action: 'regenerateProfile'")) {
        this.log('Incorrect message format found (using action instead of type)', 'error');
        return false;
      }
      
      if (!content.includes("type: 'deactivateJustProtectMe'") || 
          !content.includes("type: 'regenerateProfile'")) {
        this.log('Correct message format not found', 'error');
        return false;
      }
      this.log('Correct message format found (using type)', 'success');
      
      // Test error handling
      if (!content.includes('catch (error)') || !content.includes('finally')) {
        this.log('Proper error handling not found in ghost mode functions', 'warning');
      } else {
        this.log('Proper error handling found in ghost mode functions', 'success');
      }
      
      // Test user feedback
      if (!content.includes('showNotification') || !content.includes('showLoading')) {
        this.log('User feedback mechanisms not found', 'warning');
      } else {
        this.log('User feedback mechanisms found', 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`Error reading popup.js: ${error.message}`, 'error');
      return false;
    }
  }

  async testBackgroundJS() {
    this.log('Testing background script handlers...', 'info');
    
    try {
      const backgroundPath = path.join(__dirname, 'src', 'background.js');
      const content = fs.readFileSync(backgroundPath, 'utf8');
      
      // Test message handlers registration
      if (!content.includes("'deactivateJustProtectMe': this.handleDeactivateJustProtectMe.bind(this)")) {
        this.log('deactivateJustProtectMe handler not registered', 'error');
        return false;
      }
      this.log('deactivateJustProtectMe handler properly registered', 'success');
      
      if (!content.includes("'regenerateProfile': this.handleRegenerateProfile.bind(this)")) {
        this.log('regenerateProfile handler not registered', 'error');
        return false;
      }
      this.log('regenerateProfile handler properly registered', 'success');
      
      // Test handler functions
      if (!content.includes('async handleDeactivateJustProtectMe(')) {
        this.log('handleDeactivateJustProtectMe function not found', 'error');
        return false;
      }
      this.log('handleDeactivateJustProtectMe function found', 'success');
      
      if (!content.includes('async handleRegenerateProfile(')) {
        this.log('handleRegenerateProfile function not found', 'error');
        return false;
      }
      this.log('handleRegenerateProfile function found', 'success');
      
      // Test deactivation logic
      if (!content.includes("settingsManager.set('ghostMode', false)") ||
          !content.includes("settingsManager.set('justProtectMe.autoProfile', false)")) {
        this.log('Proper deactivation logic not found', 'error');
        return false;
      }
      this.log('Proper deactivation logic found', 'success');
      
      // Test profile regeneration logic
      if (!content.includes('profileManager.generate()')) {
        this.log('Profile regeneration logic not found', 'error');
        return false;
      }
      this.log('Profile regeneration logic found', 'success');
      
      // Test badge update
      if (!content.includes('updateBadgeAndIcon()')) {
        this.log('Badge update call not found in deactivation', 'warning');
      } else {
        this.log('Badge update call found in deactivation', 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`Error reading background.js: ${error.message}`, 'error');
      return false;
    }
  }

  async testIntegration() {
    this.log('Testing integration between components...', 'info');
    
    try {
      // Test that popup and background use consistent message types
      const popupPath = path.join(__dirname, 'popup.js');
      const backgroundPath = path.join(__dirname, 'src', 'background.js');
      
      const popupContent = fs.readFileSync(popupPath, 'utf8');
      const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
      
      // Extract message types from popup
      const popupMessages = [];
      const typeMatches = popupContent.match(/type:\s*['"]([^'"]+)['"]/g);
      if (typeMatches) {
        typeMatches.forEach(match => {
          const type = match.match(/type:\s*['"]([^'"]+)['"]/)[1];
          popupMessages.push(type);
        });
      }
      
      // Check if all popup message types have handlers in background
      const missingHandlers = [];
      popupMessages.forEach(messageType => {
        if (!backgroundContent.includes(`'${messageType}':`)) {
          missingHandlers.push(messageType);
        }
      });
      
      if (missingHandlers.length > 0) {
        this.log(`Missing handlers for message types: ${missingHandlers.join(', ')}`, 'error');
        return false;
      }
      
      this.log('All popup message types have corresponding background handlers', 'success');
      
      // Test specific ghost mode message types
      const ghostModeTypes = ['deactivateJustProtectMe', 'regenerateProfile'];
      const foundTypes = ghostModeTypes.filter(type => 
        popupMessages.includes(type) && backgroundContent.includes(`'${type}':`)
      );
      
      if (foundTypes.length !== ghostModeTypes.length) {
        this.log('Not all ghost mode message types properly integrated', 'error');
        return false;
      }
      
      this.log('All ghost mode message types properly integrated', 'success');
      
      return true;
    } catch (error) {
      this.log(`Error testing integration: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Ghost Mode Deactivation Tests for Popup...', 'info');
    this.log('='.repeat(60), 'info');
    
    const tests = [
      { name: 'Popup HTML Structure', test: () => this.testPopupHTML() },
      { name: 'Popup JavaScript Functionality', test: () => this.testPopupJS() },
      { name: 'Background Script Handlers', test: () => this.testBackgroundJS() },
      { name: 'Component Integration', test: () => this.testIntegration() }
    ];
    
    let passedTests = 0;
    
    for (const { name, test } of tests) {
      this.log(`\nRunning: ${name}`, 'info');
      this.log('-'.repeat(40), 'info');
      
      const result = await test();
      if (result) {
        passedTests++;
        this.log(`${name}: PASSED`, 'success');
      } else {
        this.log(`${name}: FAILED`, 'error');
      }
    }
    
    // Final report
    this.log('\n' + '='.repeat(60), 'info');
    this.log('FINAL TEST REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`Tests Passed: ${passedTests}/${tests.length}`, passedTests === tests.length ? 'success' : 'error');
    this.log(`Errors: ${this.errors.length}`, this.errors.length === 0 ? 'success' : 'error');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length === 0 ? 'success' : 'warning');
    this.log(`Successes: ${this.success.length}`, 'success');
    
    if (this.errors.length > 0) {
      this.log('\nERRORS FOUND:', 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    if (this.warnings.length > 0) {
      this.log('\nWARNINGS:', 'warning');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
    }
    
    const allTestsPassed = passedTests === tests.length && this.errors.length === 0;
    
    this.log(`\n🎯 GHOST MODE DEACTIVATION IN POPUP: ${allTestsPassed ? 'READY FOR USE' : 'NEEDS ATTENTION'}`, 
             allTestsPassed ? 'success' : 'error');
    
    return allTestsPassed;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PopupGhostModeTest();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = PopupGhostModeTest;
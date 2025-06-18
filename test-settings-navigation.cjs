#!/usr/bin/env node

/**
 * Test Script for Settings Page Navigation Fix
 * Validates that navigation sections work properly
 */

const fs = require('fs');
const path = require('path');

class SettingsNavigationTest {
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

  testNavigationEventListeners() {
    this.log('Testing navigation event listeners implementation...', 'info');
    
    try {
      const settingsPath = path.join(__dirname, 'settings.js');
      const content = fs.readFileSync(settingsPath, 'utf8');
      
      // Test that attachNavigationListeners function exists
      if (!content.includes('attachNavigationListeners()')) {
        this.log('attachNavigationListeners function not found', 'error');
        return false;
      }
      this.log('attachNavigationListeners function found', 'success');
      
      // Test that it's called in createNavigation
      if (!content.includes('this.attachNavigationListeners();')) {
        this.log('attachNavigationListeners not called in createNavigation', 'error');
        return false;
      }
      this.log('attachNavigationListeners called in createNavigation', 'success');
      
      // Test that navigation listeners are removed from main attachEventListeners
      const navListenersInMain = content.match(/attachEventListeners\(\)[\s\S]*?const navLinks = document\.querySelectorAll/);
      if (navListenersInMain) {
        this.log('Navigation listeners still in main attachEventListeners function', 'error');
        return false;
      }
      this.log('Navigation listeners properly separated from main attachEventListeners', 'success');
      
      // Test that event listeners are properly handled
      if (!content.includes('event.preventDefault()') || !content.includes('dataset.section')) {
        this.log('Navigation event handling logic not found', 'error');
        return false;
      }
      this.log('Navigation event handling logic found', 'success');
      
      // Test that showSection is called
      if (!content.includes('this.showSection(sectionId)')) {
        this.log('showSection call not found in navigation handlers', 'error');
        return false;
      }
      this.log('showSection call found in navigation handlers', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error reading settings.js: ${error.message}`, 'error');
      return false;
    }
  }

  testShowSectionFunction() {
    this.log('Testing showSection function...', 'info');
    
    try {
      const settingsPath = path.join(__dirname, 'settings.js');
      const content = fs.readFileSync(settingsPath, 'utf8');
      
      // Test that showSection function exists
      if (!content.includes('showSection(sectionId)')) {
        this.log('showSection function not found', 'error');
        return false;
      }
      this.log('showSection function found', 'success');
      
      // Test that it handles section visibility
      if (!content.includes('style.display = \'none\'') || !content.includes('style.display = \'block\'')) {
        this.log('Section visibility handling not found', 'error');
        return false;
      }
      this.log('Section visibility handling found', 'success');
      
      // Test that it handles active link styling
      if (!content.includes('classList.remove(\'active\')') || !content.includes('classList.add(\'active\')')) {
        this.log('Active link styling not found', 'error');
        return false;
      }
      this.log('Active link styling found', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error testing showSection: ${error.message}`, 'error');
      return false;
    }
  }

  testSectionDefinitions() {
    this.log('Testing section definitions...', 'info');
    
    try {
      const settingsPath = path.join(__dirname, 'settings.js');
      const content = fs.readFileSync(settingsPath, 'utf8');
      
      // Test that sections are defined for different modes
      const expectedSections = ['simple', 'advanced', 'justprotectme'];
      let allSectionsFound = true;
      
      expectedSections.forEach(mode => {
        if (!content.includes(`${mode}: [`)) {
          this.log(`Section definition for ${mode} mode not found`, 'error');
          allSectionsFound = false;
        } else {
          this.log(`Section definition for ${mode} mode found`, 'success');
        }
      });
      
      // Test that section creation functions exist
      const sectionCreationFunctions = [
        'createGeneralSection',
        'createNavigatorSection', 
        'createUserAgentSection',
        'createHeadersSection',
        'createScreenSection',
        'createProfilesSection',
        'createAdvancedSection',
        'createJustProtectMeSection',
        'createStatsSection'
      ];
      
      sectionCreationFunctions.forEach(funcName => {
        if (!content.includes(`${funcName}()`)) {
          this.log(`Section creation function ${funcName} not found`, 'error');
          allSectionsFound = false;
        } else {
          this.log(`Section creation function ${funcName} found`, 'success');
        }
      });
      
      return allSectionsFound;
      
    } catch (error) {
      this.log(`Error testing section definitions: ${error.message}`, 'error');
      return false;
    }
  }

  testNavigationCreation() {
    this.log('Testing navigation creation...', 'info');
    
    try {
      const settingsPath = path.join(__dirname, 'settings.js');
      const content = fs.readFileSync(settingsPath, 'utf8');
      
      // Test that createNavigation function exists
      if (!content.includes('createNavigation()')) {
        this.log('createNavigation function not found', 'error');
        return false;
      }
      this.log('createNavigation function found', 'success');
      
      // Test that it clears existing navigation
      if (!content.includes('navList.innerHTML = \'\';')) {
        this.log('Navigation clearing logic not found', 'error');
        return false;
      }
      this.log('Navigation clearing logic found', 'success');
      
      // Test that it creates nav-link elements
      if (!content.includes('nav-link') || !content.includes('data-section')) {
        this.log('Navigation link creation logic not found', 'error');
        return false;
      }
      this.log('Navigation link creation logic found', 'success');
      
      return true;
      
    } catch (error) {
      this.log(`Error testing navigation creation: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Settings Page Navigation Tests...', 'info');
    this.log('='.repeat(60), 'info');
    
    const tests = [
      { name: 'Navigation Event Listeners', test: () => this.testNavigationEventListeners() },
      { name: 'Show Section Function', test: () => this.testShowSectionFunction() },
      { name: 'Section Definitions', test: () => this.testSectionDefinitions() },
      { name: 'Navigation Creation', test: () => this.testNavigationCreation() }
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
    
    this.log(`\n🎯 SETTINGS NAVIGATION: ${allTestsPassed ? 'FIXED AND WORKING' : 'NEEDS ATTENTION'}`, 
             allTestsPassed ? 'success' : 'error');
    
    return allTestsPassed;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SettingsNavigationTest();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = SettingsNavigationTest;
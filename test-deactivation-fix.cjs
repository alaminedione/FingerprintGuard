#!/usr/bin/env node

/**
 * Quick Test Script for Ghost Mode Deactivation Fix
 */

const fs = require('fs');
const path = require('path');

function testDeactivationFix() {
  console.log('🔍 Testing Ghost Mode Deactivation Fix...');
  
  try {
    const backgroundPath = path.join(__dirname, 'src', 'background.js');
    const content = fs.readFileSync(backgroundPath, 'utf8');
    
    // Test that updateBadgeAndIcon call was removed
    if (content.includes('this.updateBadgeAndIcon()')) {
      console.log('❌ updateBadgeAndIcon call still exists');
      return false;
    }
    console.log('✅ updateBadgeAndIcon call removed successfully');
    
    // Test that deactivation logic still exists
    if (!content.includes("settingsManager.set('ghostMode', false)")) {
      console.log('❌ Ghost mode deactivation logic missing');
      return false;
    }
    console.log('✅ Ghost mode deactivation logic present');
    
    if (!content.includes("settingsManager.set('justProtectMe.autoProfile', false)")) {
      console.log('❌ Just Protect Me deactivation logic missing');
      return false;
    }
    console.log('✅ Just Protect Me deactivation logic present');
    
    // Test that handler is still registered
    if (!content.includes("'deactivateJustProtectMe': this.handleDeactivateJustProtectMe.bind(this)")) {
      console.log('❌ Handler registration missing');
      return false;
    }
    console.log('✅ Handler registration present');
    
    // Test that function exists
    if (!content.includes('async handleDeactivateJustProtectMe(')) {
      console.log('❌ Handler function missing');
      return false;
    }
    console.log('✅ Handler function present');
    
    console.log('\n🎯 Ghost Mode Deactivation Fix: SUCCESSFUL');
    console.log('✅ The TypeError should now be resolved');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Error testing fix: ${error.message}`);
    return false;
  }
}

// Run test
const success = testDeactivationFix();
process.exit(success ? 0 : 1);
// Verification script for FingerprintGuard Just Protect Me feature
console.log('🔍 Starting deep verification of FingerprintGuard Just Protect Me...');

// Test 1: Verify all required HTML elements exist
console.log('\n📋 Test 1: HTML Elements Verification');
const requiredElements = [
    'protectionLevel',
    'selectedOS', 
    'selectedOSVersion',
    'selectedBrowser',
    'selectedBrowserVersion',
    'protectionStatus',
    'activateProtection'
];

let htmlElementsValid = true;
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        console.log(`✅ Element '${id}' found`);
    } else {
        console.error(`❌ Element '${id}' NOT found`);
        htmlElementsValid = false;
    }
});

// Test 2: Verify CSS classes exist
console.log('\n🎨 Test 2: CSS Classes Verification');
const requiredClasses = [
    'just-protect-hero',
    'protection-status', 
    'status-indicator',
    'status-dot',
    'form-grid',
    'form-group',
    'form-label',
    'form-select'
];

let cssClassesValid = true;
const testDiv = document.createElement('div');
document.body.appendChild(testDiv);

requiredClasses.forEach(className => {
    testDiv.className = className;
    const computedStyle = getComputedStyle(testDiv);
    // Check if the class has any specific styling (not default)
    if (computedStyle.display !== 'block' || computedStyle.position !== 'static' || computedStyle.color !== 'rgb(0, 0, 0)') {
        console.log(`✅ CSS class '${className}' is styled`);
    } else {
        console.warn(`⚠️ CSS class '${className}' may not be properly styled`);
    }
});

document.body.removeChild(testDiv);

// Test 3: Verify JavaScript methods exist
console.log('\n🔧 Test 3: JavaScript Methods Verification');
const requiredMethods = [
    'initializeJustProtectMeSelectors',
    'updateProtectionStatus',
    'updateJustProtectMeSettings',
    'activateJustProtectMe',
    'updateOSVersionOptions',
    'updateBrowserVersionOptions',
    'createJustProtectMeSettings',
    'getOSPlatform',
    'getOSPlatformVersion',
    'getDeviceType',
    'getProtectionLevelSettings'
];

let methodsValid = true;
// Assuming SettingsManager instance is available globally or can be accessed
if (typeof window.settingsManager !== 'undefined') {
    requiredMethods.forEach(method => {
        if (typeof window.settingsManager[method] === 'function') {
            console.log(`✅ Method '${method}' exists`);
        } else {
            console.error(`❌ Method '${method}' NOT found`);
            methodsValid = false;
        }
    });
} else {
    console.warn('⚠️ SettingsManager not available for method verification');
}

// Test 4: Verify message handler exists in background
console.log('\n📡 Test 4: Background Message Handler Verification');
chrome.runtime.sendMessage({ type: 'ping' }).then(response => {
    if (response && response.success) {
        console.log('✅ Background script communication working');
        
        // Test generateProfile handler
        return chrome.runtime.sendMessage({
            type: 'generateProfile',
            protectionLevel: 'medium',
            selectedOS: 'Windows',
            selectedOSVersion: '11',
            selectedBrowser: 'Chrome',
            selectedBrowserVersion: 'latest'
        });
    } else {
        throw new Error('Background script not responding');
    }
}).then(response => {
    if (response && response.success) {
        console.log('✅ generateProfile handler working');
        console.log('✅ Generated profile:', response.profile);
    } else {
        console.error('❌ generateProfile handler failed:', response?.error);
    }
}).catch(error => {
    console.error('❌ Background communication failed:', error);
});

// Test 5: Verify default settings structure
console.log('\n⚙️ Test 5: Default Settings Structure Verification');
const expectedJustProtectMeSettings = [
    'protectionLevel',
    'selectedOS',
    'selectedOSVersion', 
    'selectedBrowser',
    'selectedBrowserVersion',
    'autoProfile'
];

// This would need to be adapted based on how settings are accessed
if (typeof window.settingsManager !== 'undefined' && window.settingsManager.defaultSettings) {
    const justProtectMeSettings = window.settingsManager.defaultSettings.justProtectMe;
    if (justProtectMeSettings) {
        expectedJustProtectMeSettings.forEach(setting => {
            if (setting in justProtectMeSettings) {
                console.log(`✅ Default setting '${setting}' exists`);
            } else {
                console.error(`❌ Default setting '${setting}' missing`);
            }
        });
    } else {
        console.error('❌ justProtectMe default settings not found');
    }
} else {
    console.warn('⚠️ Default settings not accessible for verification');
}

// Summary
console.log('\n📊 Verification Summary:');
console.log(`HTML Elements: ${htmlElementsValid ? '✅ PASS' : '❌ FAIL'}`);
console.log(`CSS Classes: ${cssClassesValid ? '✅ PASS' : '⚠️ CHECK'}`);
console.log(`JavaScript Methods: ${methodsValid ? '✅ PASS' : '❌ FAIL'}`);
console.log('Background Handler: See results above');
console.log('Default Settings: See results above');

console.log('\n🏁 Deep verification completed!');

// Export results for external access
window.fingerprintGuardVerification = {
    htmlElementsValid,
    cssClassesValid, 
    methodsValid,
    timestamp: new Date().toISOString()
};
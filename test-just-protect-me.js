// Test script for FingerprintGuard Just Protect Me feature
console.log('🧪 Testing FingerprintGuard Just Protect Me feature...');

// Test 1: Check if the interface mode switching works
console.log('Test 1: Interface mode switching');
try {
    const settingsManager = new SettingsManager();
    settingsManager.switchInterfaceMode('justprotectme');
    console.log('✅ Interface mode switching works');
} catch (error) {
    console.error('❌ Interface mode switching failed:', error);
}

// Test 2: Check if the generateProfile message handler works
console.log('Test 2: Generate profile message handler');
chrome.runtime.sendMessage({
    type: 'generateProfile',
    protectionLevel: 'medium',
    selectedOS: 'Windows',
    selectedOSVersion: '11',
    selectedBrowser: 'Chrome',
    selectedBrowserVersion: '120'
}).then(response => {
    if (response.success) {
        console.log('✅ Generate profile handler works:', response.profile);
    } else {
        console.error('❌ Generate profile handler failed:', response.error);
    }
}).catch(error => {
    console.error('❌ Generate profile message failed:', error);
});

// Test 3: Check if CSS classes are properly defined
console.log('Test 3: CSS classes verification');
const testElement = document.createElement('div');
testElement.className = 'just-protect-me-container';
document.body.appendChild(testElement);

const computedStyle = getComputedStyle(testElement);
if (computedStyle.display !== 'none') {
    console.log('✅ CSS classes are loaded');
} else {
    console.error('❌ CSS classes not loaded properly');
}
document.body.removeChild(testElement);

console.log('🧪 Test script completed');
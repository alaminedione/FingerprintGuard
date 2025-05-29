/**
 * Advanced WebRTC Protection Module for FingerprintGuard
 * Protects against IP leaks and WebRTC fingerprinting
 * Version: 2.1.0
 */

(() => {
    'use strict';

    // Configuration
    const config = {
        blockIPLeaks: true,
        blockMediaDevices: true,
        spoofICECandidates: true,
        blockDataChannels: false,
        fakeLocalIPs: [
            '192.168.1.100',
            '192.168.0.150', 
            '10.0.0.25',
            '172.16.0.50'
        ],
        fakePublicIPs: [
            '203.0.113.1',
            '198.51.100.42',
            '203.0.113.195'
        ]
    };

    // Store original functions
    const originalRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    const originalEnumerateDevices = navigator.mediaDevices?.enumerateDevices;

    // Utility functions
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateFakeIP(type = 'local') {
        const ips = type === 'local' ? config.fakeLocalIPs : config.fakePublicIPs;
        return getRandomElement(ips);
    }

    function sanitizeSDP(sdp) {
        if (!config.spoofICECandidates) return sdp;

        // Replace real IP addresses in SDP
        let sanitized = sdp;

        // Remove or replace ICE candidates with local IPs
        sanitized = sanitized.replace(/c=IN IP4 (\d+\.){3}\d+/g, () => {
            return `c=IN IP4 ${generateFakeIP('local')}`;
        });

        // Replace candidate lines
        sanitized = sanitized.replace(/a=candidate:\d+ \d+ \w+ \d+ ((\d+\.){3}\d+) \d+/g, (match, ip) => {
            const fakeIP = generateFakeIP(ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.16') ? 'local' : 'public');
            return match.replace(ip, fakeIP);
        });

        // Remove IPv6 candidates entirely
        sanitized = sanitized.replace(/a=candidate:[^\r\n]*::[^\r\n]*/g, '');

        // Remove host candidates that might leak real IP
        sanitized = sanitized.replace(/a=candidate:[^\r\n]*typ host[^\r\n]*/g, '');

        return sanitized;
    }

    // WebRTC PeerConnection Protection
    function protectRTCPeerConnection() {
        if (!originalRTCPeerConnection) return;

        window.RTCPeerConnection = function(configuration, constraints) {
            // Modify ICE servers to prevent STUN/TURN leaks
            if (configuration && configuration.iceServers) {
                configuration.iceServers = configuration.iceServers.filter(server => {
                    return !server.urls || !server.urls.some(url => 
                        url.includes('stun:') || url.includes('turn:')
                    );
                });
            }

            const pc = new originalRTCPeerConnection(configuration, constraints);

            // Override createOffer
            const originalCreateOffer = pc.createOffer.bind(pc);
            pc.createOffer = function(options) {
                return originalCreateOffer(options).then(offer => {
                    offer.sdp = sanitizeSDP(offer.sdp);
                    return offer;
                });
            };

            // Override createAnswer
            const originalCreateAnswer = pc.createAnswer.bind(pc);
            pc.createAnswer = function(options) {
                return originalCreateAnswer(options).then(answer => {
                    answer.sdp = sanitizeSDP(answer.sdp);
                    return answer;
                });
            };

            // Override setLocalDescription
            const originalSetLocalDescription = pc.setLocalDescription.bind(pc);
            pc.setLocalDescription = function(description) {
                if (description && description.sdp) {
                    description.sdp = sanitizeSDP(description.sdp);
                }
                return originalSetLocalDescription(description);
            };

            // Override setRemoteDescription
            const originalSetRemoteDescription = pc.setRemoteDescription.bind(pc);
            pc.setRemoteDescription = function(description) {
                if (description && description.sdp) {
                    description.sdp = sanitizeSDP(description.sdp);
                }
                return originalSetRemoteDescription(description);
            };

            // Override addIceCandidate to filter candidates
            const originalAddIceCandidate = pc.addIceCandidate.bind(pc);
            pc.addIceCandidate = function(candidate) {
                if (config.spoofICECandidates && candidate && candidate.candidate) {
                    // Block host candidates that might leak real IP
                    if (candidate.candidate.includes('typ host')) {
                        return Promise.resolve();
                    }
                    
                    // Replace IP in candidate string
                    const ipRegex = /(\d+\.){3}\d+/g;
                    candidate.candidate = candidate.candidate.replace(ipRegex, () => {
                        return generateFakeIP('local');
                    });
                }
                return originalAddIceCandidate(candidate);
            };

            // Block data channel creation if configured
            if (config.blockDataChannels) {
                const originalCreateDataChannel = pc.createDataChannel.bind(pc);
                pc.createDataChannel = function() {
                    throw new DOMException('Data channels are blocked', 'NotSupportedError');
                };
            }

            // Override onicecandidate to filter outgoing candidates
            let originalOnIceCandidate = null;
            Object.defineProperty(pc, 'onicecandidate', {
                get: function() {
                    return originalOnIceCandidate;
                },
                set: function(handler) {
                    originalOnIceCandidate = function(event) {
                        if (event.candidate && config.spoofICECandidates) {
                            // Block or modify candidates
                            if (event.candidate.candidate.includes('typ host')) {
                                // Block host candidates
                                return;
                            }
                            
                            // Modify candidate IP
                            const ipRegex = /(\d+\.){3}\d+/g;
                            event.candidate.candidate = event.candidate.candidate.replace(ipRegex, () => {
                                return generateFakeIP('local');
                            });
                        }
                        
                        if (handler) handler(event);
                    };
                }
            });

            return pc;
        };

        // Copy static properties
        Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
        Object.defineProperty(window.RTCPeerConnection, 'prototype', {
            value: originalRTCPeerConnection.prototype
        });

        // Copy static methods
        for (let prop in originalRTCPeerConnection) {
            if (originalRTCPeerConnection.hasOwnProperty(prop)) {
                window.RTCPeerConnection[prop] = originalRTCPeerConnection[prop];
            }
        }

        console.log('🛡️ RTCPeerConnection protection activated');
    }

    // Media Devices Protection
    function protectMediaDevices() {
        if (!navigator.mediaDevices) return;

        // Block getUserMedia
        if (config.blockMediaDevices) {
            Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
                value: function(constraints) {
                    return Promise.reject(new DOMException(
                        'Permission denied', 
                        'NotAllowedError'
                    ));
                },
                configurable: true,
                writable: false
            });

            // Block legacy getUserMedia
            if (navigator.getUserMedia) {
                navigator.getUserMedia = function(constraints, success, error) {
                    if (error) {
                        error(new DOMException('Permission denied', 'NotAllowedError'));
                    }
                };
            }

            // Block webkitGetUserMedia
            if (navigator.webkitGetUserMedia) {
                navigator.webkitGetUserMedia = function(constraints, success, error) {
                    if (error) {
                        error(new DOMException('Permission denied', 'NotAllowedError'));
                    }
                };
            }

            // Block mozGetUserMedia
            if (navigator.mozGetUserMedia) {
                navigator.mozGetUserMedia = function(constraints, success, error) {
                    if (error) {
                        error(new DOMException('Permission denied', 'NotAllowedError'));
                    }
                };
            }
        }

        // Limit enumerateDevices to prevent device fingerprinting
        if (originalEnumerateDevices) {
            Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
                value: function() {
                    return Promise.resolve([
                        {
                            deviceId: 'default',
                            kind: 'audioinput',
                            label: '',
                            groupId: 'group1'
                        },
                        {
                            deviceId: 'default',
                            kind: 'audiooutput', 
                            label: '',
                            groupId: 'group2'
                        },
                        {
                            deviceId: 'default',
                            kind: 'videoinput',
                            label: '',
                            groupId: 'group3'
                        }
                    ]);
                },
                configurable: true,
                writable: false
            });
        }

        console.log('🛡️ MediaDevices protection activated');
    }

    // RTCDataChannel Protection
    function protectDataChannels() {
        if (!window.RTCDataChannel) return;

        const originalDataChannel = window.RTCDataChannel;
        
        // Override send method to prevent data leaks
        const originalSend = originalDataChannel.prototype.send;
        originalDataChannel.prototype.send = function(data) {
            if (config.blockDataChannels) {
                throw new DOMException('Data channel communication is blocked', 'InvalidStateError');
            }
            return originalSend.call(this, data);
        };

        console.log('🛡️ DataChannel protection activated');
    }

    // Additional WebRTC API Protection
    function protectAdditionalAPIs() {
        // Block RTCStatsReport which can leak network information
        if (window.RTCStatsReport) {
            const originalEntries = window.RTCStatsReport.prototype.entries;
            window.RTCStatsReport.prototype.entries = function() {
                const entries = originalEntries.call(this);
                const filteredEntries = [];
                
                for (let [key, value] of entries) {
                    // Filter out potentially sensitive stats
                    if (value.type === 'candidate-pair' || 
                        value.type === 'local-candidate' || 
                        value.type === 'remote-candidate') {
                        continue;
                    }
                    filteredEntries.push([key, value]);
                }
                
                return filteredEntries;
            };
        }

        // Block RTCIceGatherer if present (Edge legacy)
        if (window.RTCIceGatherer) {
            window.RTCIceGatherer = function() {
                throw new DOMException('RTCIceGatherer is not supported', 'NotSupportedError');
            };
        }

        // Block RTCIceTransport
        if (window.RTCIceTransport) {
            const originalGetLocalCandidates = window.RTCIceTransport.prototype.getLocalCandidates;
            if (originalGetLocalCandidates) {
                window.RTCIceTransport.prototype.getLocalCandidates = function() {
                    return []; // Return empty array
                };
            }
        }

        console.log('🛡️ Additional WebRTC APIs protection activated');
    }

    // Network Information API Protection (related to WebRTC)
    function protectNetworkInfo() {
        if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
            const fakeConnection = {
                effectiveType: '4g',
                downlink: 2.5,
                rtt: 100,
                saveData: false,
                type: 'wifi'
            };

            Object.defineProperty(navigator, 'connection', {
                value: fakeConnection,
                configurable: true,
                writable: false
            });

            Object.defineProperty(navigator, 'mozConnection', {
                value: fakeConnection,
                configurable: true,
                writable: false
            });

            Object.defineProperty(navigator, 'webkitConnection', {
                value: fakeConnection,
                configurable: true,
                writable: false
            });
        }

        console.log('🛡️ Network Information API protection activated');
    }

    // Main protection function
    function enableWebRTCProtection(options = {}) {
        // Merge options with default config
        Object.assign(config, options);

        try {
            protectRTCPeerConnection();
            protectMediaDevices();
            protectDataChannels();
            protectAdditionalAPIs();
            protectNetworkInfo();

            console.log('🛡️ Complete WebRTC protection suite activated');
            
            // Notify about protection status
            window.dispatchEvent(new CustomEvent('webrtc-protection-enabled', {
                detail: {
                    timestamp: Date.now(),
                    config: config
                }
            }));

            return true;
        } catch (error) {
            console.error('❌ Error enabling WebRTC protection:', error);
            return false;
        }
    }

    // Auto-enable protection
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => enableWebRTCProtection());
    } else {
        enableWebRTCProtection();
    }

    // Export for manual control
    window.WebRTCProtection = {
        enable: enableWebRTCProtection,
        config: config,
        generateFakeIP: generateFakeIP,
        sanitizeSDP: sanitizeSDP
    };

    // Prevent this script from being detected
    Object.defineProperty(window, 'WebRTCProtection', {
        enumerable: false,
        configurable: false
    });

})();
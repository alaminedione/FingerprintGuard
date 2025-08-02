// Protection WebRTC pour FingerprintGuard v2.1.0
/**
 * Empêche les fuites d'IP locale via WebRTC
 * En surchargeant RTCPeerConnection pour filtrer les candidats ICE non publics
 */

(function () {
  'use strict';

  // Sauvegarder la fonction originale
  const OrigPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  if (!OrigPeerConnection) return;

  // Nouveau constructeur
  const NewPeerConnection = function (config) {
    const pc = new OrigPeerConnection(config);

    // Intercepter les candidats ICE
    const origAddIceCandidate = pc.addIceCandidate.bind(pc);
    pc.addIceCandidate = function (candidate, successCallback, errorCallback) {
      const filterCandidate = (cand) => {
        if (!cand.candidate) return cand;

        // Filtrer les candidats non publics (adresses IP privées)
        if (cand.candidate.match(/(192\.168|10\.|172\.1[6-9]|172\.2[0-9]|172\.3[01]|::1|fe80::|127\.|\[fd)/)) {
          console.debug('[FingerprintGuard] Blocking private ICE candidate:', cand.candidate);
          return null;
        }
        return cand;
      };

      // Traiter la nouvelle syntaxe promise
      if (candidate instanceof Promise) {
        return candidate.then(processedCandidate => {
          const filtered = filterCandidate(processedCandidate);
          return filtered
            ? origAddIceCandidate(filtered, successCallback, errorCallback)
            : Promise.resolve();
        });
      }

      const filteredCandidate = filterCandidate(candidate);
      if (!filteredCandidate) {
        const error = new Error('Blocked by FingerprintGuard: Private IP');
        if (errorCallback) errorCallback(error);
        return Promise.reject(error);
      }

      return origAddIceCandidate(filteredCandidate, successCallback, errorCallback);
    };

    return pc;
  };

  // Surcharger RTCPeerConnection
  window.RTCPeerConnection = NewPeerConnection;
  if (window.webkitRTCPeerConnection) {
    window.webkitRTCPeerConnection = NewPeerConnection;
  }

  console.info('[FingerprintGuard] WebRTC protection activée avec succès');
})();

/**
 * Sélectionne un élément aléatoire dans un tableau.
 * @param {Array<*>} arr - Le tableau à partir duquel sélectionner un élément.
 * @returns {*} Un élément aléatoire du tableau.
 */
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Génère un nombre entier aléatoire dans une plage spécifiée (inclusive).
 * @param {number} min - La borne minimale de la plage.
 * @param {number} max - La borne maximale de la plage.
 * @returns {number} Un nombre entier aléatoire entre min et max.
 */
function getRandomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère une chaîne de version de navigateur aléatoire au format "major.minor.0".
 * @param {number} minVersion - La version majeure minimale.
 * @param {number} maxVersion - La version majeure maximale.
 * @returns {string} Une chaîne de version de navigateur.
 */
function generateBrowserVersion(minVersion, maxVersion) {
  const major = getRandomInRange(minVersion, maxVersion);
  const minor = getRandomInRange(0, 99);
  return `${major}.${minor}.0`;
}
/**
 * Utilitaires de gestion du temps
 */

import ms from 'ms';

/**
 * Parse une durée en format humain (ex: "2h", "30m", "1d")
 * Retourne la durée en millisecondes
 */
export function parseDuration(timeString) {
  try {
    const duration = ms(timeString);
    if (!duration || duration < 0) {
      throw new Error('Durée invalide');
    }
    return duration;
  } catch (error) {
    throw new Error(`Format de durée invalide: ${timeString}. Exemples: 30m, 2h, 1d`);
  }
}

/**
 * Formate une durée en millisecondes en texte lisible
 */
export function formatDuration(milliseconds) {
  return ms(milliseconds, { long: true });
}

/**
 * Calcule le timestamp Discord pour affichage relatif
 */
export function getDiscordTimestamp(date, style = 'R') {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `<t:${timestamp}:${style}>`;
}

/**
 * Vérifie si une date est expirée
 */
export function isExpired(timestamp) {
  return Date.now() > timestamp;
}

/**
 * Crée une date à partir d'un nombre de millisecondes dans le futur
 */
export function futureDate(milliseconds) {
  return new Date(Date.now() + milliseconds);
}

export default {
  parseDuration,
  formatDuration,
  getDiscordTimestamp,
  isExpired,
  futureDate
};

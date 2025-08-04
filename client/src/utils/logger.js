// utils/logger.js
// Utilitaire de logging sécurisé

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log sécurisé - ne s'affiche qu'en développement
 * @param {string} level - Niveau de log ('log', 'warn', 'error', 'info')
 * @param {string} message - Message à logger
 * @param {...any} args - Arguments supplémentaires
 */
const secureLog = (level, message, ...args) => {
  if (!isDevelopment) {
    return; // Ne rien logger en production
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'info':
      console.info(prefix, message, ...args);
      break;
    case 'log':
    default:
      // Log supprimé pour la production
      break;
  }
};

/**
 * Logger pour les erreurs
 * @param {string} message - Message d'erreur
 * @param {...any} args - Arguments supplémentaires
 */
export const logError = (message, ...args) => {
  secureLog('error', message, ...args);
};

/**
 * Logger pour les avertissements
 * @param {string} message - Message d'avertissement
 * @param {...any} args - Arguments supplémentaires
 */
export const logWarn = (message, ...args) => {
  secureLog('warn', message, ...args);
};

/**
 * Logger pour les informations
 * @param {string} message - Message d'information
 * @param {...any} args - Arguments supplémentaires
 */
export const logInfo = (message, ...args) => {
  secureLog('info', message, ...args);
};

/**
 * Logger pour les logs généraux
 * @param {string} message - Message à logger
 * @param {...any} args - Arguments supplémentaires
 */
export const logDebug = (message, ...args) => {
  secureLog('log', message, ...args);
};

/**
 * Logger pour les erreurs d'API
 * @param {string} endpoint - Endpoint de l'API
 * @param {Error} error - Erreur à logger
 */
export const logApiError = (endpoint, error) => {
  logError(`API Error [${endpoint}]:`, error.message || error);
};

/**
 * Logger pour les erreurs d'authentification
 * @param {string} action - Action qui a échoué
 * @param {Error} error - Erreur à logger
 */
export const logAuthError = (action, error) => {
  logError(`Auth Error [${action}]:`, error.message || error);
};

/**
 * Logger pour les erreurs de stockage
 * @param {string} operation - Opération qui a échoué
 * @param {Error} error - Erreur à logger
 */
export const logStorageError = (operation, error) => {
  logWarn(`Storage Error [${operation}]:`, error.message || error);
}; 
// utils/validation.js
// Utilitaires de validation renforcée

import { logWarn } from './logger.js';

/**
 * Nettoie et valide une chaîne de caractères
 * @param {string} input - Entrée à valider
 * @param {Object} options - Options de validation
 * @returns {string|null} Chaîne nettoyée ou null si invalide
 */
export const sanitizeString = (input, options = {}) => {
  const {
    minLength = 1,
    maxLength = 1000,
    allowHtml = false,
    pattern = null
  } = options;

  if (!input || typeof input !== 'string') {
    return null;
  }

  // Supprimer les espaces en début et fin
  let cleaned = input.trim();

  // Vérifier la longueur
  if (cleaned.length < minLength || cleaned.length > maxLength) {
    return null;
  }

  // Supprimer les caractères dangereux sauf si HTML autorisé
  if (!allowHtml) {
    cleaned = cleaned
      .replace(/[<>]/g, '') // Supprimer < et >
      .replace(/javascript:/gi, '') // Supprimer javascript:
      .replace(/on\w+=/gi, '') // Supprimer les gestionnaires d'événements
      .replace(/data:/gi, '') // Supprimer data: URLs
  }

  // Vérifier le pattern si fourni
  if (pattern && !pattern.test(cleaned)) {
    return null;
  }

  return cleaned;
};

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} true si l'email est valide
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Pattern email plus strict
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailPattern.test(email) && email.length <= 254;
};

/**
 * Valide un mot de passe selon les critères de sécurité
 * @param {string} password - Mot de passe à valider
 * @returns {Object} Résultat de validation
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Mot de passe requis'] };
  }

  const errors = [];
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };

  if (!checks.length) errors.push('Au moins 8 caractères');
  if (!checks.lowercase) errors.push('Au moins une minuscule');
  if (!checks.uppercase) errors.push('Au moins une majuscule');
  if (!checks.number) errors.push('Au moins un chiffre');
  if (!checks.special) errors.push('Au moins un caractère spécial (@$!%*?&)');

  return {
    isValid: errors.length === 0,
    errors,
    strength: Object.values(checks).filter(Boolean).length
  };
};

/**
 * Valide une URL
 * @param {string} url - URL à valider
 * @param {Array} allowedDomains - Domaines autorisés
 * @returns {boolean} true si l'URL est valide
 */
export const validateUrl = (url, allowedDomains = []) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    
    // Vérifier le protocole
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Vérifier les domaines autorisés si spécifiés
    if (allowedDomains.length > 0) {
      const hostname = urlObj.hostname.toLowerCase();
      return allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    }

    return true;
  } catch (error) {
    logWarn('URL invalide:', url, error);
    return false;
  }
};

/**
 * Valide un nom de fichier
 * @param {string} filename - Nom de fichier à valider
 * @param {Array} allowedExtensions - Extensions autorisées
 * @returns {boolean} true si le nom de fichier est valide
 */
export const validateFilename = (filename, allowedExtensions = []) => {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Vérifier la longueur
  if (filename.length > 255) {
    return false;
  }

  // Vérifier les caractères dangereux
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return false;
  }

  // Vérifier l'extension si spécifiée
  if (allowedExtensions.length > 0) {
    const extension = filename.toLowerCase().split('.').pop();
    return allowedExtensions.includes('.' + extension);
  }

  return true;
};

/**
 * Nettoie un objet de données
 * @param {Object} data - Données à nettoyer
 * @param {Object} schema - Schéma de validation
 * @returns {Object} Données nettoyées
 */
export const sanitizeObject = (data, schema) => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const cleaned = {};
  
  for (const [key, config] of Object.entries(schema)) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      if (config.type === 'string') {
        const sanitized = sanitizeString(value, config.options);
        if (sanitized !== null) {
          cleaned[key] = sanitized;
        }
      } else if (config.type === 'email') {
        if (validateEmail(value)) {
          cleaned[key] = value.toLowerCase().trim();
        }
      } else if (config.type === 'number') {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= (config.min || -Infinity) && num <= (config.max || Infinity)) {
          cleaned[key] = num;
        }
      } else if (config.type === 'boolean') {
        cleaned[key] = Boolean(value);
      }
    }
  }

  return cleaned;
}; 
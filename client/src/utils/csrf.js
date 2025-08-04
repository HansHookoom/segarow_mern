// utils/csrf.js
// Utilitaire pour la gestion des tokens CSRF

import { logWarn, logError } from './logger.js';

// Clé de stockage pour le token CSRF
const CSRF_TOKEN_KEY = 'segarow_csrf_token';

/**
 * Génère un token CSRF aléatoire
 * @returns {string} Token CSRF généré
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Récupère le token CSRF depuis le localStorage
 * @returns {string|null} Token CSRF ou null
 */
export const getCSRFToken = () => {
  try {
    return localStorage.getItem(CSRF_TOKEN_KEY);
  } catch (error) {
    logWarn('Erreur lors de la récupération du token CSRF:', error);
    return null;
  }
};

/**
 * Stocke le token CSRF dans le localStorage
 * @param {string} token - Token CSRF à stocker
 */
export const setCSRFToken = (token) => {
  try {
    if (token && typeof token === 'string') {
      localStorage.setItem(CSRF_TOKEN_KEY, token);
    }
  } catch (error) {
    logError('Erreur lors du stockage du token CSRF:', error);
  }
};

/**
 * Supprime le token CSRF du localStorage
 */
export const clearCSRFToken = () => {
  try {
    localStorage.removeItem(CSRF_TOKEN_KEY);
  } catch (error) {
    logWarn('Erreur lors de la suppression du token CSRF:', error);
  }
};

/**
 * Vérifie si un token CSRF est valide
 * @param {string} token - Token à vérifier
 * @returns {boolean} true si le token est valide
 */
export const validateCSRFToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Vérifier la longueur (64 caractères hexadécimaux)
  if (token.length !== 64) {
    return false;
  }
  
  // Vérifier le format hexadécimal
  return /^[0-9a-f]{64}$/i.test(token);
};

/**
 * Ajoute le header CSRF à une requête
 * @param {Object} headers - Headers existants
 * @returns {Object} Headers avec le token CSRF
 */
export const addCSRFHeader = (headers = {}) => {
  const token = getCSRFToken();
  if (token && validateCSRFToken(token)) {
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
  return headers;
}; 
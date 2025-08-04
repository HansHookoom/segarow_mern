// utils/security.js
// Fonctions utilitaires pour la sécurité des tokens

import { logWarn, logAuthError, logStorageError } from './logger.js';

// Clés sécurisées pour le localStorage
const TOKEN_STORAGE_KEY = 'segarow_token';
const REFRESH_TOKEN_STORAGE_KEY = 'segarow_refresh_token';
const USER_STORAGE_KEY = 'segarow_user';

// Domaines autorisés pour les liens externes
const ALLOWED_EXTERNAL_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'twitch.tv',
  'www.twitch.tv',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'discord.gg',
  'discord.com',
  'discordapp.com',
  'segarow.com',
  'www.segarow.com'
];

/**
 * Vérifie si un token JWT est expiré
 * @param {string} token - Le token JWT à vérifier
 * @returns {boolean} - true si le token est expiré, false sinon
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') {
    return true;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Token invalide
    }

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    
    // Vérification supplémentaire de la structure du payload
    if (!payload || typeof payload.exp !== 'number') {
      return true;
    }
    
    return payload.exp < currentTime;
  } catch (error) {
    logAuthError('token_expiration_check', error);
    return true; // Si on ne peut pas décoder, considérer comme expiré
  }
};

/**
 * Décode le payload d'un token JWT sans vérifier la signature
 * @param {string} token - Le token JWT à décoder
 * @returns {object|null} - Le payload décodé ou null si erreur
 */
export const decodeTokenPayload = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Validation basique du payload
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    
    return payload;
  } catch (error) {
    logAuthError('token_decode', error);
    return null;
  }
};

/**
 * Nettoie les données d'authentification du localStorage
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    logStorageError('clear_auth_data', error);
  }
};

/**
 * Récupère le token depuis le localStorage avec vérification d'expiration
 * @returns {string|null} - Le token valide ou null
 */
export const getValidToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (!token) {
      return null;
    }
    
    if (isTokenExpired(token)) {
      // Ne pas essayer de renouveler ici, laisser le hook useAuth s'en charger
      clearAuthData();
      return null;
    }
    
    return token;
  } catch (error) {
    logStorageError('get_token', error);
    return null;
  }
};

/**
 * Récupère le refresh token depuis le localStorage
 * @returns {string|null} - Le refresh token ou null
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (error) {
    logStorageError('get_refresh_token', error);
    return null;
  }
};

/**
 * Stocke les tokens d'authentification
 * @param {string} accessToken - Le token d'accès
 * @param {string} refreshToken - Le refresh token
 */
export const storeTokens = (accessToken, refreshToken) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  } catch (error) {
    logStorageError('store_tokens', error);
  }
};

/**
 * Renouvelle le token d'accès avec le refresh token
 * @returns {string|null} - Le nouveau token d'accès ou null
 */
export const refreshTokenIfNeeded = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthData();
      return null;
    }

    const apiUrl = process.env.REACT_APP_API_URL;
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      storeTokens(data.accessToken, refreshToken);
      return data.accessToken;
    } else {
      // Refresh token invalide, déconnexion
      clearAuthData();
      return null;
    }
  } catch (error) {
    logAuthError('refresh_token', error);
    clearAuthData();
    return null;
  }
};

/**
 * Récupère les informations utilisateur depuis le token
 * @returns {object|null} - Les informations utilisateur ou null
 */
export const getUserFromToken = () => {
  const token = getValidToken();
  if (!token) return null;
  
  return decodeTokenPayload(token);
};

/**
 * Extrait les données utilisateur depuis un token JWT
 * @param {string} token - Le token JWT
 * @returns {object|null} - Les données utilisateur formatées
 */
export const extractUserDataFromToken = (token) => {
  try {
    const payload = decodeTokenPayload(token);
    if (!payload) return null;
    
    // Validation des champs requis
    if (!payload.userId || !payload.role) {
      return null;
    }
    
    return {
      id: payload.userId,
      role: payload.role
      // email et username ne sont plus dans le token pour la sécurité
    };
  } catch (error) {
    logAuthError('extract_user_data', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {string} requiredRole - Le rôle requis
 * @returns {boolean} - true si l'utilisateur a le rôle requis
 */
export const hasRole = (requiredRole) => {
  if (!requiredRole || typeof requiredRole !== 'string') {
    return false;
  }

  const token = getValidToken();
  if (!token) return false;
  
  const payload = decodeTokenPayload(token);
  return payload?.role === requiredRole;
};

/**
 * Valide une URL externe pour s'assurer qu'elle pointe vers un domaine autorisé
 * @param {string} url - L'URL à valider
 * @returns {boolean} - true si l'URL est autorisée, false sinon
 */
export const validateExternalUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Vérifier si le domaine est dans la liste autorisée
    return ALLOWED_EXTERNAL_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    logWarn('URL invalide:', url, error);
    return false;
  }
};

/**
 * Nettoie et valide une URL externe
 * @param {string} url - L'URL à nettoyer et valider
 * @returns {string|null} - L'URL nettoyée ou null si invalide
 */
export const sanitizeExternalUrl = (url) => {
  if (!validateExternalUrl(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    // Forcer HTTPS pour les domaines externes
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    return urlObj.toString();
  } catch (error) {
    logWarn('Erreur lors du nettoyage de l\'URL:', url, error);
    return null;
  }
}; 
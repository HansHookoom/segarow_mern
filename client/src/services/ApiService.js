// Import des utilitaires de sécurité
import { getValidToken, clearAuthData } from '../utils/security.js';
import { logWarn, logApiError } from '../utils/logger.js';
import { addCSRFHeader } from '../utils/csrf.js';

// Configuration intelligente de l'URL de l'API selon l'environnement
const getApiBaseUrl = () => {
  // Si une variable d'environnement est définie, l'utiliser
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // En production, utiliser window.location.origin (même domaine)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  // En développement, utiliser l'URL par défaut
  // return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  static API_BASE_URL = API_BASE_URL;
  
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Récupérer le token depuis le localStorage
  getAuthToken() {
    return getValidToken();
  }

  // Méthode statique pour récupérer le token (pour ImageService)
  static getAuthToken() {
    return getValidToken();
  }

  // Headers par défaut
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Ajouter le header CSRF pour les requêtes modifiantes
    return addCSRFHeader(headers);
  }

  // Méthode générique pour les requêtes
  async request(endpoint, options = {}) {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Endpoint invalide');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.requireAuth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Vérification de la réponse
      if (!response) {
        throw new Error('Aucune réponse reçue du serveur');
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        logWarn('Erreur lors du parsing de la réponse:', parseError);
        throw new Error('Réponse invalide du serveur');
      }

      if (!response.ok) {
        // Gestion spéciale des erreurs 401 (non autorisé)
        if (response.status === 401) {
          // Essayer de renouveler le token avant de déconnecter
          try {
            const refreshToken = localStorage.getItem('segarow_refresh_token');
            if (refreshToken) {
              const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('segarow_token', refreshData.accessToken);
                
                // Retenter la requête originale avec le nouveau token
                const retryConfig = {
                  ...config,
                  headers: {
                    ...config.headers,
                    'Authorization': `Bearer ${refreshData.accessToken}`
                  }
                };
                
                const retryResponse = await fetch(url, retryConfig);
                const retryData = await retryResponse.json();
                
                if (retryResponse.ok) {
                  return retryData;
                }
              }
            }
          } catch (refreshError) {
            console.warn('Échec du renouvellement du token:', refreshError);
          }
          
          // Si le renouvellement échoue, nettoyer et rediriger
          clearAuthData();
          
          // Rediriger vers la page de connexion si on est sur une page protégée
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?message=session_expired';
          }
        }
        
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      logApiError(endpoint, error);
      throw error;
    }
  }

  // GET
  async get(endpoint, requireAuth = false) {
    return this.request(endpoint, {
      method: 'GET',
      requireAuth,
    });
  }

  // POST
  async post(endpoint, data, requireAuth = false) {
    if (data && typeof data === 'object') {
      return this.request(endpoint, {
        method: 'POST',
        requireAuth,
        body: JSON.stringify(data),
      });
    } else {
      throw new Error('Données invalides pour la requête POST');
    }
  }

  // PUT
  async put(endpoint, data, requireAuth = false) {
    if (data && typeof data === 'object') {
      return this.request(endpoint, {
        method: 'PUT',
        requireAuth,
        body: JSON.stringify(data),
      });
    } else {
      throw new Error('Données invalides pour la requête PUT');
    }
  }

  // DELETE
  async delete(endpoint, requireAuth = false) {
    return this.request(endpoint, {
      method: 'DELETE',
      requireAuth,
    });
  }
}

const apiServiceInstance = new ApiService();

// Exporter l'instance avec les propriétés statiques
apiServiceInstance.API_BASE_URL = API_BASE_URL;
apiServiceInstance.getAuthToken = ApiService.getAuthToken;

export default apiServiceInstance;

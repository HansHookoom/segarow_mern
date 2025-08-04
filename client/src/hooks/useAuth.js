// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { isTokenExpired, clearAuthData, getValidToken, extractUserDataFromToken, storeTokens, getRefreshToken } from '../utils/security.js';
import { logWarn, logAuthError, logStorageError } from '../utils/logger.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Hook personnalisé pour la persistance
  useEffect(() => {
    const savedToken = getValidToken();
    
    if (savedToken) {
      try {
        // Récupérer les infos utilisateur depuis le token
        const userData = extractUserDataFromToken(savedToken);
        
        if (userData) {
          setToken(savedToken);
          // Récupérer les données complètes de l'utilisateur depuis le backend
          fetchUserProfile(savedToken, userData);
        } else {
          clearAuthData();
        }
      } catch (error) {
        logAuthError('initialization', error);
        clearAuthData();
      }
    }
    setLoading(false);
  }, []);

  // Fonction pour récupérer le profil utilisateur complet
  const fetchUserProfile = async (token, basicUserData) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userProfile = await response.json();
        setUser({
          ...basicUserData,
          ...userProfile
        });
      } else {
        // Si la récupération échoue, utiliser les données de base du token
        setUser(basicUserData);
      }
    } catch (error) {
      logAuthError('fetch_profile', error);
      // En cas d'erreur, utiliser les données de base du token
      setUser(basicUserData);
    }
  };

  // Vérification périodique de l'expiration du token
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(token)) {
        // Essayer de renouveler le token avant de déconnecter
        handleTokenRefresh();
      }
    };

    // Vérifier toutes les 30 secondes pour être très réactif avec les tokens de 15min
    const interval = setInterval(checkTokenExpiration, 30 * 1000);
    
    // Vérifier immédiatement au chargement
    checkTokenExpiration();
    
    return () => clearInterval(interval);
  }, [token, t]);

  // Fonction pour renouveler le token
  const handleTokenRefresh = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logout();
        toast.error(t('login.sessionExpired'));
        return;
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
        setToken(data.accessToken);
        toast.success(t('login.tokenRefreshed'));
        
        // Émettre un événement pour réinitialiser le timer d'inactivité
        window.dispatchEvent(new CustomEvent('userActivity'));
      } else {
        logout();
        toast.error(t('login.sessionExpired'));
      }
    } catch (error) {
      logAuthError('token_refresh', error);
      logout();
      toast.error(t('login.sessionExpired'));
    }
  };

  const login = (userData, accessToken, refreshToken) => {
    if (!userData || !accessToken) {
      logAuthError('login_missing_data', new Error('Données utilisateur ou token manquants'));
      return;
    }

    setUser(userData);
    setToken(accessToken);
    // Stocker les tokens
    storeTokens(accessToken, refreshToken);
    
    // Toast de connexion traduite
    toast.success(t('login.welcome', { user: userData.username || userData.email }), {
      duration: 3000,
    });
  };

  const logout = async () => {
    const username = user?.username || user?.email;
    
    // Appeler l'API de déconnexion pour invalider le refresh token
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logAuthError('logout_api', error);
    }

    setUser(null);
    setToken(null);
    clearAuthData();
    
    // Toast de déconnexion traduite
    toast.success(t('login.goodbye', { user: username }), {
      duration: 2000,
    });
  };

  // Vérifications des rôles (CORRIGÉ pour visitor)
  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  const isVisitor = user?.role === 'visitor'; // Nouvel ajout
  const canInteract = isAuthenticated; // Visitor et Admin peuvent interagir
  const canCreatePosts = isAdmin; // Seul admin peut créer
  const canManageComments = isAdmin; // Seul admin peut gérer

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isVisitor, // Nouveau
    canInteract,
    canCreatePosts,
    canManageComments,
    handleTokenRefresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
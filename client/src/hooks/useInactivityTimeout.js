import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const useInactivityTimeout = (timeoutMinutes = 15, t) => {
  const { isAuthenticated, logout } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const warningToastRef = useRef(null);
  
  // Convertir les minutes en millisecondes
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - 1) * 60 * 1000; // Avertissement 1 minute avant (14 minutes)

  // Fonction de déconnexion automatique
  const handleAutoLogout = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // Toast de déconnexion
        toast.error('Session expirée - Déconnexion automatique', {
          duration: 3000,
        });
        
        // Appeler la fonction logout qui invalide proprement les tokens JWT
        await logout();
        
        // Redirection vers login avec message
        const url = new URL('/login', window.location.origin);
        url.searchParams.set('message', 'session_expired');
        window.location.href = url.toString();
      } catch (error) {
        // En cas d'erreur, forcer la déconnexion côté client
        logout();
      }
    }
  }, [isAuthenticated, logout]);

  // Fonction d'avertissement avec toast
  const handleWarning = useCallback(() => {
    if (isAuthenticated) {
      // Supprimer le toast d'avertissement précédent s'il existe
      if (warningToastRef.current) {
        toast.dismiss(warningToastRef.current);
      }
      
      // Nouveau toast d'avertissement avec bouton d'action
      warningToastRef.current = toast(
        (toastObj) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️ {t('inactivity.warning')}</span>
            <button
              onClick={() => {
                toast.dismiss(toastObj.id);
                resetInactivityTimer();
                toast.success(t('inactivity.sessionExtended'));
              }}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              {t('inactivity.continue')}
            </button>
          </div>
        ),
        {
          duration: 60000, // 1 minute
          id: 'inactivity-warning',
          className: 'toast-warning',
        }
      );
    }
  }, [isAuthenticated, t]);

  // Réinitialiser le timer d'inactivité
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    // Nettoyer les timers existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Supprimer le toast d'avertissement s'il existe
    if (warningToastRef.current) {
      toast.dismiss(warningToastRef.current);
      warningToastRef.current = null;
    }

    // Démarrer le timer d'avertissement
    warningTimeoutRef.current = setTimeout(handleWarning, warningMs);
    
    // Démarrer le timer de déconnexion
    timeoutRef.current = setTimeout(handleAutoLogout, timeoutMs);
  }, [isAuthenticated, timeoutMs, warningMs, handleAutoLogout, handleWarning, timeoutMinutes]);

  // Événements à surveiller pour détecter l'activité
  const activityEvents = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'userActivity' // Événement personnalisé émis lors du renouvellement de token
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      // Nettoyer les timers si pas connecté
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      
      // Supprimer le toast d'avertissement
      if (warningToastRef.current) {
        toast.dismiss(warningToastRef.current);
        warningToastRef.current = null;
      }
      return;
    }

    // Démarrer le timer initial
    resetInactivityTimer();

    // Ajouter les écouteurs d'événements
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Nettoyer les écouteurs et timers
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      
      // Supprimer le toast d'avertissement
      if (warningToastRef.current) {
        toast.dismiss(warningToastRef.current);
        warningToastRef.current = null;
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Nettoyer les timers au démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      
      // Supprimer le toast d'avertissement
      if (warningToastRef.current) {
        toast.dismiss(warningToastRef.current);
        warningToastRef.current = null;
      }
    };
  }, []);

  return {
    resetTimer: resetInactivityTimer
  };
};

export default useInactivityTimeout; 
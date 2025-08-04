import { useState, useEffect } from 'react';
import useNetworkStatus from './useNetworkStatus';

const useServerStatus = () => {
  const [nodeServerStatus, setNodeServerStatus] = useState(false);
  const [reactServerStatus, setReactServerStatus] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const isOnline = useNetworkStatus();

  const checkServers = async () => {
    setIsChecking(true);
    
    // Si pas de connexion internet, marquer tous les serveurs comme down
    if (!isOnline) {
      setNodeServerStatus(false);
      setReactServerStatus(false);
      setIsChecking(false);
      // Rediriger vers offline.html
      window.location.href = '/offline.html';
      return;
    }
    
    // Vérifier le serveur Node.js
    let nodeOk = false;
    try {
      const nodeResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      nodeOk = nodeResponse.ok;
    } catch (error) {
      nodeOk = false;
    }

    // Vérifier le serveur React (même origine)
    let reactOk = false;
    try {
      const reactResponse = await fetch('/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      reactOk = reactResponse.ok;
    } catch (error) {
      reactOk = false;
    }

    setNodeServerStatus(nodeOk);
    setReactServerStatus(reactOk);
    setIsChecking(false);

    // Si au moins un serveur est down, rediriger vers offline.html
    if (!nodeOk || !reactOk) {
      window.location.href = '/offline.html';
    }
  };

  useEffect(() => {
    // Vérification initiale
    checkServers();

    // Vérification périodique toutes les 10 secondes
    const interval = setInterval(checkServers, 10000);

    return () => clearInterval(interval);
  }, [isOnline]); // Ajouter isOnline comme dépendance

  return {
    nodeServerStatus,
    reactServerStatus,
    isChecking,
    isOnline,
    totalServers: 2,
    operationalServers: (nodeServerStatus ? 1 : 0) + (reactServerStatus ? 1 : 0)
  };
};

export default useServerStatus; 
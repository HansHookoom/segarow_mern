import React from 'react';
import useNetworkStatus from '../../../hooks/useNetworkStatus';
import useServerStatus from '../../../hooks/useServerStatus';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const isOnline = useNetworkStatus();
  const { nodeServerStatus, reactServerStatus, operationalServers, totalServers } = useServerStatus();

  if (isOnline && operationalServers === totalServers) {
    return null; // Ne pas afficher si tout fonctionne
  }

  return (
    <div className="network-status">
      <div className="network-indicator">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
        <span className="status-text">
          {!isOnline ? 'Hors ligne' : 
           operationalServers === 0 ? 'Serveurs indisponibles' :
           `Serveurs ${operationalServers}/${totalServers} opérationnels`}
        </span>
      </div>
    </div>
  );
};

export default NetworkStatus; 
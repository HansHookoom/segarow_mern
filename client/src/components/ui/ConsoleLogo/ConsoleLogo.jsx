import React, { useState } from 'react';
import ConsoleLogosService from '../../../services/ConsoleLogosService';
import styles from './ConsoleLogo.module.css';

const ConsoleLogo = ({ platform, size = 'small', showText = true, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const logoPath = ConsoleLogosService.getLogoPath(platform);
  
  const handleImageError = (e) => {
    // Si l'image ne se charge pas, passer en mode texte uniquement
    setImageError(true);
  };

  return (
    <div className={`${styles.consoleLogo} ${styles[size]} ${className}`}>
      {!imageError && (
        <img 
          src={logoPath} 
          alt={`Logo ${platform}`}
          className={styles.logoImage}
          onError={handleImageError}
        />
      )}
      {showText && <span className={styles.platformText}>{platform}</span>}
    </div>
  );
};

export default ConsoleLogo; 
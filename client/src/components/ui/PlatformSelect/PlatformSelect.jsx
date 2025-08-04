import React from 'react';
import ReviewService from '../../../services/ReviewService';
import ConsoleLogosService from '../../../services/ConsoleLogosService';
import styles from './PlatformSelect.module.css';

const PlatformSelect = ({ value, onChange, disabled, name, id, className = '' }) => {
  const platforms = ReviewService.getPlatforms();

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`${styles.platformSelect} ${className}`}
    >
      <option value="">Sélectionner une plateforme...</option>
      {Object.entries(platforms).map(([brand, platformList]) => (
        <optgroup key={brand} label={brand}>
          {platformList.map(platform => (
            <option 
              key={platform.value} 
              value={platform.value}
              className={styles.platformOption}
            >
              {platform.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
};

export default PlatformSelect; 
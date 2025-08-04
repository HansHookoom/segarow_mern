import { useState, useEffect } from 'react';
import { logWarn, logStorageError } from '../utils/logger.js';

export const useLocalStorage = (key, initialValue) => {
  // Validation de la clé
  if (!key || typeof key !== 'string') {
    throw new Error('useLocalStorage: key must be a non-empty string');
  }

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      
      const parsed = JSON.parse(item);
      // Validation basique des données
      if (parsed === null || parsed === undefined) {
        return initialValue;
      }
      
      return parsed;
    } catch (error) {
      // En cas d'erreur, nettoyer la donnée corrompue et retourner la valeur initiale
      try {
        window.localStorage.removeItem(key);
      } catch (cleanupError) {
        // Ignorer les erreurs de nettoyage
      }
      
      logStorageError(`read_${key}`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Validation de la valeur avant stockage
      if (valueToStore === undefined) {
        throw new Error('Cannot store undefined value');
      }
      
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logStorageError(`write_${key}`, error);
      // Ne pas mettre à jour l'état en cas d'erreur
    }
  };

  return [storedValue, setValue];
};
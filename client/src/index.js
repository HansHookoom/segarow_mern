import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Enregistrement du Service Worker pour le mode hors ligne
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service Worker enregistré avec succès
      })
      .catch((error) => {
        // Échec de l'enregistrement du Service Worker
      });
  });
}

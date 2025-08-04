// utils/csp.js
// Gestion dynamique de la Content Security Policy

/**
 * Génère une CSP adaptée à l'environnement
 * @returns {string} Directive CSP
 */
export const generateCSP = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const apiUrl = process.env.REACT_APP_API_URL;
  
  // Sources de connexion autorisées
  const connectSources = ["'self'", "https:"];
  
  // En développement, autoriser localhost
  if (isDevelopment && typeof window !== 'undefined') {
    connectSources.push("http://localhost:5000", "http://127.0.0.1:5000");
  }
  
  // Si une URL d'API est configurée, l'ajouter
  if (apiUrl) {
    connectSources.push(apiUrl);
  }
  
  // Sources d'images autorisées
  const imgSources = ["'self'", "data:", "https:"];
  if (isDevelopment && typeof window !== 'undefined') {
    imgSources.push("http://localhost:5000", "http://127.0.0.1:5000");
  }
  if (apiUrl) {
    imgSources.push(apiUrl);
  }
  
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src ${imgSources.join(' ')};
    connect-src ${connectSources.join(' ')};
    font-src 'self';
    object-src 'none';
    media-src 'self';
    frame-src 'none';
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Applique la CSP dynamiquement
 */
export const applyDynamicCSP = () => {
  if (typeof window === 'undefined') return;
  
  const csp = generateCSP();
  const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (meta) {
    meta.setAttribute('content', csp);
    // CSP appliquée
  } else {
    const newMeta = document.createElement('meta');
    newMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    newMeta.setAttribute('content', csp);
    document.head.appendChild(newMeta);
    // CSP créée et appliquée
  }
};

/**
 * Applique la CSP immédiatement si le DOM est prêt
 */
export const applyCSPImmediately = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDynamicCSP);
  } else {
    applyDynamicCSP();
  }
}; 
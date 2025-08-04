import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import config from '../config/env.js';

// Middleware pour prévenir les injections NoSQL
export const preventNoSQLInjection = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Échapper les caractères spéciaux MongoDB
        sanitized[key] = value.replace(/[\$\.]/g, '\\$&');
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  // Sanitizer les paramètres de requête
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Middleware pour prévenir les attaques DoS
export const preventDoS = (req, res, next) => {
  // Vérifier la taille du payload
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = config.MAX_FILE_SIZE;
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Payload trop volumineux',
      maxSize: maxSize,
      receivedSize: contentLength
    });
  }

  // Vérifier le type de contenu pour les requêtes POST/PUT
  if ((req.method === 'POST' || req.method === 'PUT') && req.headers['content-type']) {
    const contentType = req.headers['content-type'].toLowerCase();
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Type de contenu non supporté',
        allowedTypes: ['application/json', 'multipart/form-data']
      });
    }
  }

  next();
};

// Middleware pour prévenir l'énumération d'utilisateurs
export const preventEnumeration = (req, res, next) => {
  // Intercepter les réponses d'authentification pour masquer les informations sensibles
  const originalJson = res.json;
  
  res.json = function(data) {
    // Masquer les détails spécifiques dans les erreurs d'authentification
    if (data && data.error && req.path.includes('/auth')) {
      if (data.error.includes('utilisateur') || data.error.includes('email')) {
        data.error = 'Identifiants invalides';
      }
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// Middleware pour les en-têtes de sécurité
export const securityHeaders = (req, res, next) => {
  // En-têtes de sécurité supplémentaires
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // En-tête personnalisé pour identifier le serveur
  res.setHeader('X-Server', 'Segarow-API');
  
  next();
};

// Rate limiter spécifique pour l'authentification
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiter pour les uploads
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 uploads par heure
  message: { error: 'Trop d\'uploads. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Slow down pour les requêtes répétées
export const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Commencer à ralentir après 100 requêtes
  delayMs: (hits) => hits * 100, // Augmenter le délai de 100ms par requête
  maxDelayMs: 2000, // Délai maximum de 2 secondes
  skipSuccessfulRequests: true
});

// Middleware pour valider les tokens JWT
export const validateJWT = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  // Validation basique du format JWT
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  if (!jwtRegex.test(token)) {
    return res.status(401).json({ error: 'Format de token invalide' });
  }

  next();
};

// Middleware pour logger les tentatives d'accès suspectes
export const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS basique
    /union\s+select/i, // SQL injection basique
    /javascript:/i, // Protocole javascript
    /data:text\/html/i // Data URI HTML
  ];

  const userAgent = req.headers['user-agent'] || '';
  const url = req.url;
  const method = req.method;

  // Vérifier les patterns suspects
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    console.warn(`⚠️ Activité suspecte détectée: ${method} ${url} - UA: ${userAgent}`);
    // Ici vous pourriez logger dans une base de données ou envoyer une alerte
  }

  next();
}; 
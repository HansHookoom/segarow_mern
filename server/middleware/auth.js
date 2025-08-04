import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const JWT_SECRET = config.JWT_SECRET;

// Middleware pour vérifier le token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Normaliser les propriétés pour être cohérent avec le reste de l'application
    req.user = {
      _id: decoded.userId, // userId du token devient _id
      userId: decoded.userId, // Garder aussi userId pour compatibilité
      role: decoded.role,
      ...decoded // Garder toutes les autres propriétés
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Middleware d'authentification optionnel
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Normaliser les propriétés pour être cohérent avec le reste de l'application
    req.user = {
      _id: decoded.userId, // userId du token devient _id
      userId: decoded.userId, // Garder aussi userId pour compatibilité
      role: decoded.role,
      ...decoded // Garder toutes les autres propriétés
    };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé - Droits administrateur requis' });
  }
  
  next();
};

export {
  auth,
  optionalAuth,
  requireAdmin
}; 
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration par défaut
const config = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  
  // Base de données MongoDB
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  
  // Email (pour la réinitialisation de mot de passe)
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
  
  // Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    
  // Nettoyage automatique
  CLEANUP_INTERVAL: parseInt(process.env.CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000, // 24h
  INACTIVE_ACCOUNT_DAYS: parseInt(process.env.INACTIVE_ACCOUNT_DAYS) || 365, // 12 mois
  CLEANUP_RUN_ON_START: process.env.CLEANUP_RUN_ON_START === 'false', // Exécuter au démarrage
};

export default config; 
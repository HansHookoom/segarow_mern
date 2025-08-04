import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Charger et valider les variables d'environnement
import config from './config/env.js';

// Importation de la configuration de base de données
import { connectDB } from './config/database.js';



// Importation des middlewares de sécurité
import { 
  preventNoSQLInjection, 
  preventDoS, 
  preventEnumeration, 
  securityHeaders 
} from './middleware/security.js';

// Importation des routes
import authRoutes from './routes/authRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import translationRoutes from './routes/translationRoutes.js';

// Configuration validée
const JWT_SECRET = config.JWT_SECRET;

const app = express();

// Middleware de sécurité Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:", config.REACT_APP_API_URL || config.FRONTEND_URL],
      connectSrc: ["'self'", config.REACT_APP_API_URL || config.FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuration CORS sécurisée
const getCorsOrigins = () => {
  if (config.NODE_ENV === 'production') {
    return [config.FRONTEND_URL, 'https://segarow.com'];
  }
  
  // En développement, utiliser les variables d'environnement
  const devOrigins = [];
  if (config.FRONTEND_URL) {
    devOrigins.push(config.FRONTEND_URL);
  }
  if (config.REACT_APP_API_URL) {
    devOrigins.push(config.REACT_APP_API_URL);
  }
  
  if (devOrigins.length === 0) {
    throw new Error('Configuration CORS manquante. Contactez l\'administrateur.');
  }
  
  return devOrigins;
};

const corsOptions = {
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 heures
};

// Rate limiting global - adapté selon l'environnement
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'production' ? 5000 : 100000, // très permissif pour gérer un trafic important
  message: { error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
      retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes en secondes
    });
  }
});

// Slow down pour les requêtes répétées - adapté selon l'environnement
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: config.NODE_ENV === 'production' ? 2000 : 50000, // très permissif
  delayMs: () => config.NODE_ENV === 'production' ? 50 : 1, // délai minimal
  validate: { delayMs: false }, // désactiver l'avertissement
  skipSuccessfulRequests: true // ne pas ralentir les requêtes réussies
});

// Middleware globaux
app.use(cors(corsOptions));

// Rate limiting activé en production
if (config.NODE_ENV === 'production') {
  app.use(limiter);
  app.use(speedLimiter);
}

// Middlewares de sécurité
app.use(securityHeaders);
app.use(preventNoSQLInjection);
app.use(preventDoS);
app.use(preventEnumeration);

app.use(express.json({ limit: '10mb' })); // Limite la taille des requêtes

// Route de santé (health check) pour le monitoring
app.get('/api/health', async (req, res) => {
  try {
    // Vérifier le statut de la connexion à la base de données sans la reconnecter
    const dbStatus = mongoose.connection.readyState === 1;
    
    // Toujours retourner 200 si le serveur Node est fonctionnel
    // La base de données peut être temporairement indisponible
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: dbStatus ? 'connected' : 'disconnected',
      version: '1.0.0'
    });
  } catch (error) {
    // Même en cas d'erreur, retourner 200 pour indiquer que le serveur Node fonctionne
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: 'disconnected',
      version: '1.0.0',
      note: 'Server operational but database may be temporarily unavailable'
    });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/translate', translationRoutes);

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  // Message d'erreur générique en production
  const errorMessage = config.NODE_ENV === 'production' 
    ? 'Erreur interne du serveur' 
    : err.message || 'Erreur interne du serveur';
  
  res.status(err.status || 500).json({
    message: errorMessage,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    error: 'Endpoint non disponible'
  });
});

export default app; 
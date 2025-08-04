import app from './app.js';
import User from './models/User.js';
import { connectDB } from './config/database.js';
import autoCleanupService from './services/autoCleanupService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attendre que la connexion à la base de données soit établie
    await connectDB();
    
    app.listen(PORT, async () => {
      // Serveur démarré sur le port ${PORT}
      
      // Démarrer le service de nettoyage automatique après la connexion à la DB
      autoCleanupService.start();
      
      // Vérifier s'il y a des admins
      try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
          // Aucun administrateur trouvé dans la base de données
        }
      } catch (error) {
        // Erreur lors de la vérification des admins
      }
    });
  } catch (error) {
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.exit(1);
});

startServer(); 
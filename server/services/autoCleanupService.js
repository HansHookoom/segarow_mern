import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Log from '../models/Log.js';
import config from '../config/env.js';
import mongoLogService from './mongoLogService.js';

class AutoCleanupService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
    this.isPerformingCleanup = false;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Exécuter immédiatement seulement si configuré
    if (config.CLEANUP_RUN_ON_START) {
      this.performCleanup();
    }

    // Programmer les nettoyages suivants
    this.interval = setInterval(() => {
      this.performCleanup();
    }, config.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  async performCleanup() {
    // Protection contre les exécutions multiples
    if (this.isPerformingCleanup) {
      return;
    }

    this.isPerformingCleanup = true;

    try {
      const startTime = Date.now();
      let deletedAccountsCount = 0;
      let deletedCommentsCount = 0;
      let deletedLikesCount = 0;

      // Nettoyer les comptes inactifs (12 mois)
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(inactiveThreshold.getDate() - config.INACTIVE_ACCOUNT_DAYS);

      const inactiveUsers = await User.find({
        lastLogin: { $lt: inactiveThreshold },
        role: { $ne: 'admin' }, // Ne pas supprimer les admins
        isActive: true
      });

      for (const user of inactiveUsers) {
        try {

          // 1. Supprimer tous les likes de cet utilisateur
          const deletedLikes = await Like.deleteMany({ user: user._id });
          deletedLikesCount += deletedLikes.deletedCount;

          // 2. Traiter les commentaires créés par cet utilisateur
          const userComments = await Comment.find({ author: user._id });
          if (userComments.length > 0) {
            for (const comment of userComments) {
              // Supprimer les likes sur ce commentaire
              await Like.deleteMany({ 
                contentType: 'comment', 
                contentId: comment._id 
              });

              // Vérifier s'il peut être supprimé définitivement
              const canHardDelete = await comment.canBeHardDeleted();
              
              if (canHardDelete) {
                await Comment.findByIdAndDelete(comment._id);
                deletedCommentsCount++;
              } else {
                // Soft delete - il y a des réponses
                await comment.softDelete();
              }
            }
          }

          // 3. Supprimer l'utilisateur
          await User.findByIdAndDelete(user._id);
          deletedAccountsCount++;

          // Logger la suppression
          await mongoLogService.info('Compte inactif supprimé automatiquement', {
            userId: user._id,
            email: user.email,
            username: user.username,
            lastLogin: user.lastLogin,
            reason: `Inactivité prolongée (${config.INACTIVE_ACCOUNT_DAYS} jours)`,
            deletedData: {
              comments: userComments.length,
              likes: deletedLikes.deletedCount
            }
          });

        } catch (error) {
          // Erreur lors de la suppression de l'utilisateur
        }
      }

      // Nettoyer les anciens logs (garder seulement les 90 derniers jours)
      const logThreshold = new Date();
      logThreshold.setDate(logThreshold.getDate() - 90);

      const deletedLogs = await Log.deleteMany({
        createdAt: { $lt: logThreshold },
        level: { $in: ['debug', 'info'] } // Garder les erreurs et warnings
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Logger le nettoyage
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const hour = String(now.getHours()).padStart(2, '0');
      
      await Log.create({
        level: 'INFO',
        message: `Nettoyage automatique effectué: ${deletedAccountsCount} comptes supprimés, ${deletedCommentsCount} commentaires, ${deletedLikesCount} likes, ${deletedLogs.deletedCount} logs`,
        actionType: 'cleanup',
        date,
        hour,
        data: {
          deletedAccounts: deletedAccountsCount,
          deletedComments: deletedCommentsCount,
          deletedLikes: deletedLikesCount,
          deletedLogs: deletedLogs.deletedCount,
          duration: duration
        }
      });

    } catch (error) {
      // Logger l'erreur
      try {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const hour = String(now.getHours()).padStart(2, '0');
        
        await Log.create({
          level: 'ERROR',
          message: `Erreur lors du nettoyage automatique: ${error.message}`,
          actionType: 'cleanup',
          date,
          hour,
          data: {
            error: error.stack,
            errorMessage: error.message
          }
        });
      } catch (logError) {
        // Impossible de logger l'erreur de nettoyage
      }
    } finally {
      this.isPerformingCleanup = false; // Débloquer après la fin du nettoyage
    }
  }

  // Méthode pour forcer un nettoyage manuel
  async forceCleanup() {
    await this.performCleanup();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: config.CLEANUP_INTERVAL,
      nextCleanup: this.interval ? Date.now() + config.CLEANUP_INTERVAL : null
    };
  }
}

// Export d'une instance singleton
const autoCleanupService = new AutoCleanupService();
export default autoCleanupService; 
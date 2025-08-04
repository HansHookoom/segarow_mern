import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Log from '../models/Log.js';
import mongoLogService from '../services/mongoLogService.js';

// Fonction pour nettoyer les comptes inactifs
async function cleanupInactiveAccounts() {
  try {
    console.log('🧹 Début du nettoyage des comptes inactifs...');
    
    // Connexion à MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    const cutoffDate = new Date(Date.now() - config.INACTIVE_ACCOUNT_DAYS * 24 * 60 * 60 * 1000);
    
    // Trouver les utilisateurs inactifs (non admin)
    const inactiveUsers = await User.find({
      lastLogin: { $lt: cutoffDate },
      role: { $ne: 'admin' },
      isActive: true
    });
    
    console.log(`📊 ${inactiveUsers.length} utilisateurs inactifs trouvés (dernière connexion > ${config.INACTIVE_ACCOUNT_DAYS} jours)`);
    
    let deletedAccountsCount = 0;
    let deletedArticlesCount = 0;
    let deletedReviewsCount = 0;
    let deletedCommentsCount = 0;
    let deletedLikesCount = 0;
    
    for (const user of inactiveUsers) {
      try {
        console.log(`🗑️ Suppression du compte inactif: ${user.email} (dernière connexion: ${user.lastLogin})`);

        // 1. Supprimer tous les likes de cet utilisateur
        const deletedLikes = await Like.deleteMany({ user: user._id });
        deletedLikesCount += deletedLikes.deletedCount;

        // 2. Supprimer les articles créés par cet utilisateur
        const userArticles = await Article.find({ author: user._id });
        if (userArticles.length > 0) {
          // Supprimer les likes sur ces articles
          await Like.deleteMany({ 
            contentType: 'article', 
            contentId: { $in: userArticles.map(a => a._id) } 
          });
          await Article.deleteMany({ author: user._id });
          deletedArticlesCount += userArticles.length;
        }

        // 3. Supprimer les reviews créées par cet utilisateur
        const userReviews = await Review.find({ author: user._id });
        if (userReviews.length > 0) {
          // Supprimer les likes sur ces reviews
          await Like.deleteMany({ 
            contentType: 'review', 
            contentId: { $in: userReviews.map(r => r._id) } 
          });
          await Review.deleteMany({ author: user._id });
          deletedReviewsCount += userReviews.length;
        }

        // 4. Traiter les commentaires créés par cet utilisateur
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

        // 5. Supprimer l'utilisateur
        await User.findByIdAndDelete(user._id);
        deletedAccountsCount++;
        
        // Logger la suppression
        await mongoLogService.info('Compte inactif supprimé manuellement', {
          userId: user._id,
          email: user.email,
          username: user.username,
          lastLogin: user.lastLogin,
          reason: `Inactivité prolongée (${config.INACTIVE_ACCOUNT_DAYS} jours)`,
          deletedData: {
            articles: userArticles.length,
            reviews: userReviews.length,
            comments: userComments.length,
            likes: deletedLikes.deletedCount
          }
        });
        
        console.log(`  ✅ Supprimé: ${user.email} avec ${userArticles.length} articles, ${userReviews.length} reviews, ${userComments.length} commentaires, ${deletedLikes.deletedCount} likes`);
        
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${user.email}:`, error.message);
      }
    }
    
    // Nettoyer les anciens logs (garder seulement les 90 derniers jours)
    const logCutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deletedLogs = await Log.deleteMany({
      createdAt: { $lt: logCutoffDate },
      level: { $in: ['debug', 'info'] } // Garder les erreurs et warnings
    });
    
    console.log(`🗑️ ${deletedLogs.deletedCount} anciens logs supprimés`);
    
    // Logger le nettoyage
    await mongoLogService.info('Nettoyage manuel terminé', {
      deletedAccounts: deletedAccountsCount,
      deletedArticles: deletedArticlesCount,
      deletedReviews: deletedReviewsCount,
      deletedComments: deletedCommentsCount,
      deletedLikes: deletedLikesCount,
      deletedLogs: deletedLogs.deletedCount,
      totalInactiveUsers: inactiveUsers.length
    });
    
    console.log(`✅ Nettoyage terminé:`);
    console.log(`   - ${deletedAccountsCount} comptes supprimés`);
    console.log(`   - ${deletedArticlesCount} articles supprimés`);
    console.log(`   - ${deletedReviewsCount} reviews supprimées`);
    console.log(`   - ${deletedCommentsCount} commentaires supprimés`);
    console.log(`   - ${deletedLikesCount} likes supprimés`);
    console.log(`   - ${deletedLogs.deletedCount} logs supprimés`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    
    await mongoLogService.error('Erreur nettoyage manuel', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le nettoyage si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupInactiveAccounts();
}

export default cleanupInactiveAccounts; 
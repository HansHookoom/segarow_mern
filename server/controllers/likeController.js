import Like from '../models/Like.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import mongoLogService from '../services/mongoLogService.js';

// Liker/Unliker un contenu (Articles ou Reviews ou Comments)
const toggleLike = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user._id;

    // Valider le type de contenu
    if (!['article', 'review', 'comment'].includes(contentType)) {
      return res.status(400).json({ message: 'Type de contenu invalide' });
    }

    // Vérifier si le contenu existe
    const Model = contentType === 'article' ? Article : contentType === 'review' ? Review : Comment;
    const content = await Model.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: `${contentType} non trouvé` });
    }

    // Vérifier si l'utilisateur a déjà liké ce contenu
    const existingLike = await Like.findOne({ 
      user: userId, 
      contentId, 
      contentType 
    });

    if (existingLike) {
      // Unlike - Supprimer le like
      await Like.findByIdAndDelete(existingLike._id);
      
      // Décrémenter le compteur
      const updateField = contentType === 'comment' ? 'likesCount' : 'likeCount';
      await Model.findByIdAndUpdate(contentId, {
        $inc: { [updateField]: -1 }
      });

      // Récupérer le contenu mis à jour
      const updatedContent = await Model.findById(contentId);
      const likeCount = contentType === 'comment' ? updatedContent.likesCount : updatedContent.likeCount;

      // Logger le dislike
      await mongoLogService.info(
        `Dislike sur ${contentType}`,
        { 
          userId: req.user._id,
          contentType,
          contentId,
          contentTitle: content.title || content.content?.substring(0, 50) || 'N/A',
          likeCount: likeCount || 0,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        req.user._id,
        req.user.email,
        'user_action'
      );

      return res.json({
        message: 'Like supprimé',
        liked: false,
        likeCount: likeCount || 0
      });
    } else {
      // Like - Créer un nouveau like
      const newLike = new Like({
        user: userId,
        contentId,
        contentType
      });
      await newLike.save();

      // Incrémenter le compteur
      const updateField = contentType === 'comment' ? 'likesCount' : 'likeCount';
      await Model.findByIdAndUpdate(contentId, {
        $inc: { [updateField]: 1 }
      });

      // Récupérer le contenu mis à jour
      const updatedContent = await Model.findById(contentId);
      const likeCount = contentType === 'comment' ? updatedContent.likesCount : updatedContent.likeCount;

      // Logger le like
      await mongoLogService.info(
        `Like sur ${contentType}`,
        { 
          userId: req.user._id,
          contentType,
          contentId,
          contentTitle: content.title || content.content?.substring(0, 50) || 'N/A',
          likeCount: likeCount || 0,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        req.user._id,
        req.user.email,
        'user_action'
      );

      return res.json({
        message: 'Like ajouté',
        liked: true,
        likeCount: likeCount || 0
      });
    }

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vous avez déjà liké ce contenu' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir l'état de like d'un contenu pour un utilisateur
const getLikeStatus = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user._id;

    // Valider le type de contenu
    if (!['article', 'review', 'comment'].includes(contentType)) {
      return res.status(400).json({ message: 'Type de contenu invalide' });
    }

    // Vérifier si l'utilisateur a liké ce contenu
    const liked = await Like.isLikedByUser(contentId, contentType, userId);
    
    // Obtenir le nombre total de likes
    const likeCount = await Like.getLikeCount(contentId, contentType);

    res.json({
      liked,
      likeCount
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir la liste des likes pour un contenu (Admin)
const getContentLikes = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;

    // Valider le type de contenu
    if (!['article', 'review', 'comment'].includes(contentType)) {
      return res.status(400).json({ message: 'Type de contenu invalide' });
    }

    const likes = await Like.getLikesForContent(contentId, contentType);

    res.json({
      contentType,
      contentId,
      likeCount: likes.length,
      likes: likes.map(like => ({
        id: like._id,
        user: {
          id: like.user._id,
          username: like.user.username,
          email: like.user.email
        },
        likedAt: like.createdAt
      }))
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques générales des likes (Admin)
const getLikesStats = async (req, res) => {
  try {
    // Calculer les statistiques à partir des vrais comptages (plus fiable)
    const totalArticleLikes = await Like.countDocuments({ contentType: 'article' });
    const totalReviewLikes = await Like.countDocuments({ contentType: 'review' });
    const totalCommentLikes = await Like.countDocuments({ contentType: 'comment' });
    const totalLikes = totalArticleLikes + totalReviewLikes + totalCommentLikes;

    // Top 5 contenus les plus likés (sans synchronisation automatique pour éviter les erreurs)
    const topArticles = await Article.find({})
      .sort({ likeCount: -1 })
      .limit(5)
      .select('title slug likeCount author')
      .populate('author', 'username');

    const topReviews = await Review.find({})
      .sort({ likeCount: -1 })
      .limit(5)
      .select('title gameTitle slug likeCount author')
      .populate('author', 'username');

    // Top commentaires les plus likés
    const topComments = await Comment.find({ isDeleted: false })
      .sort({ likesCount: -1 })
      .limit(5)
      .select('content likesCount article author')
      .populate('author', 'username')
      .populate('article', 'title');



    // Utilisateurs les plus actifs (qui likent le plus)
    const topLikers = await Like.aggregate([
      {
        $group: {
          _id: '$user',
          likesCount: { $sum: 1 }
        }
      },
      {
        $sort: { likesCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          email: '$user.email',
          likesCount: 1
        }
      }
    ]);



    const response = {
      stats: {
        totalLikes,
        totalArticleLikes,
        totalReviewLikes,
        totalCommentLikes
      },
      topContent: {
        articles: topArticles,
        reviews: topReviews,
        comments: topComments
      },
      topLikers
    };


    res.json(response);

  } catch (error) {
    console.error('❌ Erreur dans getLikesStats:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Diagnostic des likes (Admin)
const getLikesDiagnostic = async (req, res) => {
  try {
    // Compter les vrais likes dans la collection Like
    const realCounts = {
      articles: await Like.countDocuments({ contentType: 'article' }),
      reviews: await Like.countDocuments({ contentType: 'review' }),
      comments: await Like.countDocuments({ contentType: 'comment' }),
      total: await Like.countDocuments({})
    };

    // Compter les likes stockés dans les modèles
    const storedCounts = {
      articles: await Article.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$likeCount', 0] } } } }
      ]).then(result => result[0]?.total || 0),
      reviews: await Review.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$likeCount', 0] } } } }
      ]).then(result => result[0]?.total || 0),
      comments: await Comment.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$likesCount', 0] } } } }
      ]).then(result => result[0]?.total || 0)
    };
    storedCounts.total = storedCounts.articles + storedCounts.reviews + storedCounts.comments;

    // Trouver les incohérences
    const inconsistencies = {
      articles: [],
      reviews: [],
      comments: [],
      totalInconsistent: 0
    };

    // Vérifier les articles
    const articles = await Article.find({});
    for (const article of articles) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'article', 
        contentId: article._id 
      });
      if (realLikes !== (article.likeCount || 0)) {
        inconsistencies.articles.push({
          id: article._id,
          title: article.title,
          stored: article.likeCount || 0,
          real: realLikes
        });
        inconsistencies.totalInconsistent++;
      }
    }

    // Vérifier les reviews
    const reviews = await Review.find({});
    for (const review of reviews) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'review', 
        contentId: review._id 
      });
      if (realLikes !== (review.likeCount || 0)) {
        inconsistencies.reviews.push({
          id: review._id,
          title: review.title || review.gameTitle,
          stored: review.likeCount || 0,
          real: realLikes
        });
        inconsistencies.totalInconsistent++;
      }
    }

    // Vérifier les commentaires
    const comments = await Comment.find({ isDeleted: false });
    for (const comment of comments) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'comment', 
        contentId: comment._id 
      });
      if (realLikes !== (comment.likesCount || 0)) {
        inconsistencies.comments.push({
          id: comment._id,
          content: comment.content?.substring(0, 50),
          stored: comment.likesCount || 0,
          real: realLikes
        });
        inconsistencies.totalInconsistent++;
      }
    }

    // Récupérer tous les IDs de contenus existants
    const articleIds = articles.map(a => a._id);
    const reviewIds = reviews.map(r => r._id);
    const commentIds = comments.map(c => c._id);

    // Compter les likes orphelins
    const orphanedLikes = await Like.countDocuments({
      $or: [
        { contentType: 'article', contentId: { $nin: articleIds } },
        { contentType: 'review', contentId: { $nin: reviewIds } },
        { contentType: 'comment', contentId: { $nin: commentIds } }
      ]
    });

    // Compter les likes de contenus supprimés
    const deletedContentLikes = await Like.countDocuments({
      $or: [
        { contentType: 'article', contentId: { $in: articles.filter(a => a.isDeleted).map(a => a._id) } },
        { contentType: 'review', contentId: { $in: reviews.filter(r => r.isDeleted).map(r => r._id) } },
        { contentType: 'comment', contentId: { $in: comments.filter(c => c.isDeleted).map(c => c._id) } }
      ]
    });

    const totalProblematicLikes = orphanedLikes + deletedContentLikes;

    res.json({
      realCounts,
      storedCounts,
      inconsistencies,
      orphanedLikes,
      deletedContentLikes,
      totalProblematicLikes,
      summary: {
        needsSync: inconsistencies.totalInconsistent > 0,
        needsCleanup: totalProblematicLikes > 0
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Synchroniser les compteurs de likes (Admin)
const syncLikeCounters = async (req, res) => {
  try {
    let fixed = {
      articles: 0,
      reviews: 0,
      comments: 0,
      total: 0
    };

    // Synchroniser les articles
    const articles = await Article.find({});
    for (const article of articles) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'article', 
        contentId: article._id 
      });
      if (realLikes !== (article.likeCount || 0)) {
        await Article.findByIdAndUpdate(article._id, { likeCount: realLikes });
        fixed.articles++;
      }
    }

    // Synchroniser les reviews
    const reviews = await Review.find({});
    for (const review of reviews) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'review', 
        contentId: review._id 
      });
      if (realLikes !== (review.likeCount || 0)) {
        await Review.findByIdAndUpdate(review._id, { likeCount: realLikes });
        fixed.reviews++;
      }
    }

    // Synchroniser les commentaires
    const comments = await Comment.find({ isDeleted: false });
    for (const comment of comments) {
      const realLikes = await Like.countDocuments({ 
        contentType: 'comment', 
        contentId: comment._id 
      });
      if (realLikes !== (comment.likesCount || 0)) {
        await Comment.findByIdAndUpdate(comment._id, { likesCount: realLikes });
        fixed.comments++;
      }
    }

    fixed.total = fixed.articles + fixed.reviews + fixed.comments;

    res.json({
      message: 'Compteurs synchronisés avec succès',
      fixed
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Nettoyer les likes orphelins (Admin)
const cleanupOrphanedLikes = async (req, res) => {
  try {
    let cleaned = 0;
    let orphanedUsers = 0;
    let deletedContent = 0;

    // Récupérer tous les IDs de contenus existants
    const articleIds = await Article.find({}).distinct('_id');
    const reviewIds = await Review.find({}).distinct('_id');
    const commentIds = await Comment.find({ isDeleted: false }).distinct('_id');

    // Supprimer les likes orphelins
    const orphanedResult = await Like.deleteMany({
      $or: [
        { contentType: 'article', contentId: { $nin: articleIds } },
        { contentType: 'review', contentId: { $nin: reviewIds } },
        { contentType: 'comment', contentId: { $nin: commentIds } }
      ]
    });

    cleaned += orphanedResult.deletedCount;

    // Supprimer les likes de contenus supprimés
    const deletedArticles = await Article.find({ isDeleted: true }).distinct('_id');
    const deletedReviews = await Review.find({ isDeleted: true }).distinct('_id');
    const deletedComments = await Comment.find({ isDeleted: true }).distinct('_id');

    const deletedContentResult = await Like.deleteMany({
      $or: [
        { contentType: 'article', contentId: { $in: deletedArticles } },
        { contentType: 'review', contentId: { $in: deletedReviews } },
        { contentType: 'comment', contentId: { $in: deletedComments } }
      ]
    });

    cleaned += deletedContentResult.deletedCount;

    res.json({
      message: 'Nettoyage terminé',
      cleaned,
      orphanedUsers,
      deletedContent
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export {
  toggleLike,
  getLikeStatus,
  getContentLikes,
  getLikesStats,
  getLikesDiagnostic,
  syncLikeCounters,
  cleanupOrphanedLikes
}; 
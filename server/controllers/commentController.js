import Comment from '../models/Comment.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';
import Like from '../models/Like.js';
import mongoose from 'mongoose';
import Joi from 'joi';
import mongoLogService from '../services/mongoLogService.js';

// Schéma Joi pour la validation d'un commentaire
const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  articleId: Joi.string().optional(),
  reviewId: Joi.string().optional(),
  parentCommentId: Joi.string().optional()
});

// Récupérer les commentaires d'un article
export const getArticleComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user?._id; // Optionnel pour les visiteurs non connectés
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent'; // 'recent' ou 'likes'
    
    // Vérifier si l'article existe
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Compter le total de TOUS les commentaires (principaux + réponses)
    const totalComments = await Comment.countDocuments({ 
      article: articleId
    });

    // Définir le tri selon le paramètre
    let finalComments;
    if (sortBy === 'likes') {
      // Pour le tri par likes, utiliser une agrégation
      const pipeline = [
        // Filtrer par article
        { $match: { article: new mongoose.Types.ObjectId(articleId) } },
        
        // Joindre avec les likes pour compter
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$commentId'] },
                      { $eq: ['$contentType', 'comment'] }
                    ]
                  }
                }
              }
            ],
            as: 'likes'
          }
        },
        
        // Ajouter le nombre de likes
        { $addFields: { likesCount: { $size: '$likes' } } },
        
        // Trier par nombre de likes (décroissant) puis par date (décroissant)
        { $sort: { likesCount: -1, createdAt: -1 } },
        
        // Pagination
        { $skip: skip },
        { $limit: limit },
        
        // Populate author
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, email: 1, role: 1 } }]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        
        // Populate parentComment
        {
          $lookup: {
            from: 'comments',
            localField: 'parentComment',
            foreignField: '_id',
            as: 'parentComment',
            pipeline: [
              { $project: { content: 1, author: 1, isDeleted: 1 } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                  pipeline: [{ $project: { username: 1 } }]
                }
              },
              { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
            ]
          }
        },
        { $unwind: { path: '$parentComment', preserveNullAndEmptyArrays: true } }
      ];
      
      const aggregatedComments = await Comment.aggregate(pipeline);
      
      // Utiliser directement les résultats d'agrégation
      finalComments = aggregatedComments;
    } else {
      // Tri par date (défaut) - mais on ajoute quand même le nombre de likes
      const pipeline = [
        // Filtrer par article
        { $match: { article: new mongoose.Types.ObjectId(articleId) } },
        
        // Joindre avec les likes pour compter
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$commentId'] },
                      { $eq: ['$contentType', 'comment'] }
                    ]
                  }
                }
              }
            ],
            as: 'likes'
          }
        },
        
        // Ajouter le nombre de likes
        { $addFields: { likesCount: { $size: '$likes' } } },
        
        // Trier par date (décroissant)
        { $sort: { createdAt: -1 } },
        
        // Pagination
        { $skip: skip },
        { $limit: limit },
        
        // Populate author
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, email: 1, role: 1 } }]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        
        // Populate parentComment
        {
          $lookup: {
            from: 'comments',
            localField: 'parentComment',
            foreignField: '_id',
            as: 'parentComment',
            pipeline: [
              { $project: { content: 1, author: 1, isDeleted: 1 } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                  pipeline: [{ $project: { username: 1 } }]
                }
              },
              { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
            ]
          }
        },
        { $unwind: { path: '$parentComment', preserveNullAndEmptyArrays: true } }
      ];
      
      finalComments = await Comment.aggregate(pipeline);
    }



    // Récupérer les IDs des commentaires parents supprimés qui ont des réponses
    // mais qui ne sont pas dans la liste actuelle
    const commentIdsInCurrentPage = finalComments.map(c => c._id.toString());
    
    // Trouver tous les commentaires supprimés qui ont des réponses
    const deletedParentsWithReplies = await Comment.find({
      article: articleId,
      isDeleted: true,
      _id: { $nin: commentIdsInCurrentPage }
    }).populate('author', 'username email role');

    // Filtrer pour ne garder que ceux qui ont des réponses
    const deletedParentsToInclude = [];
    for (const deletedComment of deletedParentsWithReplies) {
      const hasReplies = await Comment.exists({ parentComment: deletedComment._id });
      if (hasReplies) {
        deletedParentsToInclude.push(deletedComment);
      }
    }

    // Ajouter les commentaires supprimés qui ont des réponses à la liste finale
    if (deletedParentsToInclude.length > 0) {
      finalComments = [...finalComments, ...deletedParentsToInclude];
      
      // Re-trier par date pour maintenir l'ordre chronologique
      finalComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Ajouter les informations de likes pour chaque commentaire
    const commentsWithLikes = await Promise.all(
      finalComments.map(async (comment) => {
        try {
          const liked = userId ? await Like.isLikedByUser(comment._id, 'comment', userId) : false;
          
          // Gérer différemment les documents d'agrégation et les documents Mongoose normaux
          const commentObject = comment.toObject ? comment.toObject() : comment;
          
          return {
            ...commentObject,
            isLiked: liked,
            canDelete: userId && comment.author && comment.author._id.toString() === userId
          };
        } catch (commentError) {
          console.error(`❌ Erreur traitement commentaire ${comment._id}:`, commentError);
          
          // Gérer différemment les documents d'agrégation et les documents Mongoose normaux
          const commentObject = comment.toObject ? comment.toObject() : comment;
          
          return {
            ...commentObject,
            isLiked: false,
            canDelete: userId && comment.author && comment.author._id.toString() === userId
          };
        }
      })
    );



    res.json({
      comments: commentsWithLikes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        hasNextPage: page < Math.ceil(totalComments / limit),
        totalComments: totalComments
      }
    });

  } catch (error) {
    console.error('❌ ERREUR RÉCUPÉRATION COMMENTAIRES:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
};

// Récupérer les commentaires d'une review
export const getReviewComments = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'recent'; // 'recent' ou 'likes'
    
    // Vérifier si la review existe
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review non trouvée' });
    }

    // Compter le total de TOUS les commentaires (principaux + réponses)
    const totalComments = await Comment.countDocuments({ 
      review: reviewId
    });

    // Définir le tri selon le paramètre
    let finalComments;
    if (sortBy === 'likes') {
      // Pour le tri par likes, utiliser une agrégation
      const pipeline = [
        // Filtrer par review
        { $match: { review: new mongoose.Types.ObjectId(reviewId) } },
        
        // Joindre avec les likes pour compter
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$commentId'] },
                      { $eq: ['$contentType', 'comment'] }
                    ]
                  }
                }
              }
            ],
            as: 'likes'
          }
        },
        
        // Ajouter le nombre de likes
        { $addFields: { likesCount: { $size: '$likes' } } },
        
        // Trier par nombre de likes (décroissant) puis par date (décroissant)
        { $sort: { likesCount: -1, createdAt: -1 } },
        
        // Pagination
        { $skip: skip },
        { $limit: limit },
        
        // Populate author
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, email: 1, role: 1 } }]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        
        // Populate parentComment
        {
          $lookup: {
            from: 'comments',
            localField: 'parentComment',
            foreignField: '_id',
            as: 'parentComment',
            pipeline: [
              { $project: { content: 1, author: 1, isDeleted: 1 } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                  pipeline: [{ $project: { username: 1 } }]
                }
              },
              { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
            ]
          }
        },
        { $unwind: { path: '$parentComment', preserveNullAndEmptyArrays: true } }
      ];
      
      const aggregatedComments = await Comment.aggregate(pipeline);
      
      // Utiliser directement les résultats d'agrégation
      finalComments = aggregatedComments;
    } else {
      // Tri par date (défaut) - mais on ajoute quand même le nombre de likes
      const pipeline = [
        // Filtrer par review
        { $match: { review: new mongoose.Types.ObjectId(reviewId) } },
        
        // Joindre avec les likes pour compter
        {
          $lookup: {
            from: 'likes',
            let: { commentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$contentId', '$$commentId'] },
                      { $eq: ['$contentType', 'comment'] }
                    ]
                  }
                }
              }
            ],
            as: 'likes'
          }
        },
        
        // Ajouter le nombre de likes
        { $addFields: { likesCount: { $size: '$likes' } } },
        
        // Trier par date (décroissant)
        { $sort: { createdAt: -1 } },
        
        // Pagination
        { $skip: skip },
        { $limit: limit },
        
        // Populate author
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, email: 1, role: 1 } }]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        
        // Populate parentComment
        {
          $lookup: {
            from: 'comments',
            localField: 'parentComment',
            foreignField: '_id',
            as: 'parentComment',
            pipeline: [
              { $project: { content: 1, author: 1, isDeleted: 1 } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                  pipeline: [{ $project: { username: 1 } }]
                }
              },
              { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
            ]
          }
        },
        { $unwind: { path: '$parentComment', preserveNullAndEmptyArrays: true } }
      ];
      
      finalComments = await Comment.aggregate(pipeline);
    }





    // Récupérer les IDs des commentaires parents supprimés qui ont des réponses
    // mais qui ne sont pas dans la liste actuelle
    const commentIdsInCurrentPage = finalComments.map(c => c._id.toString());
    
    // Trouver tous les commentaires supprimés qui ont des réponses
    const deletedParentsWithReplies = await Comment.find({
      review: reviewId,
      isDeleted: true,
      _id: { $nin: commentIdsInCurrentPage }
    }).populate('author', 'username email role');

    // Filtrer pour ne garder que ceux qui ont des réponses
    const deletedParentsToInclude = [];
    for (const deletedComment of deletedParentsWithReplies) {
      const hasReplies = await Comment.exists({ parentComment: deletedComment._id });
      if (hasReplies) {
        deletedParentsToInclude.push(deletedComment);
      }
    }

    // Ajouter les commentaires supprimés qui ont des réponses à la liste finale
    if (deletedParentsToInclude.length > 0) {
      finalComments = [...finalComments, ...deletedParentsToInclude];
      
      // Re-trier par date pour maintenir l'ordre chronologique
      finalComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Ajouter les informations de likes pour chaque commentaire
    const commentsWithLikes = await Promise.all(
      finalComments.map(async (comment) => {
        try {
          const liked = userId ? await Like.isLikedByUser(comment._id, 'comment', userId) : false;
          
          // Gérer différemment les documents d'agrégation et les documents Mongoose normaux
          const commentObject = comment.toObject ? comment.toObject() : comment;
          
          return {
            ...commentObject,
            isLiked: liked,
            canDelete: userId && comment.author && comment.author._id.toString() === userId
          };
        } catch (commentError) {
          console.error(`❌ Erreur traitement commentaire review ${comment._id}:`, commentError);
          
          // Gérer différemment les documents d'agrégation et les documents Mongoose normaux
          const commentObject = comment.toObject ? comment.toObject() : comment;
          
          return {
            ...commentObject,
            isLiked: false,
            canDelete: userId && comment.author && comment.author._id.toString() === userId
          };
        }
      })
    );



    res.json({
      comments: commentsWithLikes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        hasNextPage: page < Math.ceil(totalComments / limit),
        totalComments: totalComments
      }
    });

  } catch (error) {
    console.error('❌ ERREUR RÉCUPÉRATION COMMENTAIRES REVIEW:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
};

// Ajouter un commentaire
export const createComment = async (req, res) => {
  try {
    const { error, value } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { content, articleId, reviewId, parentCommentId } = value;
    const userId = req.user._id;

    // Validation
    
    // Il faut soit un articleId soit un reviewId
    if (!articleId && !reviewId) {
      return res.status(400).json({ message: 'ArticleId ou ReviewId requis' });
    }

    if (articleId && reviewId) {
      return res.status(400).json({ message: 'Ne peut pas commenter un article ET une review simultanément' });
    }

    // Vérifier si l'article ou la review existe
    let contentExists = false;
    if (articleId) {
      const article = await Article.findById(articleId);
      contentExists = !!article;
      if (!contentExists) {
        return res.status(404).json({ message: 'Article non trouvé' });
      }
    } else if (reviewId) {
      const review = await Review.findById(reviewId);
      contentExists = !!review;
      if (!contentExists) {
        return res.status(404).json({ message: 'Review non trouvée' });
      }
    }

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Commentaire parent non trouvé' });
      }

      // Vérifier que le parent est sur le même contenu
      if (articleId && !parentComment.article) {
        return res.status(400).json({ message: 'Le commentaire parent n\'est pas sur cet article' });
      }
      if (reviewId && !parentComment.review) {
        return res.status(400).json({ message: 'Le commentaire parent n\'est pas sur cette review' });
      }
    }

    // Créer le commentaire
    const commentData = {
      content: content.trim(),
      author: userId,
      parentComment: parentCommentId || null
    };

    if (articleId) {
      commentData.article = articleId;
    } else if (reviewId) {
      commentData.review = reviewId;
    }

    const comment = new Comment(commentData);
    await comment.save();

    // Peupler les informations de l'auteur
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username email role')
      .populate({
        path: 'parentComment',
        select: 'content author isDeleted',
        populate: {
          path: 'author',
          select: 'username'
        }
      });

    // Logger la création
    await mongoLogService.info('Commentaire créé', {
      commentId: comment._id,
      contentType: articleId ? 'article' : 'review',
      contentId: articleId || reviewId,
      parentId: parentCommentId,
      authorId: userId,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Commentaire ajouté avec succès',
      comment: {
        ...populatedComment.toObject(),
        isLiked: false,
        canDelete: true,
        replies: []
      }
    });

  } catch (error) {
    console.error('Erreur ajout commentaire:', error);
    
    await mongoLogService.error('Erreur création commentaire', {
      error: error.message,
      authorId: req.user._id,
      ip: req.ip
    });

    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un commentaire
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'ID de commentaire invalide' });
    }

    // Récupérer le commentaire
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (comment.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce commentaire' });
    }

    // Vérifier s'il y a des réponses avec gestion d'erreur
    let canHardDelete;
    try {
      canHardDelete = await comment.canBeHardDeleted();
    } catch (deleteCheckError) {
      console.error('❌ Erreur lors de la vérification canBeHardDeleted:', deleteCheckError);
      return res.status(500).json({ message: 'Erreur lors de la vérification des réponses' });
    }

    if (canHardDelete) {
      // Suppression définitive - pas de réponses
      
      // Supprimer tous les likes du commentaire
      const deletedLikesHard = await Like.deleteMany({ 
        contentId: commentId, 
        contentType: 'comment' 
      });

      // Supprimer le commentaire
      await Comment.findByIdAndDelete(commentId);
      
      // Logger la suppression
      await mongoLogService.info('Commentaire supprimé définitivement', {
        commentId: comment._id,
        deletedBy: userId,
        ip: req.ip
      });
      
      res.json({ 
        message: 'Commentaire supprimé définitivement',
        deleted: true,
        hardDeleted: true
      });
    } else {
      // Soft delete - il y a des réponses
      
      // Supprimer tous les likes du commentaire
      const deletedLikesSoft = await Like.deleteMany({ 
        contentId: commentId, 
        contentType: 'comment' 
      });

      // Réinitialiser le compteur de likes
      comment.likesCount = 0;
      
      // Effectuer le soft delete avec gestion d'erreur
      try {
        await comment.softDelete();
      } catch (softDeleteError) {
        console.error('❌ Erreur lors du soft delete:', softDeleteError);
        return res.status(500).json({ message: 'Erreur lors de la suppression logique' });
      }
      
      // Logger la suppression
      await mongoLogService.info('Commentaire supprimé (soft delete)', {
        commentId: comment._id,
        deletedBy: userId,
        ip: req.ip
      });
      
      res.json({ 
        message: 'Commentaire supprimé, les réponses sont conservées',
        deleted: true,
        hardDeleted: false
      });
    }

  } catch (error) {
    console.error('❌ ERREUR SUPPRESSION COMMENTAIRE:', error);
    console.error('Stack trace:', error.stack);
    
    await mongoLogService.error('Erreur suppression commentaire', {
      error: error.message,
      commentId: req.params.commentId,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
};

// Supprimer définitivement un commentaire soft-deleted
export const forceDeleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'ID de commentaire invalide' });
    }

    // Récupérer le commentaire
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    // Vérifier que le commentaire est bien soft-deleted
    if (!comment.isDeleted) {
      return res.status(400).json({ message: 'Ce commentaire n\'est pas marqué comme supprimé' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (comment.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Non autorisé à supprimer définitivement ce commentaire' });
    }

    // Supprimer tous les likes du commentaire
    const deletedLikes = await Like.deleteMany({ 
      contentId: commentId, 
      contentType: 'comment' 
    });

    // Supprimer le commentaire définitivement
    await Comment.findByIdAndDelete(commentId);
    
    // Logger la suppression définitive
    await mongoLogService.info('Commentaire supprimé définitivement (force delete)', {
      commentId: comment._id,
      deletedBy: userId,
      ip: req.ip
    });
    
    res.json({ 
      message: 'Commentaire supprimé définitivement',
      deleted: true,
      hardDeleted: true
    });

  } catch (error) {
    console.error('❌ ERREUR SUPPRESSION DÉFINITIVE COMMENTAIRE:', error);
    console.error('Stack trace:', error.stack);
    
    await mongoLogService.error('Erreur suppression définitive commentaire', {
      error: error.message,
      commentId: req.params.commentId,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
}; 
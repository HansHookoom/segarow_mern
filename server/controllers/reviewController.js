import Review from '../models/Review.js';
import Joi from 'joi';
import config from '../config/env.js';
import mongoLogService from '../services/mongoLogService.js';

// Fonction utilitaire pour construire l'URL d'une image
const buildImageUrl = (imageId) => {
  if (!imageId) return null;
  
  // Si c'est déjà une URL complète (commence par /api/images/)
  if (imageId.startsWith('/api/images/')) {
    return `${config.REACT_APP_API_URL}${imageId}`;
  }
  
  // Si c'est juste un ID, construire l'URL complète
  return `${config.REACT_APP_API_URL}/api/images/${imageId}`;
};

// Fonction pour enrichir une review avec les URLs des images
const enrichReviewWithImageUrls = (review) => {
  const enriched = review.toObject();
  enriched.imageUrl = buildImageUrl(review.image);
  enriched.secondaryImageUrl = buildImageUrl(review.secondaryImage);
  return enriched;
};

// Schéma Joi pour la validation d'une review
const reviewSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  slug: Joi.string().min(3).max(200).required(),
  excerpt: Joi.string().allow('').max(500),
  content: Joi.string().allow('').max(5000),
  image: Joi.string().allow(''),
  secondaryImage: Joi.string().allow(''),
  readingTime: Joi.string().allow(''),
  rating: Joi.number().min(0).max(10),
  gameTitle: Joi.string().allow(''),
  platform: Joi.string().allow(''),
  genre: Joi.string().allow('')
});

// Récupérer toutes les reviews avec pagination et recherche
const getReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Construire la requête de recherche
    let query = {};
    if (search.trim()) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { gameTitle: { $regex: search, $options: 'i' } },
          { genre: { $regex: search, $options: 'i' } },
          { platform: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const reviews = await Review.find(query)
      .populate('author', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.json({ 
      reviews: reviews.map(enrichReviewWithImageUrls), 
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: reviews.length,
        totalReviews: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des reviews' });
  }
};

// Récupérer une review par ID ou slug
const getReview = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Chercher par ID MongoDB ou par slug
    const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: identifier } 
      : { slug: identifier };
    
    const review = await Review.findOne(query).populate('author', 'email username');
    
    if (!review) {
      return res.status(404).json({ message: 'Review non trouvée' });
    }

    res.json({ review: enrichReviewWithImageUrls(review) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la review' });
  }
};

// Créer une review (Admin seulement)
const createReview = async (req, res) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { title, slug, excerpt, content, image, secondaryImage, readingTime, rating, gameTitle, platform, genre } = value;

    const review = new Review({
      title,
      slug,
      excerpt,
      content,
      image,
      secondaryImage,
      readingTime,
      rating,
      gameTitle,
      platform,
      genre,
      author: req.user._id
    });

    await review.save();

    // Logger la création de la review
    await mongoLogService.info('Review créée par administrateur', {
      reviewId: review._id,
      reviewTitle: review.title,
      reviewSlug: review.slug,
      gameTitle: review.gameTitle,
      rating: review.rating,
      platform: review.platform,
      genre: review.genre,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      hasImage: !!review.image,
      hasSecondaryImage: !!review.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.status(201).json({ 
      message: 'Review créée avec succès',
      review: enrichReviewWithImageUrls(review)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Une review avec ce slug existe déjà' });
    }
    
    // Logger l'erreur
    await mongoLogService.error('Erreur création review', {
      error: error.message,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      attemptedTitle: req.body.title,
      attemptedSlug: req.body.slug,
      attemptedGameTitle: req.body.gameTitle,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la création de la review' });
  }
};

// Modifier une review (Admin seulement)
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = reviewSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Récupérer la review avant modification pour le logging
    const oldReview = await Review.findById(id);

    const review = await Review.findByIdAndUpdate(
      id, 
      { ...value, updatedAt: Date.now() },
      { new: true }
    ).populate('author', 'email username');

    if (!review) {
      return res.status(404).json({ message: 'Review non trouvée' });
    }

    // Logger la modification de la review
    await mongoLogService.info('Review modifiée par administrateur', {
      reviewId: review._id,
      reviewTitle: review.title,
      reviewSlug: review.slug,
      gameTitle: review.gameTitle,
      rating: review.rating,
      platform: review.platform,
      genre: review.genre,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      oldTitle: oldReview?.title,
      oldSlug: oldReview?.slug,
      oldRating: oldReview?.rating,
      hasImage: !!review.image,
      hasSecondaryImage: !!review.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.json({ 
      message: 'Review modifiée avec succès',
      review: enrichReviewWithImageUrls(review)
    });
  } catch (error) {
    // Logger l'erreur
    await mongoLogService.error('Erreur modification review', {
      error: error.message,
      reviewId: req.params.id,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la modification de la review' });
  }
};

// Supprimer une review (Admin seulement)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la review avant suppression pour le logging
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review non trouvée' });
    }

    await Review.findByIdAndDelete(id);

    // Logger la suppression de la review
    await mongoLogService.info('Review supprimée par administrateur', {
      reviewId: review._id,
      reviewTitle: review.title,
      reviewSlug: review.slug,
      gameTitle: review.gameTitle,
      rating: review.rating,
      platform: review.platform,
      genre: review.genre,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      hadImage: !!review.image,
      hadSecondaryImage: !!review.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.json({ message: 'Review supprimée avec succès' });
  } catch (error) {
    // Logger l'erreur
    await mongoLogService.error('Erreur suppression review', {
      error: error.message,
      reviewId: req.params.id,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la suppression de la review' });
  }
};

export {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview
}; 
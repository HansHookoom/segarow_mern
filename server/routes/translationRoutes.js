import express from 'express';
import TranslationService from '../services/translationService.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';

const router = express.Router();

/**
 * Route pour traduire un article par son slug
 * GET /api/translate/article/:slug?from=fr&to=en
 */
router.get('/article/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { from = 'fr', to = 'en' } = req.query;

    // Récupérer l'article depuis la base de données
    const article = await Article.findOne({ slug }).populate('author', 'username email');
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article non trouvé' 
      });
    }

    // Traduire les champs de l'article
    const translatedArticle = await TranslationService.translateContent(
      article.toObject(),
      ['title', 'excerpt', 'content'],
      from,
      to
    );

    res.json({
      success: true,
      article: translatedArticle
    });

  } catch (error) {
    console.error('Erreur lors de la traduction de l\'article:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la traduction' 
    });
  }
});

/**
 * Route pour traduire une review par son slug
 * GET /api/translate/review/:slug?from=fr&to=en
 */
router.get('/review/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { from = 'fr', to = 'en' } = req.query;

    // Récupérer la review depuis la base de données
    const review = await Review.findOne({ slug }).populate('author', 'username email');
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review non trouvée' 
      });
    }

    // Traduire les champs de la review
    const translatedReview = await TranslationService.translateContent(
      review.toObject(),
      ['title', 'excerpt', 'content', 'gameTitle'],
      from,
      to
    );

    res.json({
      success: true,
      review: translatedReview
    });

  } catch (error) {
    console.error('Erreur lors de la traduction de la review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la traduction' 
    });
  }
});

/**
 * Route pour traduire une liste d'articles
 * POST /api/translate/articles
 * Body: { articles: [...], from: 'fr', to: 'en' }
 */
router.post('/articles', async (req, res) => {
  try {
    const { articles, from = 'fr', to = 'en' } = req.body;

    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste d\'articles requise' 
      });
    }

    const translatedArticles = [];

    // Traduire chaque article
    for (const article of articles) {
      const translatedArticle = await TranslationService.translateContent(
        article,
        ['title', 'excerpt'],
        from,
        to
      );
      translatedArticles.push(translatedArticle);
    }

    res.json({
      success: true,
      articles: translatedArticles
    });

  } catch (error) {
    console.error('Erreur lors de la traduction des articles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la traduction' 
    });
  }
});

/**
 * Route pour traduire une liste de reviews
 * POST /api/translate/reviews
 * Body: { reviews: [...], from: 'fr', to: 'en' }
 */
router.post('/reviews', async (req, res) => {
  try {
    const { reviews, from = 'fr', to = 'en' } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste de reviews requise' 
      });
    }

    const translatedReviews = [];

    // Traduire chaque review
    for (const review of reviews) {
      const translatedReview = await TranslationService.translateContent(
        review,
        ['title', 'excerpt', 'gameTitle'],
        from,
        to
      );
      translatedReviews.push(translatedReview);
    }

    res.json({
      success: true,
      reviews: translatedReviews
    });

  } catch (error) {
    console.error('Erreur lors de la traduction des reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la traduction' 
    });
  }
});

/**
 * Route pour obtenir les statistiques du cache de traduction
 * GET /api/translate/cache/stats
 */
router.get('/cache/stats', (req, res) => {
  res.json({
    success: true,
    cacheSize: TranslationService.getCacheSize()
  });
});

/**
 * Route pour vider le cache de traduction
 * DELETE /api/translate/cache
 */
router.delete('/cache', (req, res) => {
  TranslationService.clearCache();
  res.json({
    success: true,
    message: 'Cache de traduction vidé'
  });
});

export default router; 
import Article from '../models/Article.js';
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

// Fonction pour enrichir un article avec les URLs des images
const enrichArticleWithImageUrls = (article) => {
  const enriched = article.toObject();
  enriched.imageUrl = buildImageUrl(article.image);
  enriched.secondaryImageUrl = buildImageUrl(article.secondaryImage);
  return enriched;
};

// Schéma Joi pour la validation d'un article
const articleSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  slug: Joi.string().min(3).max(200).required(),
  excerpt: Joi.string().allow('').max(500),
  content: Joi.string().allow('').max(5000),
  image: Joi.string().allow(''),
  secondaryImage: Joi.string().allow(''),
  readingTime: Joi.string().allow('')
});

// Récupérer tous les articles avec pagination et recherche
const getArticles = async (req, res) => {
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
          { content: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const articles = await Article.find(query)
      .populate('author', 'email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Article.countDocuments(query);

    res.json({ 
      articles: articles.map(enrichArticleWithImageUrls), 
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: articles.length,
        totalArticles: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
  }
};

// Récupérer un article par slug
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const article = await Article.findOne({ slug }).populate('author', 'email username');
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.json({ article: enrichArticleWithImageUrls(article) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
};

// Récupérer un article par ID ou slug
const getArticle = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Chercher par ID MongoDB ou par slug
    const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: identifier } 
      : { slug: identifier };
    
    const article = await Article.findOne(query).populate('author', 'email username');
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    res.json({ article: enrichArticleWithImageUrls(article) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'article' });
  }
};

// Créer un article (Admin seulement)
const createArticle = async (req, res) => {
  try {
    const { error, value } = articleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const { title, slug, excerpt, content, image, secondaryImage, readingTime } = value;

    const article = new Article({
      title,
      slug,
      excerpt,
      content,
      image,
      secondaryImage,
      readingTime,
      author: req.user._id
    });

    await article.save();

    // Logger la création de l'article
    await mongoLogService.info('Article créé par administrateur', {
      articleId: article._id,
      articleTitle: article.title,
      articleSlug: article.slug,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      hasImage: !!article.image,
      hasSecondaryImage: !!article.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.status(201).json({ 
      message: 'Article créé avec succès',
      article: enrichArticleWithImageUrls(article)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un article avec ce slug existe déjà' });
    }
    
    // Logger l'erreur
    await mongoLogService.error('Erreur création article', {
      error: error.message,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      attemptedTitle: req.body.title,
      attemptedSlug: req.body.slug,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la création de l\'article' });
  }
};

// Modifier un article (Admin seulement)
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = articleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Récupérer l'article avant modification pour le logging
    const oldArticle = await Article.findById(id);

    const article = await Article.findByIdAndUpdate(
      id, 
      { ...value, updatedAt: Date.now() },
      { new: true }
    ).populate('author', 'email username');

    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    // Logger la modification de l'article
    await mongoLogService.info('Article modifié par administrateur', {
      articleId: article._id,
      articleTitle: article.title,
      articleSlug: article.slug,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      oldTitle: oldArticle?.title,
      oldSlug: oldArticle?.slug,
      hasImage: !!article.image,
      hasSecondaryImage: !!article.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.json({ 
      message: 'Article modifié avec succès',
      article: enrichArticleWithImageUrls(article)
    });
  } catch (error) {
    // Logger l'erreur
    await mongoLogService.error('Erreur modification article', {
      error: error.message,
      articleId: req.params.id,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la modification de l\'article' });
  }
};

// Supprimer un article (Admin seulement)
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'article avant suppression pour le logging
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    await Article.findByIdAndDelete(id);

    // Logger la suppression de l'article
    await mongoLogService.info('Article supprimé par administrateur', {
      articleId: article._id,
      articleTitle: article.title,
      articleSlug: article.slug,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      hadImage: !!article.image,
      hadSecondaryImage: !!article.secondaryImage,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    // Logger l'erreur
    await mongoLogService.error('Erreur suppression article', {
      error: error.message,
      articleId: req.params.id,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');
    
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'article' });
  }
};

export {
  getArticles,
  getArticleBySlug,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
}; 
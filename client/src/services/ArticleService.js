import ApiService from './ApiService';

class ArticleService {
  // Récupérer tous les articles
  async getArticles(page = 1, limit = 10) {
    return ApiService.get(`/api/articles?page=${page}&limit=${limit}`);
  }

  // Récupérer un article par son ID
  async getArticleById(id) {
    return ApiService.get(`/api/articles/${id}`);
  }

  // Récupérer un article par son slug
  async getArticleBySlug(slug) {
    return ApiService.get(`/api/articles/${slug}`);
  }

  // Créer un nouvel article (Admin seulement)
  async createArticle(articleData) {
    return ApiService.post('/api/articles', articleData, true);
  }

  // Modifier un article (Admin seulement)
  async updateArticle(id, articleData) {
    return ApiService.put(`/api/articles/${id}`, articleData, true);
  }

  // Supprimer un article (Admin seulement)
  async deleteArticle(id) {
    return ApiService.delete(`/api/articles/${id}`, true);
  }

  // Générer un slug à partir du titre
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Valider les données d'un article
  validateArticle(article) {
    const errors = {};

    if (!article.title || article.title.trim().length < 3) {
      errors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!article.slug || article.slug.trim().length < 3) {
      errors.slug = 'Le slug doit contenir au moins 3 caractères';
    }

    if (!article.excerpt || article.excerpt.trim().length < 10) {
      errors.excerpt = 'L\'extrait doit contenir au moins 10 caractères';
    }

    if (!article.content || !isContentValid(article.content)) {
      errors.content = 'Le contenu doit contenir au moins 50 caractères ou inclure une image ou une vidéo.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Nouvelle fonction utilitaire pour valider le contenu rich text
function isContentValid(html) {
  // Extraire le texte brut
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length >= 50) return true;
  // Vérifier la présence d'au moins une image ou une vidéo YouTube
  const hasImage = /<img\s[^>]*src=["'][^"']+["'][^>]*>/i.test(html);
  const hasYoutube = /<iframe\s[^>]*src=["'][^"']*youtube\.com[^"']*["'][^>]*>/i.test(html);
  return hasImage || hasYoutube;
}

export default new ArticleService();

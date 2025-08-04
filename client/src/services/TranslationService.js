import ApiService from './ApiService';

class TranslationService {
  /**
   * Traduit un article par son slug
   * @param {string} slug - Le slug de l'article
   * @param {string} fromLang - Langue source (ex: 'fr')
   * @param {string} toLang - Langue cible (ex: 'en')
   * @returns {Promise<Object>} - L'article traduit
   */
  static async translateArticle(slug, fromLang = 'fr', toLang = 'en') {
    try {
      const response = await ApiService.get(`/api/translate/article/${slug}?from=${fromLang}&to=${toLang}`);
      return response.article;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Traduit une review par son slug
   * @param {string} slug - Le slug de la review
   * @param {string} fromLang - Langue source (ex: 'fr')
   * @param {string} toLang - Langue cible (ex: 'en')
   * @returns {Promise<Object>} - La review traduite
   */
  static async translateReview(slug, fromLang = 'fr', toLang = 'en') {
    try {
      const response = await ApiService.get(`/api/translate/review/${slug}?from=${fromLang}&to=${toLang}`);
      return response.review;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Traduit une liste d'articles
   * @param {Array} articles - Liste des articles à traduire
   * @param {string} fromLang - Langue source (ex: 'fr')
   * @param {string} toLang - Langue cible (ex: 'en')
   * @returns {Promise<Array>} - Liste des articles traduits
   */
  static async translateArticles(articles, fromLang = 'fr', toLang = 'en') {
    try {
      const response = await ApiService.post('/api/translate/articles', {
        articles,
        from: fromLang,
        to: toLang
      });
      return response.articles;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Traduit une liste de reviews
   * @param {Array} reviews - Liste des reviews à traduire
   * @param {string} fromLang - Langue source (ex: 'fr')
   * @param {string} toLang - Langue cible (ex: 'en')
   * @returns {Promise<Array>} - Liste des reviews traduites
   */
  static async translateReviews(reviews, fromLang = 'fr', toLang = 'en') {
    try {
      const response = await ApiService.post('/api/translate/reviews', {
        reviews,
        from: fromLang,
        to: toLang
      });
      return response.reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtient les statistiques du cache de traduction
   * @returns {Promise<Object>} - Statistiques du cache
   */
  static async getCacheStats() {
    try {
      const response = await ApiService.get('/api/translate/cache/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vide le cache de traduction
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  static async clearCache() {
    try {
      const response = await ApiService.delete('/api/translate/cache');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Détermine la langue source basée sur la langue actuelle de l'interface
   * @param {string} currentLang - Langue actuelle de l'interface
   * @returns {string} - Langue source pour la traduction
   */
  static getSourceLanguage(currentLang) {
    // Si l'interface est en français, le contenu est probablement en français
    // Si l'interface est en anglais, le contenu est probablement en français aussi
    // car c'est la langue par défaut de votre site
    return 'fr';
  }

  /**
   * Détermine la langue cible basée sur la langue actuelle de l'interface
   * @param {string} currentLang - Langue actuelle de l'interface
   * @returns {string} - Langue cible pour la traduction
   */
  static getTargetLanguage(currentLang) {
    // Si l'interface est en anglais, on veut traduire le contenu français vers l'anglais
    // Si l'interface est en français, on affiche le contenu original français
    return currentLang === 'en' ? 'en' : 'fr';
  }
}

export default TranslationService; 
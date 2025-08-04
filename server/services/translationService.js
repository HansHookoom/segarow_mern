import translate from 'translate';

// Cache pour stocker les traductions déjà effectuées
const translationCache = new Map();

class TranslationService {
  /**
   * Traduit un texte d'une langue vers une autre
   * @param {string} text - Le texte à traduire
   * @param {string} fromLang - Langue source (ex: 'fr')
   * @param {string} toLang - Langue cible (ex: 'en')
   * @returns {Promise<string>} - Le texte traduit
   */
  static async translateText(text, fromLang = 'fr', toLang = 'en') {
    if (!text || text.trim() === '') {
      return text;
    }

    // Créer une clé de cache unique
    const cacheKey = `${text}_${fromLang}_${toLang}`;
    
    // Vérifier si la traduction existe déjà en cache
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      // Si les langues sont identiques, retourner le texte original
      if (fromLang === toLang) {
        return text;
      }

      // Effectuer la traduction
      const translatedText = await translate(text, {
        from: fromLang,
        to: toLang
      });
      
      // Mettre en cache la traduction
      translationCache.set(cacheKey, translatedText);
      
      // Limiter la taille du cache (garder les 1000 dernières traductions)
      if (translationCache.size > 1000) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
      }

      return translatedText;
    } catch (error) {
      console.error('Erreur de traduction:', error);
      // En cas d'erreur, retourner le texte original
      return text;
    }
  }

  /**
   * Traduit un objet contenant des champs de texte
   * @param {Object} content - L'objet contenant les champs à traduire
   * @param {Array} fieldsToTranslate - Les champs à traduire
   * @param {string} fromLang - Langue source
   * @param {string} toLang - Langue cible
   * @returns {Promise<Object>} - L'objet avec les champs traduits
   */
  static async translateContent(content, fieldsToTranslate = ['excerpt', 'content'], fromLang = 'fr', toLang = 'en') {
    if (!content) return content;

    const translatedContent = { ...content };

    // Traduire chaque champ spécifié
    for (const field of fieldsToTranslate) {
      if (content[field] && typeof content[field] === 'string') {
        // Si c'est le champ 'content', utiliser la traduction HTML
        if (field === 'content') {
          translatedContent[field] = await this.translateHtmlContent(content[field], fromLang, toLang);
        } else {
          // Pour les autres champs (excerpt), traduire normalement
          translatedContent[field] = await this.translateText(content[field], fromLang, toLang);
        }
      }
    }

    return translatedContent;
  }

  /**
   * Traduit le contenu HTML en préservant les balises
   * @param {string} htmlContent - Le contenu HTML à traduire
   * @param {string} fromLang - Langue source
   * @param {string} toLang - Langue cible
   * @returns {Promise<string>} - Le contenu HTML traduit
   */
  static async translateHtmlContent(htmlContent, fromLang = 'fr', toLang = 'en') {
    if (!htmlContent) return htmlContent;

    try {
      // Si les langues sont identiques, retourner le contenu original
      if (fromLang === toLang) {
        return htmlContent;
      }

      // Pour préserver les balises HTML, on va utiliser une approche plus simple
      // On va traduire le contenu texte par texte, en préservant les balises
      
      // Diviser le HTML en parties : balises et texte
      const parts = htmlContent.split(/(<[^>]*>)/);
      const translatedParts = [];
      
      for (const part of parts) {
        if (part.startsWith('<') && part.endsWith('>')) {
          // C'est une balise HTML, on la préserve
          translatedParts.push(part);
        } else if (part.trim()) {
          // C'est du texte, on le traduit
          const translatedText = await this.translateText(part, fromLang, toLang);
          translatedParts.push(translatedText);
        } else {
          // Espaces vides, on les préserve
          translatedParts.push(part);
        }
      }
      
      return translatedParts.join('');
    } catch (error) {
      console.error('Erreur de traduction HTML:', error);
      return htmlContent;
    }
  }

  /**
   * Vide le cache de traduction
   */
  static clearCache() {
    translationCache.clear();
  }

  /**
   * Retourne la taille du cache
   */
  static getCacheSize() {
    return translationCache.size;
  }
}

export default TranslationService; 
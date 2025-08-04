import ApiService from './ApiService';

class ReviewService {
  // Récupérer toutes les reviews
  async getReviews(page = 1, limit = 10) {
    return ApiService.get(`/api/reviews?page=${page}&limit=${limit}`);
  }

  // Récupérer une review par son ID
  async getReviewById(id) {
    return ApiService.get(`/api/reviews/${id}`);
  }

  // Créer une nouvelle review (Admin seulement)
  async createReview(reviewData) {
    return ApiService.post('/api/reviews', reviewData, true);
  }

  // Modifier une review (Admin seulement)
  async updateReview(id, reviewData) {
    return ApiService.put(`/api/reviews/${id}`, reviewData, true);
  }

  // Supprimer une review (Admin seulement)
  async deleteReview(id) {
    return ApiService.delete(`/api/reviews/${id}`, true);
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

  // Valider les données d'une review
  validateReview(review) {
    const errors = {};

    if (!review.title || review.title.trim().length < 3) {
      errors.title = 'Le titre doit contenir au moins 3 caractères';
    }

    if (!review.slug || review.slug.trim().length < 3) {
      errors.slug = 'Le slug doit contenir au moins 3 caractères';
    }

    if (!review.excerpt || review.excerpt.trim().length < 10) {
      errors.excerpt = 'L\'extrait doit contenir au moins 10 caractères';
    }

    if (!review.content || review.content.trim().length < 50) {
      errors.content = 'Le contenu doit contenir au moins 50 caractères';
    }

    if (!review.gameTitle || review.gameTitle.trim().length < 2) {
      errors.gameTitle = 'Le nom du jeu doit contenir au moins 2 caractères';
    }

    if (review.rating !== undefined && review.rating !== null) {
      const rating = parseFloat(review.rating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        errors.rating = 'La note doit être comprise entre 0 et 10';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Genres de jeux disponibles
  getGenres() {
    return [
      'Action',
      'Action/Aventure', 
      'Aventure',
      'Beat\'em up',
      'Course',
      'Plateforme',
      'Puzzle',
      'RPG',
      'JRPG',
      'Simulation',
      'Sport',
      'Stratégie',
      'FPS',
      'TPS',
      'Survival',
      'Horror',
      'Fighting',
      'Arcade',
      'Shoot\'em up',
      'Metroidvania',
      'Roguelike',
      'Battle Royale',
      'MMORPG',
      'MOBA',
      'RTS',
      'Turn-Based',
      'Sandbox',
      'Visual Novel',
      'Rhythm',
      'Party Game'
    ];
  }

  // Plateformes de jeux disponibles (consoles rétro et modernes) groupées par marque
  getPlatforms() {
    return {
      "PC & Web": [
        { value: 'PC', label: 'PC' },
        { value: 'Web', label: 'Web' },
        { value: 'Steam Deck', label: 'Steam Deck' },
        { value: 'Multi-plateforme', label: 'Multi-plateforme' }
      ],
      "Nintendo - Consoles de salon": [
        { value: 'Nintendo Switch', label: 'Nintendo Switch' },
        { value: 'Wii U', label: 'Wii U' },
        { value: 'Wii', label: 'Wii' },
        { value: 'GameCube', label: 'GameCube' },
        { value: 'Nintendo 64', label: 'Nintendo 64' },
        { value: 'Super Nintendo (SNES)', label: 'Super Nintendo (SNES)' },
        { value: 'Nintendo Entertainment System (NES)', label: 'Nintendo Entertainment System (NES)' }
      ],
      "Nintendo - Consoles portables": [
        { value: 'Nintendo Switch Lite', label: 'Nintendo Switch Lite' },
        { value: 'Nintendo 3DS', label: 'Nintendo 3DS' },
        { value: 'Nintendo DS', label: 'Nintendo DS' },
        { value: 'Game Boy Advance', label: 'Game Boy Advance' },
        { value: 'Game Boy Color', label: 'Game Boy Color' },
        { value: 'Game Boy', label: 'Game Boy' }
      ],
      "PlayStation": [
        { value: 'PlayStation 5', label: 'PlayStation 5' },
        { value: 'PlayStation 4', label: 'PlayStation 4' },
        { value: 'PlayStation 3', label: 'PlayStation 3' },
        { value: 'PlayStation 2', label: 'PlayStation 2' },
        { value: 'PlayStation', label: 'PlayStation' },
        { value: 'PlayStation Portable (PSP)', label: 'PlayStation Portable (PSP)' },
        { value: 'PlayStation Vita', label: 'PlayStation Vita' }
      ],
      "Xbox": [
        { value: 'Xbox Series X/S', label: 'Xbox Series X/S' },
        { value: 'Xbox One', label: 'Xbox One' },
        { value: 'Xbox 360', label: 'Xbox 360' },
        { value: 'Xbox', label: 'Xbox' }
      ],
      "Sega": [
        { value: 'Sega Dreamcast', label: 'Sega Dreamcast' },
        { value: 'Sega Saturn', label: 'Sega Saturn' },
        { value: 'Sega Genesis/Mega Drive', label: 'Sega Genesis/Mega Drive' },
        { value: 'Sega Master System', label: 'Sega Master System' },
        { value: 'Sega Game Gear', label: 'Sega Game Gear' }
      ],
      "Autres": [
        { value: 'Atari 2600', label: 'Atari 2600' },
        { value: 'Neo Geo', label: 'Neo Geo' },
        { value: 'Arcade', label: 'Arcade' },
        { value: 'Mobile (iOS/Android)', label: 'Mobile (iOS/Android)' }
      ]
    };
  }

  // Méthode helper pour obtenir la liste simple des plateformes (pour compatibilité)
  getPlatformsList() {
    const platforms = this.getPlatforms();
    const allPlatforms = [];
    
    Object.values(platforms).forEach(group => {
      group.forEach(platform => {
        allPlatforms.push(platform.value);
      });
    });
    
    return allPlatforms;
  }

  // Méthode helper pour obtenir le label avec emoji d'une plateforme
  getPlatformLabel(platformValue) {
    const platforms = this.getPlatforms();
    
    for (const group of Object.values(platforms)) {
      const platform = group.find(p => p.value === platformValue);
      if (platform) {
        return platform.label;
      }
    }
    
    return platformValue; // Fallback au nom original
  }

  // Formater la note pour l'affichage
  formatRating(rating) {
    if (rating === null || rating === undefined) return 'Non noté';
    return `${rating}/10`;
  }
}

export default new ReviewService(); 
import ApiService from './ApiService';

class ImageService {
  // Uploader une image
  static async uploadImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${ApiService.API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ApiService.getAuthToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'upload');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer la liste des images avec pagination
  static async getImages(page = 1, limit = 8) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`${ApiService.API_BASE_URL}/api/images?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ApiService.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération des images');
      }

      return {
        images: data.images,
        pagination: data.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  // Supprimer une image
  static async deleteImage(imageId) {
    try {
      const response = await fetch(`${ApiService.API_BASE_URL}/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ApiService.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer l'URL complète d'une image
  static getImageUrl(imageId) {
    if (!imageId) return null;
    
    // Si c'est déjà une URL complète (commence par http ou https)
    if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
      return imageId;
    }
    
    // Si c'est une URL relative (commence par /api/images/)
    if (imageId.startsWith('/api/images/')) {
      const baseUrl = ApiService.API_BASE_URL;
      return `${baseUrl}${imageId}`;
    }
    
    // Si c'est juste un ID, construire l'URL complète
    const baseUrl = ApiService.API_BASE_URL;
    return `${baseUrl}/api/images/${imageId}`;
  }

  // Récupérer l'URL d'une image redimensionnée (thumbnail)
  static getThumbnailUrl(imageId, width = 200, height = 200, quality = 80) {
    if (!imageId) return null;
    
    let imageUrl;
    
    // Si c'est déjà une URL complète (commence par http ou https)
    if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
      imageUrl = imageId;
    }
    // Si c'est une URL relative (commence par /api/images/)
    else if (imageId.startsWith('/api/images/')) {
      const baseUrl = ApiService.API_BASE_URL;
      imageUrl = `${baseUrl}${imageId}`;
    }
    // Si c'est juste un ID, construire l'URL complète
    else {
      const baseUrl = ApiService.API_BASE_URL;
      imageUrl = `${baseUrl}/api/images/${imageId}`;
    }
    
    // Ajouter les paramètres de redimensionnement
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      quality: quality.toString()
    });
    
    return `${imageUrl}?${params.toString()}`;
  }

  // Vérifier si une URL est une image depuis la base de données
  static isDbImage(imageUrl) {
    if (!imageUrl) return false;
    
    // Si c'est une URL complète qui contient /api/images/
    if (imageUrl.includes('/api/images/')) {
      return true;
    }
    
    // Si c'est juste un ID MongoDB (24 caractères hexadécimaux)
    if (/^[0-9a-fA-F]{24}$/.test(imageUrl)) {
      return true;
    }
    
    return false;
  }
}

export default ImageService; 
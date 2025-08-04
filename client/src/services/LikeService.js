// Configuration intelligente de l'URL de l'API selon l'environnement
const getApiBaseUrl = () => {
  // Si une variable d'environnement est définie, l'utiliser
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // En production, utiliser window.location.origin (même domaine)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  // En développement, utiliser l'URL par défaut
  // return 'http://localhost:5000';
};

const API_URL = getApiBaseUrl();

class LikeService {
  // Récupérer le token depuis localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('segarow_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Liker/Unliker un contenu
  async toggleLike(contentType, contentId) {
    try {
      const response = await fetch(`${API_URL}/api/likes/${contentType}/${contentId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Obtenir l'état de like d'un contenu
  async getLikeStatus(contentType, contentId) {
    try {
      const response = await fetch(`${API_URL}/api/likes/${contentType}/${contentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // [ADMIN] Obtenir la liste des likes pour un contenu
  async getContentLikes(contentType, contentId) {
    try {
      const response = await fetch(`${API_URL}/api/likes/admin/${contentType}/${contentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // [ADMIN] Obtenir les statistiques des likes
  async getLikesStats() {
    try {
      const response = await fetch(`${API_URL}/api/likes/admin/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default new LikeService(); 
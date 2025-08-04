import Log from '../models/Log.js';

class MongoLogService {
  // Écrire un log en base de données
  async log(level, message, data = null, userId = null, userEmail = null, actionType = 'other') {
    try {
      const timestamp = new Date();
      const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = String(timestamp.getHours()).padStart(2, '0'); // HH

      const logEntry = new Log({
        timestamp,
        level,
        message,
        data,
        date,
        hour,
        userId,
        userEmail,
        actionType
      });

      await logEntry.save();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'écriture du log en base:', error);
      return false;
    }
  }

  // Méthodes de logging par niveau
  async info(message, data = null, userId = null, userEmail = null, actionType = 'other') {
    return await this.log('INFO', message, data, userId, userEmail, actionType);
  }

  async warn(message, data = null, userId = null, userEmail = null, actionType = 'other') {
    return await this.log('WARN', message, data, userId, userEmail, actionType);
  }

  async error(message, data = null, userId = null, userEmail = null, actionType = 'other') {
    return await this.log('ERROR', message, data, userId, userEmail, actionType);
  }

  async debug(message, data = null, userId = null, userEmail = null, actionType = 'other') {
    return await this.log('DEBUG', message, data, userId, userEmail, actionType);
  }

  // Logger les actions d'administration
  async adminAction(userId, action, details = null) {
    const user = await this.getUserInfo(userId);
    return await this.info(`Action admin: ${action}`, {
      adminId: userId,
      action,
      details,
      timestamp: new Date().toISOString()
    }, userId, user?.email, 'admin_action');
  }

  // Logger les suppressions de comptes
  async accountDeletion(userId, email, reason, deletedData = null) {
    return await this.warn(`Suppression de compte: ${email}`, {
      userId,
      email,
      reason,
      deletedData,
      timestamp: new Date().toISOString()
    }, userId, email, 'account_deletion');
  }

  // Logger les nettoyages automatiques
  async cleanupAction(action, stats) {
    return await this.info(`Nettoyage automatique: ${action}`, {
      action,
      stats,
      timestamp: new Date().toISOString()
    }, null, null, 'cleanup');
  }

  // Obtenir les informations utilisateur
  async getUserInfo(userId) {
    try {
      const User = (await import('../models/User.js')).default;
      return await User.findById(userId).select('email username');
    } catch (error) {
      return null;
    }
  }

  // Obtenir les statistiques des logs
  async getLogStats() {
    try {
      const stats = await Log.getStats();
      if (stats.length === 0) {
        return {
          totalLogs: 0,
          totalSize: 0,
          totalSizeMB: '0.00',
          oldestLog: null,
          newestLog: null,
          byLevel: []
        };
      }
      
      const result = stats[0];
      return {
        ...result,
        totalSizeMB: result.totalSizeMB.toFixed(2)
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalLogs: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        oldestLog: null,
        newestLog: null,
        byLevel: []
      };
    }
  }

  // Obtenir les dates disponibles
  async getAvailableDates() {
    try {
      return await Log.getAvailableDates();
    } catch (error) {
      console.error('Erreur lors de la récupération des dates:', error);
      return [];
    }
  }

  // Obtenir les logs par date
  async getLogsByDate(date, page = 1, limit = 100) {
    try {
      const skip = (page - 1) * limit;
      const logs = await Log.find({ date })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email');

      const total = await Log.countDocuments({ date });

      return {
        logs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: skip + logs.length < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return {
        logs: [],
        pagination: {
          current: 1,
          total: 1,
          totalLogs: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  // Obtenir tous les logs avec pagination
  async getAllLogs(page = 1, limit = 100, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      let query = {};

      // Appliquer les filtres
      if (filters.level) {
        query.level = filters.level;
      }
      if (filters.actionType) {
        query.actionType = filters.actionType;
      }
      if (filters.date) {
        query.date = filters.date;
      }
      if (filters.userId) {
        query.userId = filters.userId;
      }

      const logs = await Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email');

      const total = await Log.countDocuments(query);

      return {
        logs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: skip + logs.length < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return {
        logs: [],
        pagination: {
          current: 1,
          total: 1,
          totalLogs: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  // Nettoyer les anciens logs
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const result = await Log.cleanupOldLogs(daysToKeep);
      return result.deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      return 0;
    }
  }

  // Exporter les logs en JSON
  async exportLogs(date = null, format = 'json') {
    try {
      let query = {};
      if (date) {
        query.date = date;
      }

      const logs = await Log.find(query)
        .sort({ timestamp: -1 })
        .populate('userId', 'username email');

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(logs);
      }

      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'export des logs:', error);
      throw error;
    }
  }

  // Convertir en CSV avec informations pertinentes
  convertToCSV(logs) {
    const headers = [
      'Date et Heure',
      'Niveau',
      'Action',
      'Type',
      'Utilisateur',
      'Email',
      'Rôle',
      'IP',
      'Détails',
      'Contenu/Article',
      'Compteur Likes'
    ];
    
    const rows = logs.map(log => {
      const data = log.data || {};
      const timestamp = new Date(log.timestamp).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Extraire les informations pertinentes selon le type d'action
      let details = '';
      let contentTitle = '';
      let likeCount = '';

      if (log.message.includes('Création de compte')) {
        details = `Compte créé: ${data.username || 'N/A'}`;
      } else if (log.message.includes('Connexion')) {
        details = `Connexion depuis ${data.ip || 'N/A'}`;
      } else if (log.message.includes('Déconnexion')) {
        details = `Déconnexion depuis ${data.ip || 'N/A'}`;
      } else if (log.message.includes('Modification de profil')) {
        const mods = data.modifications || {};
        const changes = [];
        if (mods.usernameChanged) changes.push('Nom d\'utilisateur');
        if (mods.passwordChanged) changes.push('Mot de passe');
        details = changes.length > 0 ? `Modifications: ${changes.join(', ')}` : 'Aucune modification';
      } else if (log.message.includes('Like sur') || log.message.includes('Dislike sur')) {
        contentTitle = data.contentTitle || 'N/A';
        likeCount = data.likeCount || 'N/A';
        details = `${log.message.includes('Like') ? 'Like' : 'Dislike'} sur ${data.contentType || 'contenu'}`;
      } else if (log.message.includes('Suppression de compte')) {
        const deletedData = data.deletedData || {};
        details = `Données supprimées: ${deletedData.likes || 0} likes, ${deletedData.articles || 0} articles, ${deletedData.reviews || 0} reviews, ${deletedData.comments || 0} commentaires`;
      } else if (log.message.includes('nettoyage_automatique_logs')) {
        details = `Nettoyage automatique: ${data.deletedCount || 0} logs supprimés`;
      } else if (log.message.includes('Nettoyage automatique')) {
        details = `Nettoyage automatique: ${data.deletedCount || 0} logs supprimés`;
      } else {
        details = JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '');
      }

      return [
        timestamp,
        log.level,
        log.message,
        log.actionType,
        data.username || (log.userId?.username) || (typeof data.userId === 'string' ? data.userId.substring(0, 8) + '...' : 'N/A'),
        log.userEmail || 'N/A',
        data.role || 'N/A',
        data.ip || 'N/A',
        details,
        contentTitle,
        likeCount
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => {
        // Échapper les guillemets et les virgules dans les champs
        const escapedField = String(field).replace(/"/g, '""');
        return `"${escapedField}"`;
      }).join(','))
      .join('\n');

    return csvContent;
  }
}

export default new MongoLogService(); 
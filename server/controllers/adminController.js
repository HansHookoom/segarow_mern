import User from '../models/User.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Log from '../models/Log.js';
import mongoLogService from '../services/mongoLogService.js';
import Joi from 'joi';

// Schémas de validation
const updateRoleSchema = Joi.object({
  role: Joi.string().valid('visitor', 'user', 'moderator', 'admin').required()
});

// Obtenir tous les utilisateurs
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', sort = 'createdAt' } = req.query;

    // Construire la requête
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    // Options de tri
    const sortOptions = {};
    if (sort === 'username') sortOptions.username = 1;
    else if (sort === 'email') sortOptions.email = 1;
    else if (sort === 'lastLogin') sortOptions.lastLogin = -1;
    else sortOptions.createdAt = -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Récupérer les utilisateurs
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Compter le total
    const total = await User.countDocuments(query);

    // Logger la consultation - SUPPRIMÉ pour réduire le bruit dans les logs

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Obtenir un utilisateur par ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer les statistiques de l'utilisateur
    const userStats = await Promise.all([
      Article.countDocuments({ author: id }),
      Review.countDocuments({ author: id }),
      Comment.countDocuments({ author: id }),
      Like.countDocuments({ user: id })
    ]);

    const stats = {
      articles: userStats[0],
      reviews: userStats[1],
      comments: userStats[2],
      likes: userStats[3]
    };

    res.json({ user, stats });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

// Mettre à jour le rôle d'un utilisateur
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateRoleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { role } = value;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher de modifier son propre rôle
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    // Empêcher de rétrograder un autre admin
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({ error: 'Vous ne pouvez pas rétrograder un autre administrateur' });
    }

    // Mettre à jour le rôle
    user.role = role;
    await user.save();

    // Logger la modification
    await mongoLogService.info('Rôle utilisateur modifié', {
      targetUserId: user._id,
      oldRole: user.role,
      newRole: role,
      adminId: req.user._id,
      ip: req.ip
    });

    res.json({
      message: 'Rôle mis à jour avec succès',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification du rôle:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du rôle' });
  }
};

// Supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher de supprimer son propre compte
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Empêcher de supprimer un autre admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer un autre administrateur' });
    }

    // Supprimer les données associées
    await Promise.all([
      Article.deleteMany({ author: id }),
      Review.deleteMany({ author: id }),
      Comment.deleteMany({ author: id }),
      Like.deleteMany({ user: id }),
      User.findByIdAndDelete(id)
    ]);

    // Logger la suppression
    await mongoLogService.info('Utilisateur supprimé par admin', {
      targetUserId: user._id,
      targetUsername: user.username,
      adminId: req.user._id,
      ip: req.ip
    });

    res.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
};

// Obtenir les statistiques globales
export const getStats = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    // Construire le filtre de date
    let dateFilter = {};
    if (period === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'year') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } };
    }

    // Récupérer les statistiques
    const stats = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      Article.countDocuments(dateFilter),
      Review.countDocuments(dateFilter),
      Comment.countDocuments(dateFilter),
      Like.countDocuments(dateFilter),
      Log.countDocuments({ level: 'error', ...dateFilter })
    ]);

    // Statistiques par rôle
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Statistiques d'activité récente
    const recentActivity = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Article.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Review.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    const result = {
      total: {
        users: stats[0],
        admins: stats[1],
        activeUsers: stats[2],
        articles: stats[3],
        reviews: stats[4],
        comments: stats[5],
        likes: stats[6],
        errors: stats[7]
      },
      roles: roleStats,
      recentActivity: {
        activeUsers24h: recentActivity[0],
        newArticles24h: recentActivity[1],
        newReviews24h: recentActivity[2]
      },
      period
    };

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

// Obtenir les logs
export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, level = '', actionType = '', date = '', search = '' } = req.query;

    // Construire la requête
    const query = {};
    
    if (level) {
      query.level = level;
    }
    
    if (actionType) {
      query.actionType = actionType;
    }
    
    if (date) {
      query.date = date;
    }
    
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { actionType: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Récupérer les logs avec les informations utilisateur
    const logs = await Log.find(query)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    // Compter le total
    const total = await Log.countDocuments(query);

    // Obtenir les statistiques complètes
    const statsResult = await Log.getStats();
    const stats = statsResult[0] || {
      totalLogs: 0,
      totalSize: 0,
      totalSizeMB: 0,
      oldestLog: null,
      newestLog: null
    };

    // Obtenir les dates disponibles
    const availableDates = await Log.getAvailableDates();

    res.json({
      logs,
      stats: {
        totalLogs: stats.totalLogs,
        totalSizeMB: parseFloat(stats.totalSizeMB || 0).toFixed(2),
        oldestLog: stats.oldestLog,
        newestLog: stats.newestLog
      },
      availableDates,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des logs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des logs',
      details: error.message
    });
  }
};

// Télécharger les logs
export const downloadLogs = async (req, res) => {
  try {
    const { format = 'json', date = '' } = req.query;

    // Construire la requête
    const query = {};
    if (date) {
      query.date = date;
    }

    // Récupérer les logs
    const logs = await Log.find(query)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 });

    if (format === 'csv') {
      // Générer le CSV
      const csvHeader = 'Timestamp,Niveau,Message,Type,Utilisateur,Données\n';
      const csvRows = logs.map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = log.level;
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const actionType = log.actionType || 'N/A';
        const user = log.userEmail || (log.userId?.email) || 'N/A';
        const data = log.data ? `"${JSON.stringify(log.data).replace(/"/g, '""')}"` : 'N/A';
        
        return `${timestamp},${level},${message},${actionType},${user},${data}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="segarow-logs-${date || 'all'}.csv"`);
      res.send(csvContent);
    } else {
      // Générer le JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="segarow-logs-${date || 'all'}.json"`);
      res.json(logs);
    }

  } catch (error) {
    console.error('❌ Erreur lors du téléchargement des logs:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement des logs' });
  }
}; 
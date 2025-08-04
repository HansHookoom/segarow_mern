import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  level: { 
    type: String, 
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'], 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed,
    default: null 
  },
  // Métadonnées pour faciliter les requêtes
  date: {
    type: String, // Format YYYY-MM-DD pour faciliter les requêtes par jour
    required: true
  },
  hour: {
    type: String, // Format HH pour faciliter les requêtes par heure
    required: true
  },
  // Informations sur l'utilisateur/admin qui a généré le log
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  // Type d'action pour catégoriser les logs
  actionType: {
    type: String,
    enum: ['admin_action', 'account_deletion', 'cleanup', 'system_error', 'user_action', 'other'],
    default: 'other'
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour optimiser les requêtes
logSchema.index({ date: 1, timestamp: -1 });
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ actionType: 1, timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });

// Méthode pour obtenir la date au format YYYY-MM-DD
logSchema.pre('save', function(next) {
  if (!this.date || !this.hour) {
    const date = new Date(this.timestamp || Date.now());
    this.date = date.toISOString().split('T')[0]; // YYYY-MM-DD
    this.hour = String(date.getHours()).padStart(2, '0'); // HH
  }
  next();
});

// Méthode statique pour obtenir les logs par jour
logSchema.statics.getLogsByDate = function(date) {
  return this.find({ date }).sort({ timestamp: -1 });
};

  // Méthode statique pour obtenir les statistiques
  logSchema.statics.getStats = function() {
    return this.aggregate([
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          oldestLog: { $min: "$timestamp" },
          newestLog: { $max: "$timestamp" }
        }
      },
      {
        $project: {
          _id: 0,
          totalLogs: 1,
          totalSize: { $multiply: ["$totalLogs", 500] }, // Estimation de la taille
          totalSizeMB: { $divide: [{ $multiply: ["$totalLogs", 500] }, 1024 * 1024] },
          oldestLog: 1,
          newestLog: 1
        }
      }
    ]);
  };

// Méthode statique pour nettoyer les anciens logs
logSchema.statics.cleanupOldLogs = function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
};

// Méthode statique pour obtenir les dates disponibles
logSchema.statics.getAvailableDates = function() {
  return this.distinct('date');
};

export default mongoose.model('Log', logSchema); 
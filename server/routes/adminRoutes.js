import express from 'express';
import { auth, requireAdmin } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getStats,
  getLogs,
  downloadLogs
} from '../controllers/adminController.js';
import autoCleanupService from '../services/autoCleanupService.js';

const router = express.Router();

// Routes d'administration (nécessitent le rôle admin)
router.get('/users', auth, requireAdmin, getAllUsers);
router.get('/users/:id', auth, requireAdmin, getUserById);
router.put('/users/:id/role', auth, requireAdmin, updateUserRole);
router.delete('/users/:id', auth, requireAdmin, deleteUser);

// Routes pour les statistiques et logs
router.get('/stats', auth, requireAdmin, getStats);
router.get('/logs', auth, requireAdmin, getLogs);
router.get('/logs/download', auth, requireAdmin, downloadLogs);

// Routes pour le service de nettoyage automatique
router.get('/cleanup/status', auth, requireAdmin, (req, res) => {
  const status = autoCleanupService.getStatus();
  res.json({
    isRunning: status.isRunning,
    interval: status.interval,
    nextCleanup: status.nextCleanup,
    config: {
      inactiveAccountDays: process.env.INACTIVE_ACCOUNT_DAYS || 365,
      cleanupInterval: process.env.CLEANUP_INTERVAL || 24 * 60 * 60 * 1000
    }
  });
});

router.post('/cleanup/force', auth, requireAdmin, async (req, res) => {
  try {
    await autoCleanupService.forceCleanup();
    res.json({ message: 'Nettoyage forcé effectué avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du nettoyage forcé' });
  }
});

router.post('/cleanup/start', auth, requireAdmin, (req, res) => {
  autoCleanupService.start();
  res.json({ message: 'Service de nettoyage démarré' });
});

router.post('/cleanup/stop', auth, requireAdmin, (req, res) => {
  autoCleanupService.stop();
  res.json({ message: 'Service de nettoyage arrêté' });
});

export default router; 
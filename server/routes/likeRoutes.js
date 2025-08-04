import express from 'express';
import { auth, requireAdmin } from '../middleware/auth.js';
import {
  toggleLike,
  getLikeStatus,
  getContentLikes,
  getLikesStats,
  getLikesDiagnostic,
  syncLikeCounters,
  cleanupOrphanedLikes
} from '../controllers/likeController.js';

const router = express.Router();

// Routes admin (nécessitent l'authentification + droits admin) - DOIVENT ÊTRE EN PREMIER
router.get('/admin/stats', auth, requireAdmin, getLikesStats);
router.get('/admin/diagnostic', auth, requireAdmin, getLikesDiagnostic);
router.post('/admin/sync-counters', auth, requireAdmin, syncLikeCounters);
router.post('/admin/cleanup-orphaned-likes', auth, requireAdmin, cleanupOrphanedLikes);
router.get('/admin/:contentType/:contentId', auth, requireAdmin, getContentLikes);

// Route spécifique pour les likes de commentaires (redirige vers la route générale)
router.post('/comment/:commentId', auth, (req, res, next) => {
  // Transformer les paramètres pour correspondre au contrôleur de likes
  req.params.contentType = 'comment';
  req.params.contentId = req.params.commentId;
  next();
}, toggleLike);

// Routes publiques (nécessitent l'authentification) - EN DERNIER
router.post('/:contentType/:contentId', auth, toggleLike);
router.get('/:contentType/:contentId', auth, getLikeStatus);

export default router; 
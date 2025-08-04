import express from 'express';
import { auth, optionalAuth } from '../middleware/auth.js';
import {
  getArticleComments,
  getReviewComments,
  createComment,
  deleteComment,
  forceDeleteComment
} from '../controllers/commentController.js';

const router = express.Router();

// Routes pour récupérer les commentaires (public avec auth optionnelle)
router.get('/news/:articleId', optionalAuth, getArticleComments);
router.get('/review/:reviewId', optionalAuth, getReviewComments);

// Routes pour créer et supprimer des commentaires (authentification requise)
router.post('/', auth, createComment);
router.delete('/:commentId', auth, deleteComment);
router.delete('/:commentId/force', auth, forceDeleteComment);

export default router; 
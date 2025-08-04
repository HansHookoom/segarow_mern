import express from 'express';
import { auth, requireAdmin } from '../middleware/auth.js';
import {
  upload,
  uploadImage,
  downloadImage,
  deleteImage,
  getUserImages,
  getImageInfo,
  getAllImages
} from '../controllers/imageController.js';

const router = express.Router();

// Routes protégées (doivent être avant les routes avec paramètres)
router.get('/', auth, requireAdmin, getAllImages); // Route pour lister toutes les images (admin)
router.post('/upload', auth, upload.single('image'), uploadImage);
router.get('/user/images', auth, getUserImages);
router.get('/info/:fileId', auth, getImageInfo);

// Route publique - Télécharger une image par ID (doit être après les routes spécifiques)
router.get('/:fileId', downloadImage);
router.delete('/:fileId', auth, deleteImage);

export default router; 
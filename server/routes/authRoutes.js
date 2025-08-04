import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout
} from '../controllers/authController.js';

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshAccessToken);

// Routes protégées
router.get('/me', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.delete('/delete-account', auth, deleteAccount);
router.post('/logout', auth, logout);

export default router; 
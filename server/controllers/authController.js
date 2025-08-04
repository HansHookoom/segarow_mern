import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Article from '../models/Article.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Joi from 'joi';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoLogService from '../services/mongoLogService.js';

// Charger les variables d'environnement
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Schémas Joi avec validation renforcée des mots de passe
const passwordSchema = Joi.string()
  .min(12) // Augmenter la longueur minimale
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .disallow('password', '123456', 'qwerty', 'admin', 'user', 'test') // Mots de passe interdits
  .messages({
    'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial (@$!%*?&)',
    'string.min': 'Le mot de passe doit contenir au moins 12 caractères',
    'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
    'any.invalid': 'Ce mot de passe est trop commun, veuillez en choisir un autre'
  });

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema.required(),
  username: Joi.string().min(2).max(50).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).max(128).required() // Pour la connexion, on accepte tout mot de passe valide
});

const updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(50).optional(),
  currentPassword: Joi.string().min(1).max(128).optional(),
  newPassword: passwordSchema.optional()
});

const deleteAccountSchema = Joi.object({
  password: Joi.string().min(1).max(128).required(),
  confirmText: Joi.string().valid('SUPPRIMER MON COMPTE').required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema.required()
});

// Inscription
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email, password, username } = value;

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = new User({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      role: 'visitor'
    });

    await user.save();

    // Logger la création du compte
    try {
      await mongoLogService.info(
        'Création de compte utilisateur',
        { 
          userId: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user._id,
        user.email,
        'user_action'
      );
    } catch (logError) {
      console.error('❌ Erreur lors du log de création de compte:', logError.message);
    }

    // Générer le token d'accès avec une durée très courte
    const accessToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' } // Durée très courte pour plus de sécurité
    );

    // Générer un refresh token avec une durée d'1 jour
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '1d' } // 1 jour comme demandé
    );

    // Stocker le refresh token hashé dans la base de données et mettre à jour lastLoginAt
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = refreshTokenHash;
    user.lastLoginAt = new Date(); // Mettre à jour la dernière connexion
    await user.save();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, username: user.username, role: user.role }
    });
  } catch (error) {
    // En production, ne pas exposer les détails d'erreur
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : error.message;
    res.status(500).json({ message: errorMessage });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email, password } = value;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants incorrects' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants incorrects' });
    }

    // Générer le token d'accès avec une durée très courte
    const accessToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' } // Durée très courte pour plus de sécurité
    );

    // Générer un refresh token avec une durée plus longue
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Stocker le refresh token hashé dans la base de données et mettre à jour lastLoginAt
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshToken = refreshTokenHash;
    user.lastLoginAt = new Date(); // Mettre à jour la dernière connexion
    await user.save();

    // Logger la connexion
    await mongoLogService.info(
      'Connexion utilisateur',
      { 
        userId: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user._id,
      user.email,
      'user_action'
    );

    res.json({
      message: 'Connexion réussie',
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Profil utilisateur
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { username, currentPassword, newPassword } = value;
    const userId = req.user._id;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel si un nouveau mot de passe est fourni
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Mot de passe actuel requis' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }

      // Hasher le nouveau mot de passe
      user.password = await bcrypt.hash(newPassword, 12);
    }

    // Mettre à jour le nom d'utilisateur si fourni
    if (username) {
      user.username = username;
    }

    await user.save();

    res.json({
      message: 'Profil mis à jour avec succès',
      user: { id: user._id, email: user.email, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer le compte
const deleteAccount = async (req, res) => {
  try {
    const { error, value } = deleteAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { password, confirmText } = value;
    const userId = req.user._id;

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // 1. Supprimer tous les likes de cet utilisateur
    const deletedLikes = await Like.deleteMany({ user: userId });

    // 2. Décrémenter les compteurs de likes des contenus
    if (deletedLikes.deletedCount > 0) {
      const userLikes = await Like.find({ user: userId }).lean();
      
      for (const like of userLikes) {
        if (like.contentType === 'article') {
          await Article.findByIdAndUpdate(like.contentId, { $inc: { likeCount: -1 } });
        } else if (like.contentType === 'review') {
          await Review.findByIdAndUpdate(like.contentId, { $inc: { likeCount: -1 } });
        }
      }
    }

    // 3. Traiter les articles créés par cet utilisateur
    const userArticles = await Article.find({ author: userId });
    if (userArticles.length > 0) {
      await Like.deleteMany({ 
        contentType: 'article', 
        contentId: { $in: userArticles.map(a => a._id) } 
      });
      await Article.deleteMany({ author: userId });
    }

    // 4. Traiter les reviews créées par cet utilisateur
    const userReviews = await Review.find({ author: userId });
    if (userReviews.length > 0) {
      await Like.deleteMany({ 
        contentType: 'review', 
        contentId: { $in: userReviews.map(r => r._id) } 
      });
      await Review.deleteMany({ author: userId });
    }

    // 5. Traiter les commentaires
    const userComments = await Comment.find({ author: userId });
    let deletedCommentsCount = 0;
    let softDeletedCommentsCount = 0;

    for (const comment of userComments) {
      const canBeHardDeleted = await comment.canBeHardDeleted();
      if (canBeHardDeleted) {
        await Comment.findByIdAndDelete(comment._id);
        deletedCommentsCount++;
      } else {
        await comment.softDelete();
        softDeletedCommentsCount++;
      }
    }

    // 6. Supprimer les likes sur les commentaires
    await Like.deleteMany({ 
      contentType: 'comment', 
      contentId: { $in: userComments.map(c => c._id) } 
    });

    // Logger la suppression du compte avant de supprimer l'utilisateur
    try {
      await mongoLogService.info(
        'Suppression de compte utilisateur',
        { 
          userId: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          deletedData: {
            likes: deletedLikes.deletedCount,
            articles: userArticles.length,
            reviews: userReviews.length,
            comments: deletedCommentsCount,
            anonymizedComments: softDeletedCommentsCount
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        user._id,
        user.email,
        'user_action'
      );
    } catch (logError) {
      console.error('❌ Erreur lors du log de suppression de compte:', logError.message);
    }

    // 7. Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    const message = user.role === 'admin' 
      ? 'Votre compte administrateur a été supprimé définitivement. Vous avez perdu tous vos privilèges d\'administration. Au revoir !'
      : 'Votre compte a été supprimé définitivement. Au revoir !';

    res.json({
      message,
      deletedData: {
        likes: deletedLikes.deletedCount,
        articles: userArticles.length,
        reviews: userReviews.length,
        comments: deletedCommentsCount,
        anonymizedComments: softDeletedCommentsCount,
        wasAdmin: user.role === 'admin'
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Demander la réinitialisation du mot de passe
const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email } = value;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return res.json({ message: 'Si cet email existe dans notre base de données, un lien de réinitialisation vous a été envoyé.' });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Sauvegarder le token hashé et l'expiration (1 heure)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Config nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Contenu de l'email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'SEGAROW - Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bonjour ${user.username},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe SEGAROW.</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
          <p style="margin-top: 20px; color: #666;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Si cet email existe dans notre base de données, un lien de réinitialisation vous a été envoyé.' });
  } catch (error) {
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : error.message;
    res.status(500).json({ message: errorMessage });
  }
};

// Réinitialiser le mot de passe
const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { token, newPassword } = value;

    // Hasher le token pour la comparaison
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Trouver l'utilisateur avec ce token valide
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe et supprimer le token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : error.message;
    res.status(500).json({ message: errorMessage });
  }
};

// Rafraîchir le token d'accès
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token requis' });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(400).json({ message: 'Token invalide' });
    }

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que le refresh token est toujours valide en base
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (user.refreshToken !== refreshTokenHash) {
      return res.status(400).json({ message: 'Refresh token invalide' });
    }

    // Générer un nouveau token d'accès
    const newAccessToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Générer un nouveau refresh token
    const newRefreshToken = jwt.sign(
      { 
        userId: user._id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Mettre à jour le refresh token en base
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    user.refreshToken = newRefreshTokenHash;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(400).json({ message: 'Token invalide' });
  }
};

// Déconnexion
const logout = async (req, res) => {
  try {
    const userId = req.user._id;

    // Supprimer le refresh token de l'utilisateur
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    // Logger la déconnexion
    await mongoLogService.info(
      'Déconnexion utilisateur',
      { 
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      userId,
      req.user.email,
      'user_action'
    );

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout
}; 
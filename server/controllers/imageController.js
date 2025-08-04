import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import mongoLogService from '../services/mongoLogService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration GridFS pour le stockage des images
const storage = new GridFsStorage({
  url: config.MONGODB_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  file: (req, file) => {
    return {
      bucketName: 'uploads',
      filename: `${Date.now()}-${file.originalname}`,
      metadata: {
        uploadedBy: req.user ? req.user._id : null,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size
      }
    };
  }
});

// Configuration multer avec validation
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB par défaut
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'), false);
    }
    
    // Vérifier l'extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Extension de fichier non supportée.'), false);
    }
    
    cb(null, true);
  }
});

// Upload d'une image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileId = req.file.id;
    const fileName = req.file.filename;
    const fileSize = req.file.size;
    const contentType = req.file.contentType;

    // Logger l'upload
    await mongoLogService.info('Image uploadée par administrateur', {
      fileId: fileId,
      fileName: fileName,
      originalName: req.file.originalname,
      fileSize: fileSize,
      contentType: contentType,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.status(201).json({
      message: 'Image uploadée avec succès',
      fileId: fileId,
      fileName: fileName,
      fileSize: fileSize,
      contentType: contentType,
      url: `/api/images/${fileId}`
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    
    await mongoLogService.error('Erreur upload image', {
      error: error.message,
      adminId: req.user?._id,
      adminUsername: req.user?.username,
      adminEmail: req.user?.email,
      ip: req.ip
    }, req.user?._id, req.user?.email, 'admin_action');

    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
};

// Télécharger une image avec redimensionnement optionnel
export const downloadImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { width, height, quality } = req.query;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    // Vérifier que la connexion MongoDB est établie
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    // Vérifier si le fichier existe
    const files = bucket.find({ _id: new mongoose.Types.ObjectId(fileId) });
    const fileArray = await files.toArray();
    
    if (fileArray.length === 0) {
      // Retourner une image par défaut au lieu d'une erreur 404
      
      // Rediriger vers une image par défaut ou retourner une image placeholder
      const defaultImagePath = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'img', 'banner.png');
      
      if (fs.existsSync(defaultImagePath)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Access-Control-Allow-Origin', '*');
        fs.createReadStream(defaultImagePath).pipe(res);
        return;
      } else {
        // Si l'image par défaut n'existe pas, retourner une erreur 404
        return res.status(404).json({ error: 'Image non trouvée' });
      }
    }

    const file = fileArray[0];
    
    // Si des paramètres de redimensionnement sont fournis
    if (width || height || quality) {
      try {
        // Utiliser Sharp pour redimensionner
        const sharp = await import('sharp');
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
        
        let transform = sharp.default();
        
        if (width || height) {
          transform = transform.resize(parseInt(width) || null, parseInt(height) || null);
        }
        
        if (quality) {
          transform = transform.jpeg({ quality: parseInt(quality) });
        }

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Access-Control-Allow-Origin', '*');

        downloadStream.pipe(transform).pipe(res);
        return;
      } catch (sharpError) {
        console.error('❌ Erreur Sharp:', sharpError);
        // Fallback vers l'image originale si Sharp échoue
      }
    }

    // Créer le stream de téléchargement pour l'image originale
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    
    // Gérer les erreurs du stream
    downloadStream.on('error', (error) => {
      console.error('❌ Erreur lors du téléchargement:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
      }
    });

    // Définir les en-têtes de réponse
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', file.length);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Streamer le fichier
    downloadStream.pipe(res);

  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
  }
};

// Supprimer une image
export const deleteImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    // Vérifier que la connexion MongoDB est établie
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    // Vérifier que l'utilisateur est propriétaire de l'image ou admin
    const files = bucket.find({ _id: new mongoose.Types.ObjectId(fileId) });
    const fileArray = await files.toArray();
    
    if (fileArray.length === 0) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    const file = fileArray[0];
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    
        // Vérifier les permissions
    // Permettre la suppression si :
    // 1. L'utilisateur est le propriétaire de l'image
    // 2. L'utilisateur est admin
    // 3. L'image n'a pas de propriétaire (uploadedBy est null ou undefined)
    const isOwner = file.metadata?.uploadedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const hasNoOwner = !file.metadata?.uploadedBy;

    if (!isOwner && !isAdmin && !hasNoOwner) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer cette image' });
    }

    // Supprimer le fichier
    await bucket.delete(new mongoose.Types.ObjectId(fileId));

    // Logger la suppression
    await mongoLogService.info('Image supprimée par administrateur', {
      fileId: fileId,
      fileName: file.filename,
      originalName: file.metadata?.originalName || 'Non défini',
      fileSize: file.length,
      contentType: file.contentType,
      adminId: req.user._id,
      adminUsername: req.user.username,
      adminEmail: req.user.email,
      wasOwner: isOwner,
      ip: req.ip
    }, req.user._id, req.user.email, 'admin_action');

    res.json({ message: 'Image supprimée avec succès' });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    
    await mongoLogService.error('Erreur suppression image', {
      error: error.message,
      fileId: req.params.fileId,
      adminId: req.user?._id,
      adminUsername: req.user?.username,
      adminEmail: req.user?.email,
      ip: req.ip
    }, req.user?._id, req.user?.email, 'admin_action');

    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
};

// Obtenir les images d'un utilisateur
export const getUserImages = async (req, res) => {
  try {
    // Vérifier que la connexion MongoDB est établie
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const files = bucket.find({ 'metadata.uploadedBy': new mongoose.Types.ObjectId(req.user._id) });
    const fileArray = await files.toArray();

    // Trier par date d'upload (du plus récent au plus ancien)
    const sortedFiles = fileArray.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    const images = sortedFiles.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName || file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      url: `/api/images/${file._id}`
    }));

    res.json({
      images: images,
      count: images.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des images:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des images' });
  }
};

// Obtenir les informations d'une image
export const getImageInfo = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'ID de fichier invalide' });
    }

    // Vérifier que la connexion MongoDB est établie
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    const files = bucket.find({ _id: new mongoose.Types.ObjectId(fileId) });
    const fileArray = await files.toArray();
    
    if (fileArray.length === 0) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    const file = fileArray[0];
    
    // Vérifier les permissions (propriétaire ou admin)
    if (file.metadata?.uploadedBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'accéder à cette image' });
    }

    res.json({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName || file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/images/${file._id}`
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des informations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
  }
};

// Obtenir toutes les images (pour l'administration) - OPTIMISÉ
export const getAllImages = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // Vérifier que la connexion MongoDB est établie
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    // Construire la requête
    let query = {};
    if (search) {
      query.filename = { $regex: search, $options: 'i' };
    }

    // Utiliser skip et limit directement sur la requête MongoDB
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Compter le total avec la même requête en utilisant la collection directement
    const collection = mongoose.connection.db.collection('uploads.files');
    const total = await collection.countDocuments(query);

    // Récupérer les fichiers avec pagination et tri
    const files = bucket.find(query)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const fileArray = await files.toArray();

    const images = fileArray.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName || file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/images/${file._id}`,
      uploadedBy: file.metadata?.uploadedBy || null
    }));

    res.json({
      images: images,
      count: images.length,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des images:', error);
    
    await mongoLogService.error('Erreur récupération images admin', {
      error: error.message,
      adminId: req.user?._id,
      ip: req.ip
    });

    res.status(500).json({ error: 'Erreur lors de la récupération des images' });
  }
}; 
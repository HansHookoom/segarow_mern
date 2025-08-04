import React, { useState, useEffect } from 'react';
import ImageService from '../../../services/ImageService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './ImageManager.module.css';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Pagination from '../../ui/Pagination/Pagination';
import ImageWithSkeleton from '../../ui/ImageWithSkeleton/ImageWithSkeleton';
import SkeletonLoader from '../../ui/SkeletonLoader/SkeletonLoader';

const ImageManager = ({ onImageSelect, selectedImage, showSelector = false, onClose }) => {
  const { t, i18n } = useTranslation();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(8);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    loadImages(currentPage);
  }, [currentPage]);

  // Gérer le scroll du body pour éviter le double scroll
  useEffect(() => {
    // Bloquer le scroll du body quand le composant est monté
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Restaurer le scroll quand le composant est démonté
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const loadImages = async (page = 1) => {
    try {
      setLoading(true);
      const result = await ImageService.getImages(page, imagesPerPage);
      setImages(result.images);
      setPagination(result.pagination);
    } catch (error) {
      // Erreur chargement images
      setError(t('imageManager.loadError', { message: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error(t('imageManager.uploadTypeError'));
      return;
    }

    // Vérifier la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('imageManager.uploadSizeError'));
      return;
    }

    try {
      setUploading(true);
      setError('');
      const result = await ImageService.uploadImage(file);
      toast.success(t('imageManager.uploadSuccess'));
      
      // Recharger la liste des images
      await loadImages(currentPage);
      
      // Réinitialiser l'input
      event.target.value = '';
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      // Erreur upload
      toast.error(t('imageManager.uploadError', { message: error.message }));
      setError(t('imageManager.uploadError', { message: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!window.confirm(t('imageManager.deleteConfirm'))) {
      return;
    }

    try {
      await ImageService.deleteImage(imageId);
      toast.success(t('imageManager.deleteSuccess'));
      await loadImages(currentPage);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      toast.error(error.message || t('imageManager.deleteError'));
      setError(error.message || t('imageManager.deleteError'));
    }
  };

  const handleImageSelect = (image) => {
    if (onImageSelect) {
      onImageSelect(`/api/images/${image.id}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour changer de page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      {/* Overlay pour bloquer les interactions avec l'arrière-plan */}
      <div className={styles.overlay}></div>
      
      <div className={styles.imageManager}>
        {/* Bouton de fermeture positionné en absolu */}
        {(onClose || showSelector) && (
          <button 
            onClick={onClose || (() => {})} 
            className={styles.closeButton}
            title={t('imageManager.close')}
          >
            ✕
          </button>
        )}
        
        <div className={styles.header}>
          <h3>
            <AnimatedText deps={[i18n.language]}>
              {t('imageManager.title')}
            </AnimatedText>
          </h3>
          <div className={styles.uploadSection}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className={styles.fileInput}
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className={styles.uploadButton}>
              <AnimatedText deps={[i18n.language]}>
                {uploading ? t('imageManager.uploading') : t('imageManager.upload')}
              </AnimatedText>
            </label>
          </div>
        </div>

        {error && <div className={styles.error}>
          <AnimatedText deps={[i18n.language]}>
            {error}
          </AnimatedText>
        </div>}
        {success && <div className={styles.success}>
          <AnimatedText deps={[i18n.language]}>
            {success}
          </AnimatedText>
        </div>}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.skeletonGrid}>
              {[...Array(8)].map((_, index) => (
                <div key={index} className={styles.skeletonCard}>
                  <SkeletonLoader
                    height="150px"
                    borderRadius="8px"
                    className="dark"
                  />
                  <div style={{ padding: '10px' }}>
                    <SkeletonLoader
                      height="16px"
                      width="80%"
                      borderRadius="4px"
                      className="dark"
                      style={{ marginBottom: '8px' }}
                    />
                    <SkeletonLoader
                      height="14px"
                      width="60%"
                      borderRadius="4px"
                      className="dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.imageGrid}>
              {images.length === 0 ? (
                <div className={styles.noImages}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('imageManager.noImages')}
                  </AnimatedText>
                </div>
              ) : (
                images.map((image) => (
                  <div 
                    key={image.id} 
                    className={`${styles.imageCard} ${
                      selectedImage === `/api/images/${image.id}` ? styles.selected : ''
                    }`}
                  >
                    <div className={styles.imageWrapper}>
                      <ImageWithSkeleton
                        src={ImageService.getThumbnailUrl(image.id, 200, 200, 80)}
                        alt={image.originalName}
                        className={styles.image}
                        skeletonHeight="150px"
                        skeletonProps={{
                          borderRadius: '8px',
                          className: 'dark'
                        }}
                      />
                      {showSelector && (
                        <div 
                          className={styles.selectOverlay}
                          onClick={() => handleImageSelect(image)}
                        >
                          <span>
                            <AnimatedText deps={[i18n.language]}>
                              {t('imageManager.select')}
                            </AnimatedText>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.imageInfo}>
                      <p className={styles.imageName} title={image.originalName}>
                        {image.originalName}
                      </p>
                      <p className={styles.imageSize}>{formatFileSize(image.size)}</p>
                      <div className={styles.imageActions}>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleImageDelete(image.id)}
                        >
                          <AnimatedText deps={[i18n.language]}>
                            {t('imageManager.delete')}
                          </AnimatedText>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ImageManager; 
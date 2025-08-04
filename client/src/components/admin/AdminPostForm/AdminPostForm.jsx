import React, { useState, useEffect } from 'react';
import ArticleService from '../../../services/ArticleService';
import ReviewService from '../../../services/ReviewService';
import ImageManager from '../../../components/admin/ImageManager/ImageManager';
import ImageService from '../../../services/ImageService';
import PlatformSelect from '../../../components/ui/PlatformSelect/PlatformSelect';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './AdminPostForm.module.css';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';

const AdminPostForm = ({ type, initialData, onSubmit, onCancel }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image: '',
    secondaryImage: '',
    readingTime: '',
    // Champs spécifiques aux reviews UNIQUEMENT
    rating: '',
    gameTitle: '',
    platform: '',
    genre: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showSecondaryImageSelector, setShowSecondaryImageSelector] = useState(false);
  const [showImageSelectorForEditor, setShowImageSelectorForEditor] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Charger les données initiales si modification
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        excerpt: initialData.excerpt || '',
        content: initialData.content || '',
        image: initialData.image || '',
        secondaryImage: initialData.secondaryImage || '',
        readingTime: initialData.readingTime || '',
        // Champs spécifiques aux reviews UNIQUEMENT
        rating: initialData.rating || '',
        gameTitle: initialData.gameTitle || '',
        platform: initialData.platform || '',
        genre: initialData.genre || ''
      });
    }
  }, [initialData]);

  // Initialisation de l'éditeur Tiptap
  const editor = useEditor({
    extensions: [StarterKit, Image, Youtube],
    content: formData.content,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
    editable: !loading
  });

  // Synchroniser le contenu initial lors de l'édition
  useEffect(() => {
    if (editor && formData.content && editor.getHTML() !== formData.content) {
      editor.commands.setContent(formData.content);
    }
  }, [formData.content, editor]);

  // Fonction pour insérer une image à la position du curseur
  const handleInsertImage = (imageUrlOrId) => {
    const url = ImageService.getImageUrl(imageUrlOrId);
    if (editor && url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Fonction pour insérer une vidéo YouTube à la position du curseur
  const handleInsertYoutube = () => {
    if (editor && youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  };

  // Gérer les changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Générer automatiquement le slug quand le titre change
    if (name === 'title') {
      const service = type === 'articles' ? ArticleService : ReviewService;
      const slug = service.generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Valider et soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Valider selon le type
      const service = type === 'articles' ? ArticleService : ReviewService;
      const validation = service.validateArticle ? 
        service.validateArticle(formData) : 
        service.validateReview(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Préparer les données à envoyer
      const dataToSend = { ...formData };
      // SUPPRIMER rating si ce n'est pas une review
      if (type !== 'reviews') {
        delete dataToSend.rating;
        delete dataToSend.gameTitle;
        delete dataToSend.platform;
        delete dataToSend.genre;
      }
      // Pour les reviews, convertir la note en nombre
      if (type === 'reviews' && dataToSend.rating) {
        dataToSend.rating = parseFloat(dataToSend.rating);
      }

      await onSubmit(dataToSend);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isReview = type === 'reviews';
  const title = initialData ? 
    (isReview ? t('adminPostForm.editReview') : t('adminPostForm.editArticle')) :
    (isReview ? t('adminPostForm.createReview') : t('adminPostForm.createArticle'));

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h2>
          <AnimatedText deps={[i18n.language]}>
            {title}
          </AnimatedText>
        </h2>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.closeBtn}
        >
          ✕
        </button>
      </div>

      {errors.general && (
        <div className={styles.error}>
          <AnimatedText deps={[i18n.language]}>
            {errors.general}
          </AnimatedText>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Titre */}
        <div className={styles.field}>
          <label htmlFor="title">
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.title')}
            </AnimatedText> *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? styles.fieldError : ''}
            disabled={loading}
          />
          {errors.title && <span className={styles.errorText}>
            <AnimatedText deps={[i18n.language]}>
              {errors.title}
            </AnimatedText>
          </span>}
        </div>

        {/* Slug */}
        <div className={styles.field}>
          <label htmlFor="slug">
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.slug')}
            </AnimatedText> *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={errors.slug ? styles.fieldError : ''}
            disabled={loading}
          />
          {errors.slug && <span className={styles.errorText}>
            <AnimatedText deps={[i18n.language]}>
              {errors.slug}
            </AnimatedText>
          </span>}
        </div>

        {/* Champs spécifiques aux reviews */}
        {isReview && (
          <>
            <div className={styles.field}>
              <label htmlFor="gameTitle">
                <AnimatedText deps={[i18n.language]}>
                  {t('adminPostForm.gameTitle')}
                </AnimatedText> *
              </label>
              <input
                type="text"
                id="gameTitle"
                name="gameTitle"
                value={formData.gameTitle}
                onChange={handleChange}
                className={errors.gameTitle ? styles.fieldError : ''}
                disabled={loading}
              />
              {errors.gameTitle && <span className={styles.errorText}>
                <AnimatedText deps={[i18n.language]}>
                  {errors.gameTitle}
                </AnimatedText>
              </span>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="genre">
                  <AnimatedText deps={[i18n.language]}>
                    {t('adminPostForm.genre')}
                  </AnimatedText>
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">
                    {t('adminPostForm.selectGenre')}
                  </option>
                  {ReviewService.getGenres().map(genre => (
                    <option key={genre} value={genre}>
                      {t('genres.' + genre)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="platform">
                  <AnimatedText deps={[i18n.language]}>
                    {t('adminPostForm.platform')}
                  </AnimatedText>
                </label>
                <PlatformSelect
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.platform ? styles.fieldError : ''}
                />
                {errors.platform && <span className={styles.errorText}>
                  <AnimatedText deps={[i18n.language]}>
                    {errors.platform}
                  </AnimatedText>
                </span>}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="rating">
                <AnimatedText deps={[i18n.language]}>
                  {t('adminPostForm.rating')}
                </AnimatedText>
              </label>
              <input
                type="number"
                id="rating"
                name="rating"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                className={errors.rating ? styles.fieldError : ''}
                disabled={loading}
              />
              {errors.rating && <span className={styles.errorText}>
                <AnimatedText deps={[i18n.language]}>
                  {errors.rating}
                </AnimatedText>
              </span>}
            </div>
          </>
        )}

        {/* Image principale */}
        <div className={styles.field}>
          <label>
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.mainImage')}
            </AnimatedText>
          </label>
          <div className={styles.imageSection}>
            {formData.image && (
              <div className={styles.selectedImage}>
                <img 
                  src={formData.image 
                    ? ImageService.getImageUrl(formData.image)
                    : AssetService.getDefaultArticleFallback()
                  } 
                  alt="Aperçu" 
                  className={styles.imagePreview}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                  className={styles.removeImageBtn}
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className={styles.imageActions}>
              <button
                type="button"
                onClick={() => setShowImageSelector(!showImageSelector)}
                className={styles.selectImageBtn}
                disabled={loading}
              >
                <AnimatedText deps={[i18n.language]}>
                  {formData.image ? t('adminPostForm.changeMainImage') : t('adminPostForm.selectMainImage')}
                </AnimatedText>
              </button>
            </div>
            
            {showImageSelector && (
              <div className={styles.imageSelectorModal}>
                <div className={styles.modalContent}>
                  <button
                    type="button"
                    onClick={() => setShowImageSelector(false)}
                    className={styles.closeModalBtn}
                  >
                    ✕
                  </button>
                  <ImageManager
                    onImageSelect={(imageUrl) => {
                      setFormData(prev => ({ ...prev, image: imageUrl }));
                      setShowImageSelector(false);
                    }}
                    selectedImage={formData.image}
                    showSelector={true}
                    onClose={() => setShowImageSelector(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image secondaire (facultative) */}
        <div className={styles.field}>
          <label>
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.secondaryImage')}
            </AnimatedText> 
            <span className={styles.optional}>
              (<AnimatedText deps={[i18n.language]}>{t('adminPostForm.optional')}</AnimatedText>)
            </span>
          </label>
          <div className={styles.imageSection}>
            {formData.secondaryImage && (
              <div className={styles.selectedImage}>
                <img 
                  src={formData.secondaryImage 
                    ? ImageService.getImageUrl(formData.secondaryImage)
                    : AssetService.getDefaultArticleFallback()
                  } 
                  alt="Aperçu secondaire" 
                  className={styles.imagePreview}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, secondaryImage: '' }))}
                  className={styles.removeImageBtn}
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className={styles.imageActions}>
              <button
                type="button"
                onClick={() => setShowSecondaryImageSelector(!showSecondaryImageSelector)}
                className={styles.selectImageBtn}
                disabled={loading}
              >
                <AnimatedText deps={[i18n.language]}>
                  {formData.secondaryImage ? t('adminPostForm.changeSecondaryImage') : t('adminPostForm.selectSecondaryImage')}
                </AnimatedText>
              </button>
            </div>
            
            {showSecondaryImageSelector && (
              <div className={styles.imageSelectorModal}>
                <div className={styles.modalContent}>
                  <button
                    type="button"
                    onClick={() => setShowSecondaryImageSelector(false)}
                    className={styles.closeModalBtn}
                  >
                    ✕
                  </button>
                  <ImageManager
                    onImageSelect={(imageUrl) => {
                      setFormData(prev => ({ ...prev, secondaryImage: imageUrl }));
                      setShowSecondaryImageSelector(false);
                    }}
                    selectedImage={formData.secondaryImage}
                    showSelector={true}
                    onClose={() => setShowSecondaryImageSelector(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extrait/Description */}
        <div className={styles.field}>
          <label htmlFor="excerpt">
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.excerpt')}
            </AnimatedText> *
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            className={errors.excerpt ? styles.fieldError : ''}
            disabled={loading}
            rows="3"
            placeholder={t('adminPostForm.excerptPlaceholder')}
          />
          {errors.excerpt && <span className={styles.errorText}>
            <AnimatedText deps={[i18n.language]}>
              {errors.excerpt}
            </AnimatedText>
          </span>}
        </div>

        {/* Temps de lecture */}
        <div className={styles.field}>
          <label htmlFor="readingTime">
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.readingTime')}
            </AnimatedText> 
            <span className={styles.optional}>
              (<AnimatedText deps={[i18n.language]}>{t('adminPostForm.optional')}</AnimatedText>)
            </span>
          </label>
          <input
            type="text"
            id="readingTime"
            name="readingTime"
            value={formData.readingTime}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('adminPostForm.readingTimePlaceholder')}
          />
        </div>

        {/* Contenu */}
        <div className={styles.field}>
          <label htmlFor="content">
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.content')}
            </AnimatedText> *
          </label>
          {/* Barre d'outils stylée */}
          <div className={styles.richTextToolbar}>
            <button type="button" className={styles.toolbarBtn} onClick={() => setShowImageSelectorForEditor(true)} disabled={loading}>
              <span role="img" aria-label="Insérer une image">🖼️</span>
              {t('adminPostForm.addImage')}
            </button>
            <button type="button" className={styles.toolbarBtn} onClick={() => setShowYoutubeInput(true)} disabled={loading}>
              <span role="img" aria-label="Insérer une vidéo YouTube">▶️</span>
              {t('adminPostForm.addYoutube')}
            </button>
          </div>
          {/* Sélecteur d'image GridFS pour l'éditeur */}
          {showImageSelectorForEditor && (
            <div className={styles.imageSelectorModal}>
              <div className={styles.modalContent}>
                <button
                  type="button"
                  onClick={() => setShowImageSelectorForEditor(false)}
                  className={styles.closeModalBtn}
                >✕</button>
                <ImageManager
                  onImageSelect={(imageUrl) => {
                    handleInsertImage(imageUrl);
                    setShowImageSelectorForEditor(false);
                  }}
                  showSelector={true}
                  onClose={() => setShowImageSelectorForEditor(false)}
                />
              </div>
            </div>
          )}
          {/* Champ d'insertion YouTube */}
          {showYoutubeInput && (
            <div className={styles.youtubeInputModal}>
              <div className={styles.modalContent}>
                <button
                  type="button"
                  onClick={() => setShowYoutubeInput(false)}
                  className={styles.closeModalBtn}
                >✕</button>
                <input
                  type="text"
                  placeholder="URL YouTube"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  className={styles.youtubeInput}
                />
                <button type="button" className={styles.toolbarBtn} onClick={handleInsertYoutube} disabled={!youtubeUrl}>
                  {t('adminPostForm.insertYoutube')}
                </button>
              </div>
            </div>
          )}
          {/* Editeur Tiptap */}
          <div className={styles.richTextEditor}>
            <EditorContent editor={editor} className={styles.adminRichText} />
          </div>
          {errors.content && <span className={styles.errorText}>
            <AnimatedText deps={[i18n.language]}>
              {errors.content}
            </AnimatedText>
          </span>}
        </div>

        {/* Boutons */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelBtn}
            disabled={loading}
          >
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostForm.cancel')}
            </AnimatedText>
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            <AnimatedText deps={[i18n.language]}>
              {loading ? t('adminPostForm.saving') : t('adminPostForm.save')}
            </AnimatedText>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPostForm; 
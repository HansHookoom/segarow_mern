import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ArticleService from '../../services/ArticleService';
import ReviewService from '../../services/ReviewService';
import LikeService from '../../services/LikeService';
import ImageService from '../../services/ImageService';
import AssetService from '../../services/AssetService';
import TranslationService from '../../services/TranslationService';
import ImageWithSkeleton from '../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import ConsoleLogo from '../../components/ui/ConsoleLogo/ConsoleLogo';
import CommentSection from '../../components/sections/CommentSection/CommentSection';
import { useAuth } from '../../hooks/useAuth';
import useShare from '../../hooks/useShare';
import DOMPurify from 'dompurify';
import styles from './SingleContent.module.css';
import parse, { domToReact } from 'html-react-parser';
import YouTubeIframe from '../../components/ui/YouTubeIframe/YouTubeIframe';
import ReactDOM from 'react-dom';
import adminListStyles from '../../components/admin/AdminPostList/AdminPostList.module.css';
import toast from 'react-hot-toast';

const SingleContent = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { share } = useShare();
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour les likes
  const [likeLoading, setLikeLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showSonicAnimation, setShowSonicAnimation] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  
  // États pour la traduction automatique (sans indicateurs visuels)
  const [translatedContent, setTranslatedContent] = useState(null);
  
  // États pour les contenus précédents
  const [previousContent, setPreviousContent] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [translatedPreviousContent, setTranslatedPreviousContent] = useState({});

  // Détecter le type de contenu basé sur l'URL
  const isReview = location.pathname.startsWith('/reviews/');
  const contentType = isReview ? 'review' : 'article';

  const contentRef = useRef();

  useEffect(() => {
    loadContent();
    // Réinitialiser les traductions quand on change d'article
    setTranslatedContent(null);
    setTranslatedPreviousContent({});
  }, [slug, contentType]);

  useEffect(() => {
    // Charger les contenus précédents quand le contenu principal est chargé
    if (content) {
      loadPreviousContent();
      // Réinitialiser les traductions des contenus précédents
      setTranslatedPreviousContent({});
    }
  }, [content]);

  // Effet pour traduire automatiquement les contenus précédents quand la langue change
  useEffect(() => {
    const translatePreviousContent = async () => {
      // Attendre que les contenus précédents soient chargés
      if (loadingPrevious || previousContent.length === 0) {
        return;
      }
      
      // Si on passe en anglais et qu'on n'a pas encore traduit
      if (i18n.language === 'en' && !Object.keys(translatedPreviousContent).length) {
        try {
          const fromLang = TranslationService.getSourceLanguage(i18n.language);
          const toLang = TranslationService.getTargetLanguage(i18n.language);
          
          const translatedData = {};
          
          for (const item of previousContent) {
            if (isReview) {
              const translatedReview = await TranslationService.translateReview(item.slug, fromLang, toLang);
              translatedData[item._id] = translatedReview;
            } else {
              const translatedArticle = await TranslationService.translateArticle(item.slug, fromLang, toLang);
              translatedData[item._id] = translatedArticle;
            }
          }
          
          setTranslatedPreviousContent(translatedData);
        } catch (error) {
          // Pas d'affichage d'erreur pour l'utilisateur
        }
      } else if (i18n.language === 'fr' && Object.keys(translatedPreviousContent).length) {
        // Si on revient en français et qu'on a du contenu traduit
        setTranslatedPreviousContent({});
      }
    };

    translatePreviousContent();
  }, [i18n.language, previousContent, loadingPrevious, isReview]);

  useEffect(() => {
    // Charger l'état des likes quand le contenu est chargé
    if (content && isAuthenticated) {
      loadLikeStatus();
    }
  }, [content, isAuthenticated]);

  useEffect(() => {
    // Après le rendu, entourer les iframes YouTube d'un wrapper responsive
    if (contentRef.current) {
      const iframes = contentRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (
          iframe.src.includes('youtube.com') &&
          !iframe.parentElement.classList.contains('youtube-video')
        ) {
          const wrapper = document.createElement('div');
          wrapper.className = 'youtube-video';
          iframe.parentNode.insertBefore(wrapper, iframe);
          wrapper.appendChild(iframe);
        }
        // Ajout de l'attribut allowfullscreen pour toutes les iframes YouTube
        if (iframe.src.includes('youtube.com')) {
          iframe.setAttribute('allowfullscreen', '');
          iframe.setAttribute('allow', 'fullscreen; encrypted-media');
        }
      });
    }
  }, [content, translatedContent]);

  // Effet pour traduire automatiquement le contenu quand la langue change (sans indicateurs visuels)
  useEffect(() => {
    const translateContent = async () => {
      // Attendre que le contenu soit chargé avant de traduire
      if (loading) {
        return;
      }
      
      // Si on passe en anglais et qu'on n'a pas encore traduit
      if (i18n.language === 'en' && content && !translatedContent) {
        try {
          const fromLang = TranslationService.getSourceLanguage(i18n.language);
          const toLang = TranslationService.getTargetLanguage(i18n.language);
          
          let translatedData;
          if (isReview) {
            translatedData = await TranslationService.translateReview(slug, fromLang, toLang);
          } else {
            translatedData = await TranslationService.translateArticle(slug, fromLang, toLang);
          }
          
          setTranslatedContent(translatedData);
        } catch (error) {
          // Pas d'affichage d'erreur pour l'utilisateur
        }
      } else if (i18n.language === 'fr' && translatedContent) {
        // Si on revient en français et qu'on a du contenu traduit
        setTranslatedContent(null);
      }
    };

    translateContent();
  }, [i18n.language, content, slug, isReview, loading]);



  const loadContent = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (isReview) {
        // Récupérer la review par slug
        response = await ReviewService.getReviewById(slug);
        setContent(response.review);
        setLikeCount(response.review.likeCount || 0);
      } else {
        // Récupérer l'article par slug
        response = await ArticleService.getArticleBySlug(slug);
        setContent(response.article);
        setLikeCount(response.article.likeCount || 0);
      }
    } catch (err) {
      setError(err.message || t('singleContent.notFoundDesc', { type: contentType }));
    } finally {
      setLoading(false);
    }
  };

  const loadPreviousContent = async () => {
    try {
      setLoadingPrevious(true);
      
      let response;
      if (isReview) {
        // Récupérer toutes les reviews pour trouver les précédentes
        response = await ReviewService.getReviews(1, 50); // Récupérer plus pour avoir assez de données
        const allReviews = response.reviews;
        
        // Trouver l'index de la review actuelle
        const currentIndex = allReviews.findIndex(review => review.slug === slug);
        
        if (currentIndex >= 0) {
          // Récupérer les 2 reviews précédentes (avant la review actuelle)
          const previousReviews = allReviews.slice(currentIndex + 1, currentIndex + 3);
          setPreviousContent(previousReviews);
        } else {
          // Si la review n'est pas trouvée
          setPreviousContent([]);
        }
      } else {
        // Récupérer tous les articles pour trouver les précédents
        response = await ArticleService.getArticles(1, 50); // Récupérer plus pour avoir assez de données
        const allArticles = response.articles;
        
        // Trouver l'index de l'article actuel
        const currentIndex = allArticles.findIndex(article => article.slug === slug);
        
        if (currentIndex >= 0) {
          // Récupérer les 2 articles précédents (avant l'article actuel)
          const previousArticles = allArticles.slice(currentIndex + 1, currentIndex + 3);
          setPreviousContent(previousArticles);
        } else {
          // Si l'article n'est pas trouvé
          setPreviousContent([]);
        }
      }
    } catch (err) {
      // Erreur lors du chargement des contenus précédents
    } finally {
      setLoadingPrevious(false);
    }
  };

  const loadLikeStatus = async () => {
    try {
      const response = await LikeService.getLikeStatus(contentType, content._id);
      setLiked(response.liked);
      setLikeCount(response.likeCount);
    } catch (error) {
      // Erreur chargement état like
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast(
        <span>
          <span style={{fontWeight: 'bold', marginRight: 8, fontSize: '18px'}}>⚠️</span>
          {t('singleContent.mustBeLoggedIn')}
        </span>,
        { className: 'toast-info' }
      );
      return;
    }

    if (likeLoading) return;

    try {
      setLikeLoading(true);
      const response = await LikeService.toggleLike(contentType, content._id);
      
      setLiked(response.liked);
      setLikeCount(response.likeCount);
      
      // Toast de succès pour le like
      if (response.liked) {
        toast.success(t('singleContent.liked'));
        setShowSonicAnimation(true);
        // Réinitialiser l'animation après 2 secondes
        setTimeout(() => {
          setShowSonicAnimation(false);
        }, 2000);
      } else {
        toast.success(t('singleContent.unliked'));
      }
      
    } catch (error) {
      toast.error(t('singleContent.likeError'));
    } finally {
      setLikeLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (isSharing || !content) return;
    
    setIsSharing(true);
    setShareMessage("");
    
    try {
      const currentContent = translatedContent || content;
      const title = isReview ? (currentContent.gameTitle || currentContent.title) : currentContent.title;
      const description = currentContent.excerpt || t('singleContent.shareDescription', { 
        type: isReview ? t('singleContent.review') : t('singleContent.article'),
        title 
      });
      const url = window.location.href;
      
      const result = await share(url, title, description);
      setShareMessage(result.message);
      
      // Toast de succès pour le partage
      if (result.status === 'success') {
        toast.success(t('singleContent.shareSuccess'));
      } else if (result.status === 'copied') {
        toast.success(t('singleContent.linkCopied'));
      }
    } catch (error) {
      toast.error(t('singleContent.shareError'));
      setShareMessage(t('singleContent.shareError'));
    } finally {
      setIsSharing(false);
    }
  };



  const getRatingColor = (rating) => {
    if (rating >= 8) return '#4CAF50'; // Vert
    if (rating >= 6) return '#FF9800'; // Orange
    if (rating >= 4) return '#FFC107'; // Jaune
    return '#F44336'; // Rouge
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  };

  const renderRichContent = () => {
    const currentContent = translatedContent || content;
    if (!currentContent?.content) return null;

    const sanitizedHtml = DOMPurify.sanitize(currentContent.content, {
      ADD_TAGS: ['iframe', 'img'],
      ADD_ATTR: [
        'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height',
        'alt', 'title', 'style', 'class', 'loading'
      ],
      ALLOWED_URI_REGEXP: /^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be|localhost|127\.0\.0\.1|segarow\.com|api\/images\/)/
    });

    return (
      <div className={styles.richTextContent}>
        {parse(sanitizedHtml, {
          replace: domNode => {
            // Pour les vidéos YouTube (déjà présent)
            if (domNode.name === 'iframe' && domNode.attribs && domNode.attribs.src && domNode.attribs.src.includes('youtube.com')) {
              let videoId = '';
              const src = domNode.attribs.src;
              if (src.includes('/embed/')) {
                videoId = src.split('/embed/')[1]?.split('?')[0];
              } else if (src.includes('v=')) {
                try {
                  videoId = new URL(src).searchParams.get('v');
                } catch {}
              }
              if (videoId) {
                return (
                  <YouTubeIframe 
                    videoId={videoId} 
                    width="100%"
                    height="350"
                  />
                );
              }
            }
            // Pour les images insérées via Tiptap
            if (domNode.name === 'img' && domNode.attribs) {
              return (
                <ImageWithSkeleton
                  src={domNode.attribs.src}
                  alt={domNode.attribs.alt || ''}
                  fallbackSrc={AssetService.getDefaultArticleFallback()}
                  skeletonHeight="100%"
                  style={{ width: '100%', display: 'block' }}
                  imgStyle={{ width: '100%', height: 'auto', display: 'block' }}
                />
              );
            }
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <AnimatedText deps={[i18n.language]}>
            {t('singleContent.loading', { type: contentType })}
          </AnimatedText>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={styles.errorContainer}>
        <h1 className="emoji-error">
          <AnimatedText deps={[i18n.language]}>
            {t('singleContent.notFound', { type: contentType === 'review' ? 'Review' : 'Article' })}
          </AnimatedText>
        </h1>
        <p>
          <AnimatedText deps={[i18n.language]}>
            {error || t('singleContent.notFoundDesc', { type: contentType })}
          </AnimatedText>
        </p>
        <button 
          onClick={() => navigate(isReview ? '/reviews' : '/news')}
          className={styles.backButton}
        >
          <AnimatedText deps={[i18n.language]}>
            {t('singleContent.backTo', { type: isReview ? 'review' : 'article' })}
          </AnimatedText>
        </button>
      </div>
    );
  }

  return (
    <main className={styles.singleGlobalContent}>
      <h1 className={styles.singleMainTitle}>
        {isReview ? (content.gameTitle || content.title) : (translatedContent?.title || content.title)}
      </h1>
      
      <div className={styles.singleInfo}>
        <div className={styles.singleContent}>
          {/* Afficher l'image principale pour les articles, l'image secondaire pour les reviews */}
          {((isReview && content.secondaryImage) || (!isReview && content.image)) && (
            <ImageWithSkeleton
              src={isReview 
                ? (content.secondaryImage 
                    ? ImageService.getImageUrl(content.secondaryImage)
                    : AssetService.getDefaultArticleFallback())
                : (content.image 
                    ? ImageService.getImageUrl(content.image)
                    : AssetService.getDefaultArticleFallback())
              } 
              alt={translatedContent?.title || content.title}
              className={styles.singleImage}
              skeletonHeight="350px"
              skeletonProps={{ className: 'slow' }}
            />
          )}
          
          <div className={styles.singleText}>
            {/* Affichage de la description (excerpt) */}
            {(translatedContent?.excerpt || content.excerpt) && (
              <div className={styles.singleExcerpt}>
                <AnimatedText deps={[translatedContent?.excerpt]}>
                  {translatedContent?.excerpt || content.excerpt}
                </AnimatedText>
              </div>
            )}
            
            {/* Espace blanc entre description et contenu */}
            {(translatedContent?.excerpt || content.excerpt) && (translatedContent?.content || content.content) && (
              <div style={{ height: '2rem' }}></div>
            )}
            
            {/* Affichage du contenu principal */}
            {(translatedContent?.content || content.content) ? (
              <div className={styles.singleMainContent}>
                <AnimatedText deps={[translatedContent?.content]}>
                  {renderRichContent()}
                </AnimatedText>
              </div>
            ) : !(translatedContent?.excerpt || content.excerpt) ? (
              <div>
                <AnimatedText deps={[i18n.language]}>
                  {t('singleContent.noContent')}
                </AnimatedText>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className={styles.singleMeta}>
          <div className={styles.singleDivInfo}>
            <div className={styles.singlePublishDate}>
              <AnimatedText deps={[i18n.language]}>
                {t('singleContent.writtenOn', { 
                  date: formatDate(content.createdAt), 
                  author: content.author?.username || content.author?.email || t('singleContent.unknownAuthor')
                })}
              </AnimatedText>
            </div>
            

            
            {/* Affichage spécifique aux reviews avec le style admin */}
            {isReview && (content.genre || content.platform) && (
              <div className={adminListStyles.reviewMeta} style={{marginBottom: 24}}>
                {content.genre && (
                  <span className={adminListStyles.gameGenre}>
                    <span role="img" aria-label="genre">🎮</span> <AnimatedText deps={[i18n.language]}>{t('genres.' + content.genre)}</AnimatedText>
                  </span>
                )}
                {content.platform && (
                  <span className={adminListStyles.platform}>
                    <ConsoleLogo 
                      platform={content.platform} 
                      size="small" 
                      showText={false}
                      className={adminListStyles.platformLogo}
                    />
                    {content.platform}
                  </span>
                )}
              </div>
            )}
            
            {isReview && content.rating && (
              <div className={adminListStyles.rating} style={{marginBottom: 24}}>
                <span 
                  className={adminListStyles.ratingScore}
                  style={{ color: getRatingColor(content.rating) }}
                >
                  {content.rating}/10
                </span>
                <span className={adminListStyles.ratingStars}>
                  {getRatingStars(content.rating)}
                </span>
              </div>
            )}
            
            <div className={styles.singleLikesSection}>
              <span className={`${styles.singleLikesCount} emoji-heart`}>
                <AnimatedText deps={[i18n.language]}>
                  {t('singleContent.likesCount', { 
                    count: likeCount, 
                    likes: likeCount <= 1 ? t('singleContent.like') : t('singleContent.likes'),
                    type: isReview ? t('singleContent.review') : t('singleContent.article')
                  })}
                </AnimatedText>
              </span>
            </div>
            
            {content.readingTime && (
              <div className={styles.singleReadingTime}>
                <span className={`${styles.singleClock} emoji-time`}></span>
                <span>{content.readingTime}</span>
              </div>
            )}
          </div>
          
          <div className={styles.singleLikeButtonContainer}>
            <button 
              className={`${styles.singleLikeButton} ${liked ? styles.singlePrimary : styles.singleSecondary} ${showSonicAnimation ? styles.singleAnimating : ''} emoji-button ${liked ? 'emoji-heart' : 'emoji-heart-outline'}`}
              onClick={handleLike}
              disabled={likeLoading}
            >
              <AnimatedText deps={[i18n.language]}>
                {likeLoading ? t('singleContent.loadingLike') : (liked ? t('singleContent.likeButton') : t('singleContent.unlikeButton'))}
              </AnimatedText>
            </button>
            
            {/* Animation Sonic, Tails et Knuckles qui courent */}
            {showSonicAnimation && (
              <div 
                className={styles.sonicRunner}
                style={{ '--sonic-background': AssetService.getCSSBackground('bg-stage-sonic.gif') }}
              >
                {/* Knuckles court en arrière */}
                <img 
                  src={AssetService.getPublicImage('knuckles-run.gif')} 
                  alt="Knuckles court" 
                  className={styles.knucklesGif}
                />
                {/* Tails court au milieu */}
                <img 
                  src={AssetService.getPublicImage('tails-run.gif')} 
                  alt="Tails court" 
                  className={styles.tailsGif}
                />
                {/* Sonic court devant */}
                <img 
                  src={AssetService.getPublicImage('sonic-run.gif')} 
                  alt="Sonic court" 
                  className={styles.sonicGif}
                />
              </div>
            )}
          </div>

          <button 
            className={`${styles.singleLikeButton} ${styles.singleSecondary} ${styles.singleShareButton}`}
            onClick={handleShare}
            disabled={isSharing}
          >
            <AnimatedText deps={[i18n.language]}>
              {isSharing ? t('singleContent.sharing') : t('singleContent.share')}
            </AnimatedText>
          </button>
          {shareMessage && (
            <div className={styles.shareMessage}>
              <AnimatedText deps={[i18n.language]}>
                {shareMessage}
              </AnimatedText>
            </div>
          )}
        </div>
      </div>
      
      {/* Section commentaires - pour les articles ET les reviews */}
      {content && (
        <CommentSection 
          contentId={content._id}
          contentType={isReview ? 'review' : 'article'}
        />
      )}
      
      <section className={styles.singlePreviousContent}>
        <div className={styles.singlePreviousContentContainer}>
          <h2 className={styles.singlePreviousContentTitle}>
            <AnimatedText deps={[i18n.language]}>
              {isReview ? t('singleContent.previousReviews') : t('singleContent.previousArticles')}
            </AnimatedText>
          </h2>
          
          {loadingPrevious ? (
            <div className={styles.loadingPrevious}>
              <AnimatedText deps={[i18n.language]}>
                {t('singleContent.loadingPrevious')}
              </AnimatedText>
            </div>
          ) : previousContent.length === 0 ? (
            <div className={styles.noPreviousContent}>
              <AnimatedText deps={[i18n.language]}>
                {isReview ? t('singleContent.noPreviousReviews') : t('singleContent.noPreviousArticles')}
              </AnimatedText>
            </div>
          ) : (
            <div className={styles.singleGrid}>
              {previousContent.map((item) => (
                <div key={item._id} className={styles.singleCard}>
                  <Link 
                    to={isReview ? `/reviews/${item.slug}` : `/news/${item.slug}`}
                    className={styles.singleCardLink}
                  >
                    {item.image && (
                      <ImageWithSkeleton
                        src={item.image 
                          ? ImageService.getImageUrl(item.image)
                          : AssetService.getDefaultArticleFallback()
                        }
                        alt={item.title}
                        className={styles.singleCardImg}
                        skeletonHeight="200px"
                      />
                    )}
                    <div className={styles.singleCardOverlay}>
                      <div className={styles.singleCardContent}>
                        <h3 className={styles.singleCardTitle}>
                          <AnimatedText deps={[translatedPreviousContent[item._id]?.title]}>
                            {isReview 
                              ? (translatedPreviousContent[item._id]?.gameTitle || translatedPreviousContent[item._id]?.title || item.gameTitle || item.title)
                              : (translatedPreviousContent[item._id]?.title || item.title)
                            }
                          </AnimatedText>
                        </h3>
                        {(translatedPreviousContent[item._id]?.excerpt || item.excerpt) && (
                          <p className={styles.singleCardDescription}>
                            <AnimatedText deps={[translatedPreviousContent[item._id]?.excerpt]}>
                              {translatedPreviousContent[item._id]?.excerpt || item.excerpt}
                            </AnimatedText>
                          </p>
                        )}
                        <div className={styles.singleCardActions}>
                          <span className={styles.singleKnowMoreButton}>
                            <AnimatedText deps={[i18n.language]}>
                              {isReview ? t('reviews.viewReview') : t('news.readMore')}
                            </AnimatedText>
                          </span>
                          {item.readingTime && (
                            <span className={styles.singleCardReadingTime}>
                              <span className="emoji-time"></span>
                              {item.readingTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default SingleContent; 
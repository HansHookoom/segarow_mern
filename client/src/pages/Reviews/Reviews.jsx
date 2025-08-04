import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import ImageService from '../../services/ImageService';
import AssetService from '../../services/AssetService';
import TranslationService from '../../services/TranslationService';
import ConsoleLogo from '../../components/ui/ConsoleLogo/ConsoleLogo';
import Pagination from '../../components/ui/Pagination/Pagination';
import ImageWithSkeleton from '../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import SearchBar from '../../components/ui/SearchBar/SearchBar';
import styles from './Reviews.module.css';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ErrorState from '../../components/ui/ErrorState/ErrorState';

const Reviews = () => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const reviewsPerPage = 5;
  
  // États pour la traduction automatique
  const [translatedReviews, setTranslatedReviews] = useState({});

  // Construire l'URL de l'API avec les paramètres de recherche et pagination
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: reviewsPerPage
    });
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }
    return `/api/reviews?${params.toString()}`;
  }, [currentPage, searchTerm]);

  const { data, loading, error, refetch } = useApi(apiUrl);
  
  const reviews = useMemo(() => {
    return data?.reviews || [];
  }, [data]);

  const totalPages = useMemo(() => {
    return data?.pagination?.total || 1;
  }, [data]);

  const totalReviews = useMemo(() => {
    return data?.pagination?.totalReviews || 0;
  }, [data]);

  // Effet pour traduire automatiquement les reviews quand la langue change
  useEffect(() => {
    const translateReviews = async () => {
      if (loading || reviews.length === 0) return;
      
      // Si on passe en anglais et qu'on n'a pas encore traduit
      if (i18n.language === 'en') {
        const newTranslatedReviews = { ...translatedReviews };
        
        for (const review of reviews) {
          if (!translatedReviews[review._id]) {
            try {
              const fromLang = TranslationService.getSourceLanguage(i18n.language);
              const toLang = TranslationService.getTargetLanguage(i18n.language);
              
              const translatedData = await TranslationService.translateReview(review.slug, fromLang, toLang);
              newTranslatedReviews[review._id] = translatedData;
                    } catch (error) {
          // Erreur de traduction pour la review
        }
          }
        }
        
        setTranslatedReviews(newTranslatedReviews);
      } else if (i18n.language === 'fr') {
        // Si on revient en français, on supprime les traductions
        setTranslatedReviews({});
      }
    };

    translateReviews();
  }, [i18n.language, reviews, loading]);

  // Effet pour réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setTranslatedReviews({}); // Réinitialiser les traductions
  };

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return AssetService.getDefaultArticleFallback();
    return ImageService.getImageUrl(imageUrl);
  };

  if (loading && reviews.length === 0) {
    return (
      <section className={styles.reviewContainer}>
        <h2>
          <AnimatedText deps={[i18n.language]}>
            {t('reviews.title')}
          </AnimatedText>
        </h2>
        <ErrorState
          type="loading"
          emoji="📝"
          message={t('reviews.loading')}
        />
      </section>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <section className={styles.reviewContainer}>
        <h2>
          <AnimatedText deps={[i18n.language]}>
            {t('reviews.title')}
          </AnimatedText>
        </h2>
        <ErrorState
          type="error"
          emoji="❌"
          message={t('reviews.error')}
          buttonText={t('articlesSection.retry')}
          onRetry={refetch}
        />
      </section>
    );
  }

  return (
    <section className={styles.reviewContainer}>
      <h2>
        <AnimatedText deps={[i18n.language]}>
          {t('reviews.title')}
        </AnimatedText>
      </h2>
      
      {/* Barre de recherche */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder={t('search.reviewsPlaceholder')}
      />
      
      <div>
        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            <p>
              <AnimatedText deps={[i18n.language]}>
                {searchTerm.trim() ? t('search.noResults') : t('reviews.none')}
              </AnimatedText>
            </p>
          </div>
        ) : (
          <>
            {/* Affichage du nombre de résultats si une recherche est active */}
            {searchTerm.trim() && (
              <div className={styles.searchResults}>
                <p>
                  <AnimatedText deps={[i18n.language, totalReviews]}>
                    {t('search.resultsCount', { count: totalReviews })}
                  </AnimatedText>
                </p>
              </div>
            )}
            
            {reviews.map((review) => (
              <article key={review._id} className={styles.reviewCard}>
                <Link to={`/reviews/${review.slug}`} className={styles.reviewCardLink}>
                  <div className={styles.reviewGameImage}>
                    <ImageWithSkeleton
                      src={getImageSrc(review.image)} 
                      alt={review.title}
                      fallbackSrc={AssetService.getDefaultArticleFallback()}
                      skeletonHeight="100%"
                      className="review-image"
                    />
                  </div>
                  
                  <div className={styles.reviewContent}>
                    <h2 className={styles.reviewGameTitle}>
                      {review.title}
                    </h2>
                    
                    {review.genre && (
                      <div className={styles.reviewGameGenre}>
                        <span>
                          <AnimatedText deps={[i18n.language]}>
                            {t('reviews.genre')}
                          </AnimatedText>
                        </span>
                        <span className={styles.genreBadge}>
                          <AnimatedText deps={[i18n.language]}>{t('genres.' + review.genre)}</AnimatedText>
                        </span>
                      </div>
                    )}
                    
                    {review.platform && (
                      <div className={styles.reviewGameGenre}>
                        <span>
                          <AnimatedText deps={[i18n.language]}>
                            {t('reviews.console')}
                          </AnimatedText>
                        </span>
                        <span className={styles.platformBadge}>
                          <ConsoleLogo 
                            platform={review.platform} 
                            size="small" 
                            className={styles.platformLogo}
                          />
                        </span>
                      </div>
                    )}

                    <div className={styles.reviewText}>
                      <AnimatedText deps={[translatedReviews[review._id]?.excerpt, translatedReviews[review._id]?.content]}>
                        {(() => {
                          const translatedReview = translatedReviews[review._id];
                          const text = translatedReview?.excerpt || translatedReview?.content?.replace(/<[^>]*>/g, '') || review.excerpt || review.content?.replace(/<[^>]*>/g, '');
                          return text ? (text.length > 150 ? text.substring(0, 150) + '...' : text) : '';
                        })()}
                      </AnimatedText>
                    </div>
                    
                    <span className={styles.reviewReadMoreBtn}>
                      <AnimatedText deps={[i18n.language]}>
                        {t('reviews.readMore')}
                      </AnimatedText>
                    </span>
                  </div>
                </Link>
              </article>
            ))}

            {/* Pagination */}
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </section>
  );
};

export default Reviews; 
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import ImageService from '../../services/ImageService';
import AssetService from '../../services/AssetService';
import TranslationService from '../../services/TranslationService';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import Pagination from '../../components/ui/Pagination/Pagination';
import ImageWithSkeleton from '../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import SearchBar from '../../components/ui/SearchBar/SearchBar';
import styles from './News.module.css';
import { useTranslation } from 'react-i18next';
import ErrorState from '../../components/ui/ErrorState/ErrorState';

const News = () => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const articlesPerPage = 5;
  
  // États pour la traduction automatique
  const [translatedArticles, setTranslatedArticles] = useState({});

  // Construire l'URL de l'API avec les paramètres de recherche et pagination
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage,
      limit: articlesPerPage
    });
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }
    return `/api/articles?${params.toString()}`;
  }, [currentPage, searchTerm]);

  const { data, loading, error, refetch } = useApi(apiUrl);
  
  const articles = useMemo(() => {
    return data?.articles || [];
  }, [data]);

  const totalPages = useMemo(() => {
    return data?.pagination?.total || 1;
  }, [data]);

  const totalArticles = useMemo(() => {
    return data?.pagination?.totalArticles || 0;
  }, [data]);

  // Effet pour traduire automatiquement les articles quand la langue change
  useEffect(() => {
    const translateArticles = async () => {
      if (loading || articles.length === 0) return;
      
      // Si on passe en anglais et qu'on n'a pas encore traduit
      if (i18n.language === 'en') {
        const newTranslatedArticles = { ...translatedArticles };
        
        for (const article of articles) {
          if (!translatedArticles[article._id]) {
            try {
              const fromLang = TranslationService.getSourceLanguage(i18n.language);
              const toLang = TranslationService.getTargetLanguage(i18n.language);
              
              const translatedData = await TranslationService.translateArticle(article.slug, fromLang, toLang);
              newTranslatedArticles[article._id] = translatedData;
                    } catch (error) {
          // Erreur de traduction pour l'article
        }
          }
        }
        
        setTranslatedArticles(newTranslatedArticles);
      } else if (i18n.language === 'fr') {
        // Si on revient en français, on supprime les traductions
        setTranslatedArticles({});
      }
    };

    translateArticles();
  }, [i18n.language, articles, loading]);

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
    setTranslatedArticles({}); // Réinitialiser les traductions
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, ''); // Supprime les balises HTML
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading && articles.length === 0) {
    return (
      <section className={styles.newsContainer}>
        <h2>
          <AnimatedText deps={[i18n.language]}>
            {t('news.title')}
          </AnimatedText>
        </h2>
        <ErrorState
          type="loading"
          emoji="📰"
          message={t('articlesSection.loadingTitle')}
        />
      </section>
    );
  }

  if (error && articles.length === 0) {
    return (
      <section className={styles.newsContainer}>
        <h2>
          <AnimatedText deps={[i18n.language]}>
            {t('news.title')}
          </AnimatedText>
        </h2>
        <ErrorState
          type="error"
          emoji="❌"
          message={t('articlesSection.errorTitle')}
          buttonText={t('articlesSection.retry')}
          onRetry={refetch}
        />
      </section>
    );
  }

  return (
    <section className={styles.newsContainer}>
      <h2>
        <AnimatedText deps={[i18n.language]}>
          {t('news.title')}
        </AnimatedText>
      </h2>
      
      {/* Barre de recherche */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder={t('search.articlesPlaceholder')}
      />
      
      {articles.length === 0 ? (
        <div className={styles.noArticles}>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {searchTerm.trim() ? t('search.noResults') : t('news.none')}
            </AnimatedText>
          </p>
        </div>
      ) : (
        <div>
          {/* Affichage du nombre de résultats si une recherche est active */}
          {searchTerm.trim() && (
            <div className={styles.searchResults}>
              <p>
                <AnimatedText deps={[i18n.language, totalArticles]}>
                  {t('search.resultsCount', { count: totalArticles })}
                </AnimatedText>
              </p>
            </div>
          )}
          
          {articles.map((article, index) => (
            <React.Fragment key={article._id}>
              <div className={styles.singleCard}>
                <Link to={`/news/${article.slug}`} className={styles.singleCardLink}>
                  <div className={styles.singleCardImg}>
                    <ImageWithSkeleton
                      src={article.image 
                        ? ImageService.getImageUrl(article.image)
                        : AssetService.getDefaultArticleFallback()
                      }
                      alt={article.title}
                      fallbackSrc={AssetService.getDefaultArticleFallback()}
                      skeletonHeight="100%"
                      skeletonProps={{ style: { width: '100%', height: '100%' } }}
                    />
                  </div>
                  
                  <div className={styles.singleCardOverlay}>
                    {article.secondaryImage && (
                      <ImageWithSkeleton
                        src={article.secondaryImage 
                          ? ImageService.getImageUrl(article.secondaryImage)
                          : AssetService.getDefaultArticleFallback()
                        } 
                        alt="Cover image"
                        className={styles.singleCardCover}
                        fallbackSrc={AssetService.getDefaultArticleFallback()}
                        skeletonHeight="200px"
                      />
                    )}
                    
                    <div className={styles.singleCardContent}>
                      <div>
                        <h4 className={styles.singleCardTitle}>
                          <AnimatedText deps={[translatedArticles[article._id]?.title]}>
                            {translatedArticles[article._id]?.title || article.title}
                          </AnimatedText>
                        </h4>
                        <span className={styles.singleKnowMoreButton}>
                          <AnimatedText deps={[i18n.language]}>
                            {t('news.readMore')}
                          </AnimatedText>
                        </span>
                      </div>
                      <span className={styles.singleCardDescription}>
                        <AnimatedText deps={[translatedArticles[article._id]?.excerpt, translatedArticles[article._id]?.content]}>
                          {(() => {
                            const translatedArticle = translatedArticles[article._id];
                            const text = translatedArticle?.excerpt || translatedArticle?.content?.replace(/<[^>]*>/g, '') || article.excerpt || getExcerpt(article.content);
                            return text ? (text.length > 150 ? text.substring(0, 150) + '...' : text) : '';
                          })()}
                        </AnimatedText>
                      </span>
                      <div className={styles.singleCardMeta}>
                        <span className={styles.singleCardDate}>
                          <AnimatedText deps={[i18n.language]}>
                            {t('news.writtenOn', { date: formatDate(article.createdAt) })}
                          </AnimatedText>
                        </span>

                        {article.readingTime && (
                          <div className={styles.singleCardDuration}>
                            <span>{article.readingTime}</span>
                            <span className={styles.singleCardClock}>⏰</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
              
              {index < articles.length - 1 && <div className={styles.newsDivider}></div>}
            </React.Fragment>
          ))}

          {/* Pagination */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
};

export default News; 
import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArticleCarousel from '../../ui/ArticleCarousel/ArticleCarousel';
import ArticleGrid from '../../ui/ArticleGrid/ArticleGrid';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import TranslationService from '../../../services/TranslationService';
import useApi from '../../../hooks/useApi';
import './ArticlesSection.css';
import { useTranslation } from 'react-i18next';
import ErrorState from '../../ui/ErrorState/ErrorState';

const ArticlesSection = () => {
  const { data, loading, error, refetch } = useApi('/api/articles?limit=3');
  const { t, i18n } = useTranslation();
  
  // États pour la traduction automatique
  const [translatedArticles, setTranslatedArticles] = useState({});
  
  const articles = useMemo(() => {
    return data?.articles || [];
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

  if (loading && articles.length === 0) {
    return (
      <section className="articles-container-index">
        <h2 className="articles-title-index">
          <AnimatedText deps={[i18n.language]}>
            {t('articlesSection.title')}
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
      <section className="articles-container-index">
        <h2 className="articles-title-index">
          <AnimatedText deps={[i18n.language]}>
            {t('articlesSection.title')}
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
    <section className="articles-container-index">
      <h2 className="articles-title-index">
        <AnimatedText deps={[i18n.language]}>
          {t('articlesSection.title')}
        </AnimatedText>
      </h2>

      {articles.length > 0 ? (
        <div className={`articles-wrapper ${loading ? 'loading' : ''}`}>
          <ArticleCarousel articles={articles} translatedArticles={translatedArticles} />
          <ArticleGrid articles={articles} translatedArticles={translatedArticles} />
        </div>
      ) : (
        <div className="no-articles">
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('articlesSection.noArticlesText')}
            </AnimatedText>
          </p>
        </div>
      )}

      <div className={`see-all-articles ${loading ? 'loading' : ''}`}>
        <Link to="/news" className="see-all-link">
          <AnimatedText deps={[i18n.language]}>
            {t('articlesSection.seeAllLink')}
          </AnimatedText>
        </Link>
      </div>
    </section>
  );
};

export default React.memo(ArticlesSection);
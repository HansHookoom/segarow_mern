import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ImageService from '../../../services/ImageService';
import AssetService from '../../../services/AssetService';
import ImageWithSkeleton from '../ImageWithSkeleton/ImageWithSkeleton';
import AnimatedText from '../AnimatedText/AnimatedText';
import './ArticleGrid.css';

const ArticleGrid = ({ articles = [], translatedArticles = {} }) => {
  const { t, i18n } = useTranslation();
  if (!articles.length) return null;

  const handleImageError = (e) => {
    e.target.src = AssetService.getDefaultArticleFallback();
  };

  return (
    <div className="articles-grid-index">
      {articles.map((article, index) => {
        // Le premier article est affiché en grand
        const isMainCard = index === 0;
        const cardClass = isMainCard ? 'article-card-main-index' : 'article-card-index';
        const titleTag = isMainCard ? 'h3' : 'h4';

        return (
          <div key={article.id || index} className={cardClass}>
            <Link to={`/news/${article.slug}`} className="article-bg">
              <div className="article-image-container">
                <ImageWithSkeleton
                  src={article.image 
                    ? ImageService.getImageUrl(article.image)
                    : AssetService.getDefaultArticleFallback()
                  }
                  alt={article.title}
                  fallbackSrc={AssetService.getDefaultArticleFallback()}
                  skeletonHeight="100%"
                  className="article-image"
                />
              </div>
              <div className="article-content">
                {titleTag === 'h3' ? (
                  <h3 className="article-title">
                    <AnimatedText deps={[translatedArticles[article._id]?.title]}>
                      {translatedArticles[article._id]?.title || article.title}
                    </AnimatedText>
                  </h3>
                ) : (
                  <h4 className="article-title">
                    <AnimatedText deps={[translatedArticles[article._id]?.title]}>
                      {translatedArticles[article._id]?.title || article.title}
                    </AnimatedText>
                  </h4>
                )}
                
                {isMainCard && (translatedArticles[article._id]?.excerpt || article.excerpt) && (
                  <p className="article-description">
                    <AnimatedText deps={[translatedArticles[article._id]?.excerpt]}>
                      {translatedArticles[article._id]?.excerpt || article.excerpt}
                    </AnimatedText>
                  </p>
                )}
                
                <div className="article-actions">
                  <span className="know-more-button">
                    <AnimatedText deps={[i18n.language]}>
                      {t('news.readMore')}
                    </AnimatedText>
                  </span>
                  {article.readingTime && (
                    <span className="article-reading-time">
                      <span className="emoji-time"></span>
                      {article.readingTime}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(ArticleGrid);
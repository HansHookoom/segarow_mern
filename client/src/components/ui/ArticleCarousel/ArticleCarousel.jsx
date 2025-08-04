import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ImageService from '../../../services/ImageService';
import AssetService from '../../../services/AssetService';
import ImageWithSkeleton from '../ImageWithSkeleton/ImageWithSkeleton';
import AnimatedText from '../AnimatedText/AnimatedText';
import './ArticleCarousel.css';

const ArticleCarousel = ({ articles = [], translatedArticles = {} }) => {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slideCount = articles.length;

  const handleImageError = (e) => {
    e.target.src = AssetService.getDefaultArticleFallback();
  };

  // Navigation du carrousel
  const goToSlide = (index) => {
    if (isTransitioning) return;
    
    let newIndex = index;
    if (newIndex < 0) newIndex = slideCount - 1;
    if (newIndex >= slideCount) newIndex = 0;
    
    setIsTransitioning(true);
    setCurrentSlide(newIndex);
    setTimeout(() => setIsTransitioning(false), 500); // Correspond à la durée de la transition CSS
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  // Gestion des swipes
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Auto-slide
  useEffect(() => {
    const autoSlide = setInterval(() => {
      if (!isTransitioning) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(autoSlide);
  }, [currentSlide, isTransitioning]);

  if (!articles.length) return null;

  return (
    <div className="carousel-container">
      {/* Contrôles de navigation */}
      <div className="carousel-controls">
        <button 
          className="carousel-button prev" 
          onClick={prevSlide}
          disabled={isTransitioning}
          aria-label="Article précédent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
        <button 
          className="carousel-button next" 
          onClick={nextSlide}
          disabled={isTransitioning}
          aria-label="Article suivant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      {/* Track du carrousel */}
      <div 
        className={`carousel-track ${isTransitioning ? 'transitioning' : ''}`}
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {articles.map((article, index) => (
          <div key={article.id || index} className="carousel-item">
            <div className="article-card-carousel">
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
                  <h3 className="article-title">
                    <AnimatedText deps={[translatedArticles[article._id]?.title]}>
                      {translatedArticles[article._id]?.title || article.title}
                    </AnimatedText>
                  </h3>
                  {window.innerWidth <= 768 && (translatedArticles[article._id]?.excerpt || article.excerpt) && (
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
          </div>
        ))}
      </div>

      {/* Indicateurs */}
      <div className="carousel-indicators">
        {articles.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(ArticleCarousel);
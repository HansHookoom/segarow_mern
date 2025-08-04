import React from 'react';
import { Link } from 'react-router-dom';
import AssetService from '../../../services/AssetService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import './HeroSection.css';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../../../config/socialLinks';

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  return (
    <div className="hero-content">
      <div className="hero-text">
        <p className="hero-subtitle">
          <AnimatedText deps={[i18n.language]}>
            {t('heroSection.description')}
          </AnimatedText>
        </p>
        <h1 className="hero-title">
          <AnimatedText deps={[i18n.language]}>
            {t('heroSection.heroTitle')}
          </AnimatedText>
        </h1>
        <div className="hero-buttons">
          <Link to="/news" className="btn btn-primary">
            <AnimatedText deps={[i18n.language]}>
              {t('heroSection.articlesBtn')}
            </AnimatedText>
          </Link>
          <a
            href={SOCIAL_LINKS.YOUTUBE_MAIN}
            className="btn btn-secondary" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <AnimatedText deps={[i18n.language]}>
              {t('heroSection.youtubeBtn')}
            </AnimatedText>
          </a>
        </div>
      </div>
      
      <div className="hero-characters">
        <img 
          src={AssetService.getPublicImage(AssetService.IMAGES.PERSONNAGES_SEGA)}
          alt="Personnages SEGA"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default HeroSection;
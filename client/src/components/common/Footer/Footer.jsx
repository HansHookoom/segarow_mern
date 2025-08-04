import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import AssetService from '../../../services/AssetService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import { ThemeContext } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../../../config/socialLinks';

const Footer = () => {
  const { theme } = React.useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBorder}></div>
      <div 
        className={styles.geometricPattern}
        style={{ backgroundImage: AssetService.getCSSBackground(AssetService.IMAGES.FOOTER_PATTERN) }}
      ></div>
      
      <div className={styles.footerContainer}>
        {/* Section Info utiles */}
        <div className={styles.footerAbout}>
          <div className={styles.aboutTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('footer.usefulInfo')}
            </AnimatedText>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/conditions-generales">
              <AnimatedText deps={[i18n.language]}>
                {t('footer.terms')}
              </AnimatedText>
            </Link>
            <Link to="/mentions-legales">
              <AnimatedText deps={[i18n.language]}>
                {t('footer.legal')}
              </AnimatedText>
            </Link>
          </div>
        </div>
        
        {/* Logo central */}
        <div className={styles.footerLogo}>
          <img 
            className={styles.logoImg} 
            src={theme === 'light' ? AssetService.getPublicImage(AssetService.IMAGES.LOGO_BLACK) : AssetService.getPublicImage(AssetService.IMAGES.LOGO_WHITE)}
            alt="Logo Segarow"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallbackSpan = document.createElement('span');
              fallbackSpan.style.color = theme === 'light' ? '#191D32' : 'white';
              fallbackSpan.style.fontWeight = 'bold';
              fallbackSpan.style.fontSize = '32px';
              fallbackSpan.textContent = '🌀 SEGAROW';
              e.target.parentNode.appendChild(fallbackSpan);
            }}
          />
        </div>
        
        {/* Section Suivez-nous */}
        <div className={styles.footerFollow}>
          <div className={styles.followTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('footer.followUs')}
            </AnimatedText>
          </div>
          <div className={styles.footerSocial}>
            {/* YouTube */}
            <a 
              href={SOCIAL_LINKS.YOUTUBE_MAIN} 
              aria-label="YouTube" 
              className={`${styles.socialIconContainer} ${styles.youtube}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className={styles.socialIcon} role="img" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a2.998 2.998 0 00-2.115-2.117C19.421 3.5 12 3.5 12 3.5s-7.421 0-9.383.57A2.998 2.998 0 00.502 6.186C0 8.116 0 12 0 12s0 3.884.502 5.814a2.998 2.998 0 002.115 2.117C4.579 20.5 12 20.5 12 20.5s7.421 0 9.383-.57a2.998 2.998 0 002.115-2.117C24 15.884 24 12 24 12s0-3.884-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* Twitch */}
            <a 
              href={SOCIAL_LINKS.TWITCH} 
              aria-label="Twitch" 
              className={`${styles.socialIconContainer} ${styles.twitch}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className={styles.socialIcon} role="img" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.265 0L.5 4.106v15.788h5.823V24h3.638l2.912-4.106h4.412L23.5 13.059V0H4.265zm17.03 12.279l-2.353 3.411h-4.823l-2.882 4.106v-4.106H6.324V1.941h14.971v10.338zM17.618 5.824h-1.941v4.117h1.941V5.824zm-4.117 0h-1.941v4.117h1.941V5.824z"/>
              </svg>
            </a>

            {/* TikTok */}
            <a 
              href={SOCIAL_LINKS.TIKTOK} 
              aria-label="TikTok" 
              className={`${styles.socialIconContainer} ${styles.tiktok}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className={styles.socialIcon} role="img" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href={SOCIAL_LINKS.INSTAGRAM} 
              aria-label="Instagram" 
              className={`${styles.socialIconContainer} ${styles.instagram}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className={styles.socialIcon} role="img" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>

            {/* Discord */}
            <a 
              href={SOCIAL_LINKS.DISCORD} 
              aria-label="Discord" 
              className={`${styles.socialIconContainer} ${styles.discord}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className={styles.socialIcon} role="img" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.07.07 0 00-.073.034c-.211.375-.444.864-.608 1.249a18.268 18.268 0 00-5.487 0 12.683 12.683 0 00-.617-1.25.07.07 0 00-.073-.033 19.736 19.736 0 00-4.886 1.515.064.064 0 00-.03.027C.533 9.042-.32 13.579.099 18.057a.083.083 0 00.031.056 19.9 19.9 0 006.006 3.038.07.07 0 00.076-.027c.464-.64.874-1.311 1.226-2.013a.07.07 0 00-.038-.096 13.1 13.1 0 01-1.872-.9.07.07 0 01-.007-.117c.126-.094.252-.192.371-.291a.07.07 0 01.074-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 01.075.009c.12.099.245.198.372.292a.07.07 0 01-.006.117 12.26 12.26 0 01-1.873.899.07.07 0 00-.037.097c.36.702.77 1.373 1.225 2.012a.07.07 0 00.076.028 19.9 19.9 0 006.006-3.038.077.077 0 00.031-.055c.5-5.177-.838-9.672-3.548-13.661a.06.06 0 00-.03-.028zM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.419 0 1.333-.955 2.418-2.156 2.418zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.419 0 1.333-.946 2.418-2.156 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerCopyright}>
        <AnimatedText deps={[i18n.language]}>
          {/* {t('footer.copyright', { year: '2025' })} */}
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </AnimatedText>
      </div>
    </footer>
  );
};

export default Footer;

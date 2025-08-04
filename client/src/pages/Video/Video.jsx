import React, { useState, useEffect } from 'react';
import YouTubeService from '../../services/YouTubeService';
import AssetService from '../../services/AssetService';
import styles from './Video.module.css';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import YouTubeIframe from '../../components/ui/YouTubeIframe/YouTubeIframe';
import ImageWithSkeleton from '../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import { SOCIAL_LINKS } from '../../config/socialLinks';

const Video = () => {
  const { t, i18n } = useTranslation();
  const [featuredLive, setFeaturedLive] = useState(null);
  const [latestVideos, setLatestVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveTitle, setLiveTitle] = useState('SEGAROW en LIVE');

  useEffect(() => {
    loadVideoData();
  }, []);

  const loadVideoData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Charger la dernière rediffusion et les dernières vidéos en parallèle
      const [lives, videos] = await Promise.all([
        YouTubeService.fetchLives(1),
        YouTubeService.fetchVideos(2)
      ]);

      if (lives.length > 0) {
        const featuredItem = lives[0];
        setFeaturedLive(featuredItem);
        
        // Extraire le titre principal et mettre à jour le h2 (comme WordPress)
        const mainTitle = featuredItem.title.split('#')[0].trim();
        const videoNumber = YouTubeService.extractNumberFromTitle(featuredItem.title);
        setLiveTitle(`${mainTitle} ${videoNumber}`);
      }
      
      setLatestVideos(videos);
      
    } catch (err) {
      setError('Erreur lors du chargement des vidéos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const socialPlatforms = [
    {
      name: <AnimatedText deps={[i18n.language]}>{t('video.social.twitch.name')}</AnimatedText>,
      description: <AnimatedText deps={[i18n.language]}>{t('video.social.twitch.description')}</AnimatedText>,
      link: SOCIAL_LINKS.TWITCH,
      linkText: <AnimatedText deps={[i18n.language]}>{t('video.social.twitch.linkText')}</AnimatedText>,
      icon: (
        <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M2.149 0L0.5 4.6V20.864H5.814V24H9.092L12.228 20.864H16.747L23.5 14.111V0H2.149ZM21.314 13.111L17.785 16.64H12.228L9.092 19.775V16.64H4.671V2.186H21.314V13.111ZM17.785 6.246V12.998H15.6V6.246H17.785ZM12.228 6.246V12.998H10.043V6.246H12.228Z" fill="#9146FF"/>
        </svg>
      )
    },
    {
      name: <AnimatedText deps={[i18n.language]}>{t('video.social.instagram.name')}</AnimatedText>,
      description: <AnimatedText deps={[i18n.language]}>{t('video.social.instagram.description')}</AnimatedText>,
      link: SOCIAL_LINKS.INSTAGRAM,
      linkText: <AnimatedText deps={[i18n.language]}>{t('video.social.instagram.linkText')}</AnimatedText>,
      icon: (
        <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163C15.204 2.163 15.584 2.175 16.85 2.233C20.102 2.381 21.621 3.924 21.769 7.152C21.827 8.417 21.838 8.797 21.838 12.001C21.838 15.206 21.826 15.585 21.769 16.85C21.62 20.075 20.105 21.621 16.85 21.769C15.584 21.827 15.206 21.839 12 21.839C8.796 21.839 8.416 21.827 7.151 21.769C3.891 21.62 2.38 20.07 2.232 16.849C2.174 15.584 2.162 15.205 2.162 12C2.162 8.796 2.175 8.417 2.232 7.151C2.381 3.924 3.896 2.38 7.151 2.232C8.417 2.175 8.796 2.163 12 2.163ZM12 0C8.741 0 8.333 0.014 7.053 0.072C2.695 0.272 0.273 2.69 0.073 7.052C0.014 8.333 0 8.741 0 12C0 15.259 0.014 15.668 0.072 16.948C0.272 21.306 2.69 23.728 7.052 23.928C8.333 23.986 8.741 24 12 24C15.259 24 15.668 23.986 16.948 23.928C21.302 23.728 23.73 21.31 23.927 16.948C23.986 15.668 24 15.259 24 12C24 8.741 23.986 8.333 23.928 7.053C23.732 2.699 21.311 0.273 16.949 0.073C15.668 0.014 15.259 0 12 0ZM12 5.838C8.597 5.838 5.838 8.597 5.838 12C5.838 15.403 8.597 18.163 12 18.163C15.403 18.163 18.162 15.404 18.162 12C18.162 8.597 15.403 5.838 12 5.838ZM12 16C9.791 16 8 14.21 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.21 14.209 16 12 16ZM18.406 4.155C17.61 4.155 16.965 4.8 16.965 5.595C16.965 6.39 17.61 7.035 18.406 7.035C19.201 7.035 19.845 6.39 19.845 5.595C19.845 4.8 19.201 4.155 18.406 4.155Z" fill="url(#instagram-gradient)"/>
          <defs>
            <linearGradient id="instagram-gradient" x1="1.91304" y1="22.0869" x2="22.0869" y2="1.91304" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEE411"/>
              <stop offset="0.052" stopColor="#FEDB16"/>
              <stop offset="0.138" stopColor="#FEC125"/>
              <stop offset="0.248" stopColor="#FE983D"/>
              <stop offset="0.376" stopColor="#FE5F5E"/>
              <stop offset="0.5" stopColor="#FE2181"/>
              <stop offset="1" stopColor="#9000DC"/>
            </linearGradient>
          </defs>
        </svg>
      )
    },
    {
      name: <AnimatedText deps={[i18n.language]}>{t('video.social.discord.name')}</AnimatedText>,
      description: <AnimatedText deps={[i18n.language]}>{t('video.social.discord.description')}</AnimatedText>,
      link: SOCIAL_LINKS.DISCORD,
      linkText: <AnimatedText deps={[i18n.language]}>{t('video.social.discord.linkText')}</AnimatedText>,
      icon: (
        <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.492C18.787 3.802 17.147 3.291 15.432 3.002C15.414 2.999 15.397 3.007 15.387 3.022C15.184 3.371 14.958 3.824 14.798 4.183C12.9437 3.913 11.0723 3.913 9.248 4.183C9.08733 3.818 8.85633 3.371 8.65266 3.022C8.64266 3.007 8.62533 2.999 8.60766 3.002C6.89333 3.29 5.25333 3.802 3.72266 4.492C3.71066 4.497 3.70066 4.506 3.694 4.518C0.5393 9.365 -0.325 14.098 0.101 18.768C0.103 18.786 0.113 18.804 0.127 18.815C2.16633 20.342 4.1473 21.227 6.09 21.845C6.10766 21.85 6.12733 21.844 6.13766 21.829C6.593 21.202 7.00033 20.542 7.344 19.85C7.357 19.824 7.34566 19.793 7.31866 19.782C6.69466 19.544 6.09966 19.258 5.525 18.929C5.49466 18.911 5.49166 18.868 5.51866 18.847C5.6453 18.75 5.772 18.649 5.89266 18.547C5.90566 18.536 5.92233 18.533 5.93633 18.539C9.85226 20.352 14.1377 20.352 18.015 18.539C18.029 18.532 18.046 18.535 18.059 18.546C18.18 18.648 18.306 18.75 18.433 18.847C18.46 18.868 18.458 18.911 18.427 18.929C17.853 19.264 17.258 19.544 16.633 19.781C16.606 19.792 16.595 19.824 16.608 19.85C16.958 20.542 17.366 21.202 17.814 21.828C17.824 21.844 17.844 21.85 17.862 21.845C19.8153 21.227 21.7967 20.342 23.836 18.815C23.8507 18.804 23.8593 18.787 23.862 18.768C24.367 13.434 23.004 8.741 20.351 4.518C20.345 4.506 20.335 4.497 20.317 4.492ZM8.01907 15.935C6.83107 15.935 5.85625 14.849 5.85625 13.529C5.85625 12.209 6.81291 11.123 8.01907 11.123C9.23416 11.123 10.2009 12.217 10.182 13.529C10.182 14.849 9.22557 15.935 8.01907 15.935ZM15.9999 15.935C14.812 15.935 13.8371 14.849 13.8371 13.529C13.8371 12.209 14.7938 11.123 15.9999 11.123C17.215 11.123 18.1818 12.217 18.1627 13.529C18.1627 14.849 17.215 15.935 15.9999 15.935Z" fill="#5865F2"/>
        </svg>
      )
    },
    {
      name: <AnimatedText deps={[i18n.language]}>{t('video.social.youtube.name')}</AnimatedText>,
      description: <AnimatedText deps={[i18n.language]}>{t('video.social.youtube.description')}</AnimatedText>,
      link: SOCIAL_LINKS.YOUTUBE_MAIN,
      linkText: <AnimatedText deps={[i18n.language]}>{t('video.social.youtube.linkText')}</AnimatedText>,
      icon: (
        <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.498 6.186C23.322 5.547 22.822 5.047 22.183 4.871C20.644 4.5 12 4.5 12 4.5C12 4.5 3.356 4.5 1.817 4.871C1.178 5.047 0.678 5.547 0.502 6.186C0.131 7.725 0.131 12 0.131 12C0.131 12 0.131 16.275 0.502 17.814C0.678 18.453 1.178 18.953 1.817 19.129C3.356 19.5 12 19.5 12 19.5C12 19.5 20.644 19.5 22.183 19.129C22.822 18.953 23.322 18.453 23.498 17.814C23.869 16.275 23.869 12 23.869 12C23.869 12 23.869 7.725 23.498 6.186ZM9.546 15.569V8.431L15.818 12L9.546 15.569Z" fill="#FF0000"/>
        </svg>
      )
    },
    {
      name: <AnimatedText deps={[i18n.language]}>{t('video.social.tiktok.name')}</AnimatedText>,
      description: <AnimatedText deps={[i18n.language]}>{t('video.social.tiktok.description')}</AnimatedText>,
      link: SOCIAL_LINKS.TIKTOK,
      linkText: <AnimatedText deps={[i18n.language]}>{t('video.social.tiktok.linkText')}</AnimatedText>,
      icon: (
        <svg className={styles.socialIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="black"/>
        </svg>
      )
    }
  ];

  return (
    <section className={styles.globalContainer}>
      {/* Section principale */}
      <section className={styles.main}>
        <h2>
          <span className={styles.sonicIcon}>🌀</span>
          <AnimatedText deps={[i18n.language]}>{t('video.title')}</AnimatedText>
        </h2>
        <p>
          <AnimatedText deps={[i18n.language]}>{t('video.welcome')}</AnimatedText><br/><br/>
          <AnimatedText deps={[i18n.language]}>{t('video.description1')}</AnimatedText><br/>
          <AnimatedText deps={[i18n.language]}>{t('video.description2')}</AnimatedText>
        </p>
      </section>

      {/* Bannière */}
      <div className={styles.banner}>
        <ImageWithSkeleton
          src={AssetService.getPublicImage('banner.png')}
          alt="SEGAROW Banner"
          fallbackSrc={AssetService.getDefaultArticleFallback()}
          className={styles.segarowLogo}
          imgStyle={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          skeletonHeight="100%"
        />
      </div>

      {/* Bouton CTA */}
      <div className={styles.ctaContainer}>
        <a
          href={SOCIAL_LINKS.YOUTUBE_MAIN}
          className={`${styles.btn} ${styles.btnPrimary}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <AnimatedText deps={[i18n.language]}>{t('video.cta')}</AnimatedText>
        </a>
      </div>

      {/* Section vidéo en direct */}
      <section className={styles.liveSection}>
        <h2><AnimatedText deps={[i18n.language]}>{liveTitle}</AnimatedText></h2>
        
        {loading ? (
          <div className={styles.loading}>
            <AnimatedText deps={[i18n.language]}>
              {t('video.loadingLive')}
            </AnimatedText>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : featuredLive ? (
          <div className={styles.featuredLive}>
            <div className={styles.videoContainer}>
              <YouTubeIframe
                videoId={featuredLive.videoId}
                title={featuredLive.title}
                width="100%"
                height="100%"
              />
            </div>
            <h3>{featuredLive.title}</h3>
            <p>
              <AnimatedText deps={[i18n.language]}>
                {t('video.liveDate', { date: new Date(featuredLive.publishDate).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) })}
              </AnimatedText>
            </p>
            <a 
              href={SOCIAL_LINKS.YOUTUBE_WATCH+featuredLive.videoId}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoLink}
            >
              <AnimatedText deps={[i18n.language]}>{t('video.watchOnYoutube')}</AnimatedText>
            </a>
          </div>
        ) : (
          <div className={styles.noContent}>
            <AnimatedText deps={[i18n.language]}>
              {t('video.noLive')}
            </AnimatedText>
          </div>
        )}

        <h2><AnimatedText deps={[i18n.language]}>{t('video.latestVideos')}</AnimatedText></h2>
        
        {loading ? (
          <div className={styles.loading}>
            <AnimatedText deps={[i18n.language]}>
              {t('video.loadingVideos')}
            </AnimatedText>
          </div>
        ) : (
          <div className={styles.grid}>
            {latestVideos.map((video, index) => (
              <div key={`video-${video.videoId || index}`} className={styles.videoCard}>
                <div className={styles.videoContainer}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className={styles.videoInfo}>
                  <h3>{video.title}</h3>
                  <p>
                    <AnimatedText deps={[i18n.language]}>
                      {t('video.publishedOn', { date: new Date(video.publishDate).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' }) })}
                    </AnimatedText>
                  </p>
                  <a 
                    href={video.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.videoLink}
                  >
                    <AnimatedText deps={[i18n.language]}>{t('video.watchOnYoutube')}</AnimatedText>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section réseaux sociaux */}
      <section className={styles.socialSection}>
        <h2><AnimatedText deps={[i18n.language]}>{t('video.socialTitle')}</AnimatedText></h2>
        <div className={styles.socialPlatforms}>
          {socialPlatforms.map((platform, index) => (
            <div key={`platform-${index}`} className={styles.socialPlatform}>
              <h3>
                {platform.name} {platform.icon}
              </h3>
              <p>{platform.description}</p>
              <a 
                href={platform.link} 
                className={styles.socialLink}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <AnimatedText deps={[i18n.language]}>{platform.linkText}</AnimatedText>
              </a>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Video; 
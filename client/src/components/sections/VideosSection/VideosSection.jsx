import React, { useState, useEffect } from 'react';
import YouTubeService from '../../../services/YouTubeService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import YouTubeIframe from '../../ui/YouTubeIframe/YouTubeIframe';
import './VideosSection.css';
import { useTranslation } from 'react-i18next';

const VideosSection = () => {
  const { t, i18n } = useTranslation();
  const [lives, setLives] = useState([]);
  const [latestVideo, setLatestVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Debug: Afficher les variables d'environnement
    loadVideosData();
  }, []);

  const loadVideosData = async () => {
    try {
      setLoading(true);
      
      // Charger les lives et la dernière vidéo en parallèle
      const [livesData, videosData] = await Promise.all([
        YouTubeService.fetchLives(2),
        YouTubeService.fetchLatestVideo()
      ]);

      setLives(livesData);
      setLatestVideo(videosData);
    } catch (err) {
      setError(t('videoSection.error'));
      // Erreur vidéos
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="container-redif-video-index_php">
        <div className="loading emoji-loading">
          <AnimatedText deps={[i18n.language]}>
            {t('videoSection.loading')}
          </AnimatedText>
        </div>
      </section>
    );
  }

  return (
    <section className="container-redif-video-index_php">
      {/* Section Lives */}
      <h2>
        <AnimatedText deps={[i18n.language]}>
          {t('videoSection.livesSectionTitle')}
        </AnimatedText>
      </h2>
      <p className="description-redif-video-index_php">
        <AnimatedText deps={[i18n.language]}>
          {t('videoSection.livesSectionDesc')}
        </AnimatedText>
      </p>
      
      <div className="lives-grid">
        {lives.length > 0 ? (
          lives.map((live, index) => (
            <div key={index} className="live-item">
              <YouTubeIframe
                videoId={live.videoId}
                title={live.title}
                width="100%"
                height="100%"
              />
            </div>
          ))
        ) : (
          <div className="no-content">
            <AnimatedText deps={[i18n.language]}>
              {t('videoSection.noLive')}
            </AnimatedText>
          </div>
        )}
      </div>

      {/* Section Vidéos Normales */}
      <h2>
        <AnimatedText deps={[i18n.language]}>
          {t('videoSection.title')}
        </AnimatedText>
      </h2>
      <div className="latest-videos">
        {latestVideo ? (
          <>
            <div className="video-info-card">
              <div className="video-info-title">
                <AnimatedText deps={[i18n.language]}>
                  {t('videoSection.livePrefix')}
                </AnimatedText> {latestVideo.mainTitle}
                {latestVideo.videoNumber && (
                  <span className="video-number"> {latestVideo.videoNumber}</span>
                )}
              </div>
              <div className="video-info-text">
                <AnimatedText deps={[i18n.language]}>
                  {t('videoSection.liveDesc')}
                </AnimatedText>
              </div>
              <a 
                href="https://www.youtube.com/@segarow" 
                className="discover-button" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <AnimatedText deps={[i18n.language]}>
                  {t('videoSection.cta')}
                </AnimatedText>
              </a>
            </div>
            
            <div className="video-item">
              <YouTubeIframe
                videoId={latestVideo.videoId}
                title={latestVideo.title}
                width="100%"
                height="100%"
              />
            </div>
          </>
        ) : (
          <div className="no-content">
            <AnimatedText deps={[i18n.language]}>
              {t('videoSection.noVideo')}
            </AnimatedText>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p className="emoji-warning">
            <AnimatedText deps={[i18n.language]}>
              {t('videoSection.error')}
            </AnimatedText> {error}
          </p>
          <button onClick={loadVideosData} className="retry-button">
            <AnimatedText deps={[i18n.language]}>
              {t('videoSection.retry')}
            </AnimatedText>
          </button>
        </div>
      )}
    </section>
  );
};

export default VideosSection;
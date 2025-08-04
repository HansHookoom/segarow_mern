import React, { useState, useEffect } from 'react';
import styles from './AboutUs.module.css';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ImageWithSkeleton from '../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import { useTranslation } from 'react-i18next';

const AboutUs = () => {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTeam, setShowTeam] = useState(false);
  const teamMembers = React.useMemo(() => [
    {
      name: "Louis",
      role: t('about.team.louis.role'),
      image: "/assets/img/team/Louis.jpg",
      description: t('about.team.louis.description'),
      // linkedin: "https://linkedin.com",
      // instagram: "https://instagram.com"
    },
    {
      name: "Xela",
      role: t('about.team.xela.role'),
      image: "/assets/img/team/Xela.jpg",
      description: t('about.team.xela.description'),
      // linkedin: "https://linkedin.com",
      // instagram: "https://instagram.com"
    },
    {
      name: "Azurios",
      role: t('about.team.azurios.role'),
      image: "/assets/img/team/Azurios.jpg",
      description: t('about.team.azurios.description'),
      // linkedin: "https://linkedin.com",
      // instagram: "https://instagram.com"
    }
  ], [t, i18n.language]);

  // Animation d'apparition des cartes (au premier rendu)
  useEffect(() => {
    setShowTeam(true);
  }, []);

  // Navigation du carrousel
  const goToSlide = React.useCallback((index) => {
    if (index < 0) index = teamMembers.length - 1;
    if (index >= teamMembers.length) index = 0;
    setCurrentSlide(index);
  }, [teamMembers.length]);

  const nextSlide = React.useCallback(() => goToSlide(currentSlide + 1), [goToSlide, currentSlide]);
  const prevSlide = React.useCallback(() => goToSlide(currentSlide - 1), [goToSlide, currentSlide]);

  // Gestion des swipes pour mobile
  const handleTouchStart = React.useCallback((e) => {
    const touchStartX = e.touches[0].clientX;
    
    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const swipeThreshold = 50;
      
      if (touchStartX - touchEndX > swipeThreshold) {
        nextSlide();
      } else if (touchEndX - touchStartX > swipeThreshold) {
        prevSlide();
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
  }, [nextSlide, prevSlide]);

  // Composant carte membre mémorisé
  const TeamMemberCard = React.useCallback(({ member, visible }) => (
    <div className={`${styles.teamMember} ${visible ? styles.visible : ''}`}>
      <div className={styles.memberPhotoContainer}>
        <ImageWithSkeleton
          src={member.image}
          alt={member.name}
          className={styles.memberPhoto}
          fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjBGMEYwIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjE4IiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0yMCA5NUMyMCA4MCAzOCA2NSA2MCA2NVM5MCA4MCA5MCA5NSIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K"
          skeletonHeight="120px"
          skeletonProps={{
            style: { 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%',
              border: '3px solid var(--accent-color)'
            }
          }}
        />
      </div>
      <div className={styles.memberName}>{member.name}</div>
      <div className={styles.memberRole}>
        <AnimatedText>
          {member.role}
        </AnimatedText>
      </div>
      <div className={styles.memberDescription}>
        <AnimatedText>
          {member.description}
        </AnimatedText>
      </div>
      {/* <div className={styles.memberSocial}>
        <a 
          href={member.linkedin || '#'} 
          className={`${styles.socialLink} ${styles.socialLinkLinkedin}`}
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`LinkedIn de ${member.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 448 512">
            <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/>
          </svg>
        </a>
        <a 
          href={member.instagram || '#'} 
          className={`${styles.socialLink} ${styles.socialLinkInstagram}`}
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`Instagram de ${member.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 8 0zm0 1.44c2.136 0 2.39.01 3.233.048.78.036 1.203.166 1.485.276.374.145.64.318.92.598.28.28.453.546.598.92.11.282.24.705.276 1.485.038.844.047 1.097.047 3.233s-.01 2.39-.047 3.233c-.036.78-.166 1.203-.276 1.485-.145.374-.318.64-.598.92-.28.28-.546.453-.92.598-.282.11-.705.24-1.485.276-.844.038-1.097.047-3.233.047s-2.39-.01-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.598-.92c-.11-.282-.24-.705-.276-1.485-.038-.844-.047-1.097-.047-3.233s.01-2.39.047-3.233c.036-.78.166-1.203.276-1.485.145-.374.318-.64.598-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.844-.038 1.097-.047 3.233-.047z"/>
            <path d="M8 3.892a4.108 4.108 0 1 0 0 8.216 4.108 4.108 0 0 0 0-8.216zm0 6.775a2.667 2.667 0 1 1 0-5.334 2.667 2.667 0 0 1 0 5.334zm5.23-6.937a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z"/>
          </svg>
        </a>
      </div> */}
    </div>
  ), []);

  return (
    <div className={styles.aboutUsContainer}>
      <div className={styles.teamHeader}>
        <h2>
          <AnimatedText>
            {t('about.title')}
          </AnimatedText>
        </h2>
        <p>
          <AnimatedText>
            {t('about.intro')}
          </AnimatedText>
        </p>
      </div>

      {/* Affichage en grille (par défaut pour desktop) */}
      <div className={styles.teamGridWrapper}>
        {teamMembers.map((member, index) => (
          <TeamMemberCard key={index} member={member} visible={showTeam} />
        ))}
      </div>
      
      {/* Affichage en carrousel (pour mobile) */}
      <div className={styles.carouselContainer}>
        <div className={styles.carouselControls}>
          <button 
            className={`${styles.carouselButton} ${styles.prev}`}
            onClick={prevSlide}
            aria-label={t('about.prevMember')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          <button 
            className={`${styles.carouselButton} ${styles.next}`}
            onClick={nextSlide}
            aria-label={t('about.nextMember')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
        
        <div 
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={handleTouchStart}
        >
          {teamMembers.map((member, index) => (
            <div key={index} className={styles.carouselItem}>
              <TeamMemberCard member={member} visible={index === currentSlide} />
            </div>
          ))}
        </div>
        
        <div className={styles.carouselIndicators}>
          {teamMembers.map((_, index) => (
            <div
              key={index}
              className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              role="button"
              tabIndex={0}
              aria-label={t('about.gotoMember', { number: index + 1 })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  goToSlide(index);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 
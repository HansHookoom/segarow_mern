import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import AssetService from '../../../services/AssetService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './Header.module.css';
import { ThemeContext } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);
  const [displayedTheme, setDisplayedTheme] = useState(theme);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const { t, i18n } = useTranslation();
  const [isFlagFlipping, setIsFlagFlipping] = useState(false);

  // Fermer les menus lors du changement de route
  useEffect(() => {
    setIsMenuActive(false);
    setIsUserMenuOpen(false);
    document.body.style.overflow = '';
  }, [location]);

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      // Désactiver temporairement les transitions pour éviter l'animation de fermeture
      const menuElement = document.querySelector(`.${styles.mainMenu}`);
      if (menuElement) {
        menuElement.classList.add(styles.noTransition);
      }
      
      // Si on passe en desktop (1024px+), fermer le menu mobile et réactiver le scroll
      if (window.innerWidth >= 1024) {
        setIsMenuActive(false);
        setIsUserMenuOpen(false);
        document.body.style.overflow = '';
      }
      
      // Rétablir les transitions après un court délai
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (menuElement) {
          menuElement.classList.remove(styles.noTransition);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setDisplayedTheme(theme);
  }, []);

  // Animation du bouton de thème
  const handleThemeToggle = () => {
    if (isThemeAnimating) return;
    setIsThemeAnimating(true);
    setIsExiting(true);
    
    setTimeout(() => {
      setIsExiting(false);
      // Changer le thème ET le displayedTheme en même temps
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setDisplayedTheme(newTheme);
      toggleTheme();
      // Déclencher l'animation d'entrée
      setIsEntering(true);
    }, 400);
    
    setTimeout(() => {
      setIsEntering(false);
      setIsThemeAnimating(false);
    }, 900);
  };

  // Pour déclencher l'animation d'entrée
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => {
        setIsEntering(false);
      }, 30); // court délai pour laisser le temps au DOM d'appliquer .iconEnter
      return () => clearTimeout(timer);
    }
  }, [isEntering]);

  // Gérer l'ouverture/fermeture du menu burger
  const toggleMenu = (e) => {
    e.preventDefault();
    
    const newMenuState = !isMenuActive;
    setIsMenuActive(newMenuState);
    
    if (newMenuState) {
      document.body.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 10);
    }
  };

  // Fermer le menu au clic sur un lien
  const handleMenuLinkClick = () => {
    setIsMenuActive(false);
    setIsUserMenuOpen(false);
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 10);
  };

  // Gérer le menu utilisateur
  const toggleUserMenu = (e) => {
    e.preventDefault();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    handleMenuLinkClick();
    navigate('/');
  };

  // Navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/news', label: t('menu.news') },
      { path: '/reviews', label: t('menu.reviews') },
      { path: '/videos', label: t('menu.videos') },
      { path: '/about', label: t('menu.about') }
    ];

    const authItems = [];
    
    if (!isAuthenticated) {
      authItems.push({ path: '/login', label: t('menu.connect'), emojiClass: 'emoji-key' });
    } else {
      if (isAdmin) {
        authItems.push({ path: '/admin', label: t('menu.admin'), emojiClass: 'emoji-settings' });
      }
      // Gérer l'affichage du nom d'utilisateur avec fallback
      let displayName;
      if (user?.username) {
        displayName = user.username;
      } else if (user?.email) {
        // Extraire le nom d'utilisateur de l'email si le username n'est pas disponible
        displayName = user.email.split('@')[0];
      } else if (user?.id) {
        // Fallback avec l'ID si rien d'autre n'est disponible
        displayName = `Utilisateur_${user.id.slice(-4)}`;
      } else {
        displayName = t('menu.account');
      }
      
      const truncatedName = displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName;
      authItems.push({ 
        path: '#', 
        label: truncatedName,
        emojiClass: 'emoji-visitor',
        action: 'user-dropdown'
      });
    }

    return [...baseItems, ...authItems];
  };

  const handleLangToggle = () => {
    setIsFlagFlipping(true);
    setTimeout(() => {
      i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
      setIsFlagFlipping(false);
    }, 250); // doit correspondre à la durée de l'animation CSS
  };

  return (
    <header className={styles.siteHeader}>
      <nav className={styles.navbar}>
        <div className={styles.logoMenuContainer}>
          {/* Logo */}
          <div className={styles.logo}>
            <Link to="/">
              <img 
                src={
                  displayedTheme === 'light'
                    ? AssetService.getPublicImage(AssetService.IMAGES.LOGO_BLACK)
                    : AssetService.getPublicImage(AssetService.IMAGES.LOGO_WHITE)
                }
                alt="Logo Segarow"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallbackSpan = document.createElement('span');
                  fallbackSpan.style.color = displayedTheme === 'light' ? '#191D32' : 'white';
                  fallbackSpan.style.fontWeight = 'bold';
                  fallbackSpan.style.fontSize = '24px';
                  fallbackSpan.textContent = '🌀 SEGAROW';
                  e.target.parentNode.appendChild(fallbackSpan);
                }}
              />
            </Link>
          </div>
          {/* Bouton de changement de thème (mobile) */}
          <button onClick={handleThemeToggle} className={`${styles.themeToggleBtn} ${styles.themeToggleMobile}`} title="Changer de thème" disabled={isThemeAnimating}>
            <span className={styles.themeIconWrapper}>
              <img
                src={displayedTheme === 'light' ? AssetService.getPublicImage('shine.png') : AssetService.getPublicImage('moon.png')}
                alt={displayedTheme === 'light' ? 'Soleil' : 'Lune'}
                className={
                  `${styles.themeIcon} ` +
                  (isExiting 
                    ? (displayedTheme === 'light' ? styles.sunExit : styles.moonExit)
                    : isEntering
                    ? (displayedTheme === 'light' ? styles.sunEnter : styles.moonEnter)
                    : (displayedTheme === 'light' ? styles.sunVisible : styles.moonVisible)
                  )
                }
              />
            </span>
          </button>
          {/* Bouton hamburger */}
          <button 
            className={`${styles.hamburgerMenu} ${isMenuActive ? styles.active : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuActive}
          >
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
          </button>
        </div>

        {/* Menu principal */}
        <ul className={`${styles.mainMenu} ${isMenuActive ? styles.active : ''}`}>
          {getNavigationItems().map((item, i) => {
            if (item.action === 'user-dropdown') {
              return (
                <li key={i} className={styles.menuItem}>
                  <div className={styles.userDropdown}>
                    <button 
                      onClick={toggleUserMenu}
                      className={styles.userButton}
                      aria-expanded={isUserMenuOpen}
                    >
                      {item.label}
                      <span className={`${styles.dropdownArrow} ${isUserMenuOpen ? styles.open : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isUserMenuOpen && (
                      <div className={styles.userDropdownMenu}>
                        <Link 
                          to="/profile" 
                          onClick={handleMenuLinkClick}
                          className={`${styles.dropdownItem} emoji-button emoji-visitor`}
                        >
                          <AnimatedText deps={[i18n.language]}>{t('menu.account')}</AnimatedText>
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className={`${styles.dropdownItem} emoji-button emoji-logout`}
                        >
                          <AnimatedText deps={[i18n.language]}>{t('menu.logout')}</AnimatedText>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            } else {
              return (
                <li key={i} className={styles.menuItem}>
                  <Link 
                    to={item.path} 
                    onClick={handleMenuLinkClick}
                    className={`${location.pathname === item.path ? styles.activeLink : ''} emoji-button ${item.emojiClass || ''}`}
                  >
                    <AnimatedText deps={[i18n.language]}>
                      {item.label}
                    </AnimatedText>
                  </Link>
                </li>
              );
            }
          })}
          {/* Bouton de changement de thème (toujours à droite) */}
          <li className={`${styles.menuItem} ${styles.themeToggleDesktop}`}>
            <button onClick={handleThemeToggle} className={styles.themeToggleBtn} title="Changer de thème" disabled={isThemeAnimating}>
              <span className={styles.themeIconWrapper}>
                <img
                  src={displayedTheme === 'light' ? AssetService.getPublicImage('shine.png') : AssetService.getPublicImage('moon.png')}
                  alt={displayedTheme === 'light' ? 'Soleil' : 'Lune'}
                  className={
                    `${styles.themeIcon} ` +
                    (isExiting 
                      ? (displayedTheme === 'light' ? styles.sunExit : styles.moonExit)
                      : isEntering
                      ? (displayedTheme === 'light' ? styles.sunEnter : styles.moonEnter)
                      : (displayedTheme === 'light' ? styles.sunVisible : styles.moonVisible)
                    )
                  }
                />
              </span>
            </button>
          </li>
          {/* Bouton de langue (toujours tout à droite) */}
          <li className={styles.menuItem}>
            <button onClick={handleLangToggle} className={styles.langToggleBtn} style={{width: 48, height: 40, fontWeight: 'bold', fontSize: '1.1em'}} title={i18n.language === 'fr' ? 'Passer en anglais' : 'Switch to French'}>
              <span className={styles.langFlagWrapper}>
                <img
                  src={i18n.language === 'fr' ? AssetService.getPublicImage('fr.png') : AssetService.getPublicImage('en.png')}
                  alt={i18n.language === 'fr' ? 'Français' : 'English'}
                  className={`${styles.langFlag} ${isFlagFlipping ? styles['langFlag-flip'] : ''}`}
                />
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
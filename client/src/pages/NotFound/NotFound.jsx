import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import styles from './NotFound.module.css';

const NotFound = () => {
  const { t, i18n } = useTranslation();

  return (
    <section className={styles.notFoundContainer}>
      <h1 className={styles.title}>
        <AnimatedText deps={[i18n.language]}>
          {t('notFound.title')}
        </AnimatedText>
      </h1>
      <p className={styles.message}>
        <AnimatedText deps={[i18n.language]}>
          {t('notFound.message')}
        </AnimatedText>
      </p>
      <p className={styles.subMessage}>
        <AnimatedText deps={[i18n.language]}>
          {t('notFound.subMessage')}
        </AnimatedText>
      </p>
      <div className={styles.gameWrapper}>
        <iframe
          src="/dino_sonic/sonic_dino_game.html"
          title="Sonic Dino Game"
          allowFullScreen
        />
      </div>
      <Link to="/" className={styles.homeButton}>
        <AnimatedText deps={[i18n.language]}>
          {t('notFound.homeButton')}
        </AnimatedText>
      </Link>
    </section>
  );
};

export default NotFound;
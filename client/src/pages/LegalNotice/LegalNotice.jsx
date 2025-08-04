import React, { useEffect } from 'react';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import styles from './LegalNotice.module.css';
import { useTranslation } from 'react-i18next';

const LegalNotice = () => {
  const { t, i18n } = useTranslation();

  // Aller en haut de la page au chargement
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className={styles.legalNoticeContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <AnimatedText deps={[i18n.language]}>
            {t('legalNotice.title')}
          </AnimatedText>
        </h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.siteInfo.title')}
            </AnimatedText>
          </h2>
          <p className={styles.siteName}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.siteInfo.name')}
            </AnimatedText>
          </p>
          <p className={styles.siteUrl}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.siteInfo.url')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.publisher.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.publisher.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.publisher.responsible')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.hosting.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.hosting.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.hosting.company')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.hosting.address')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.hosting.website')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.accountData')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.cookies')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.thirdParty')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.intellectualProperty.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.intellectualProperty.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.intellectualProperty.prohibition')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.contact.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.contact.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.contact.emailLabel')}
            </AnimatedText>
            {' '}
            <a href="mailto:louis.broeglin@segarow.com" className={styles.contactEmail}>
              louis.broeglin@segarow.com
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.intellectualProperty.openSourceTitle')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('legalNotice.dataProtection.openSource')}
            </AnimatedText>
            {' '}
            <a 
              href="https://github.com/HansHookoom/segarow_mern" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              https://github.com/HansHookoom/segarow_mern
            </a>
          </p>
        </section>
      </div>
    </main>
  );
};

export default LegalNotice; 
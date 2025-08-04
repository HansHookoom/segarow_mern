import React, { useEffect } from 'react';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import styles from './PrivacyPolicy.module.css';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();

  // Aller en haut de la page au chargement
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className={styles.privacyPolicyContainer}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <AnimatedText deps={[i18n.language]}>
            {t('privacyPolicy.title')}
          </AnimatedText>
        </h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.acceptance.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.acceptance.description')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.access.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.access.description')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.userAccounts.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.userAccounts.description')}
            </AnimatedText>
          </p>
          <ul>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userAccounts.features.1')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userAccounts.features.2')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userAccounts.features.3')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userAccounts.features.4')}
              </AnimatedText>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.modifications.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.modifications.description')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.content.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.content.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.content.accuracy')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.userConduct.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.userConduct.description')}
            </AnimatedText>
          </p>
          <ul>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userConduct.rules.1')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userConduct.rules.2')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userConduct.rules.3')}
              </AnimatedText>
            </li>
            <li>
              <AnimatedText deps={[i18n.language]}>
                {t('privacyPolicy.userConduct.rules.4')}
              </AnimatedText>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.liability.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.liability.description')}
            </AnimatedText>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.contact.title')}
            </AnimatedText>
          </h2>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.contact.description')}
            </AnimatedText>
          </p>
          <p>
            <AnimatedText deps={[i18n.language]}>
              {t('privacyPolicy.contact.emailLabel')}
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

export default PrivacyPolicy; 
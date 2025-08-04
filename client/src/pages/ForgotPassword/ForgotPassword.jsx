import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ApiService from '../../services/ApiService';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ApiService.post('/api/auth/forgot-password', {
        email
      });

      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.forgotContainer}>
        <div className={styles.forgotBox}>
          <div className={styles.forgotHeader}>
            <h1 className={styles.forgotTitle}>
              <span className={styles.sonicIcon}>📧</span> 
              <AnimatedText deps={[i18n.language]}>
                Email envoyé !
              </AnimatedText>
            </h1>
          </div>
          <div className={styles.successMessage}>
            <AnimatedText deps={[i18n.language]}>
              {t('login.resetLinkSent')}
            </AnimatedText>
          </div>
          <button
            onClick={() => navigate('/login')}
            className={`${styles.primaryButton} ${styles.backButton} emoji-button emoji-key`}
          >
            <AnimatedText deps={[i18n.language]}>
              {t('login.backToLogin')}
            </AnimatedText>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotContainer}>
      <div className={styles.forgotBox}>
        <div className={styles.forgotHeader}>
          <h1 className={styles.forgotTitle}>
            <span className={styles.sonicIcon}>🔐</span> 
            <AnimatedText deps={[i18n.language]}>
              {t('login.forgotPasswordTitle')}
            </AnimatedText>
          </h1>
          <p className={styles.forgotSubtitle}>
            <AnimatedText deps={[i18n.language]}>
              {t('login.forgotPasswordDesc')}
            </AnimatedText>
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AnimatedText deps={[i18n.language]}>
              {error}
            </AnimatedText>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label htmlFor="forgot-email" className={styles.formLabel}>
              <AnimatedText deps={[i18n.language]}>
                {t('login.email')}
              </AnimatedText>
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.formInput}
              placeholder={t('login.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.primaryButton} ${styles.sendButton} emoji-button emoji-plane`}
          >
            <AnimatedText deps={[i18n.language]}>
              {loading ? t('login.sendingResetLink') : t('login.sendResetLink')}
            </AnimatedText>
          </button>
        </form>

        <div className={styles.backToLogin}>
          <button
            onClick={() => navigate('/login')}
            className={`${styles.secondaryButton} emoji-button emoji-key`}
          >
            <AnimatedText deps={[i18n.language]}>
              {t('login.backToLogin')}
            </AnimatedText>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 
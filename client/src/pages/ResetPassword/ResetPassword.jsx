import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ApiService from '../../services/ApiService';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ApiService.post('/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!token) {
    return (
      <div className={styles.resetContainer}>
        <div className={styles.resetBox}>
          <div className={styles.resetHeader}>
            <h1 className={styles.resetTitle}>
              <span className={styles.sonicIcon}>🌀</span> 
              <AnimatedText deps={[i18n.language]}>
                {t('login.forgotPasswordTitle')}
              </AnimatedText>
            </h1>
          </div>
          <div className={styles.errorMessage}>
            <AnimatedText deps={[i18n.language]}>
              Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.
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

  if (success) {
    return (
      <div className={styles.resetContainer}>
        <div className={styles.resetBox}>
          <div className={styles.resetHeader}>
            <h1 className={styles.resetTitle}>
              <span className={styles.sonicIcon}>✅</span> 
              <AnimatedText deps={[i18n.language]}>
                Mot de passe réinitialisé !
              </AnimatedText>
            </h1>
          </div>
          <div className={styles.successMessage}>
            <AnimatedText deps={[i18n.language]}>
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
            </AnimatedText>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetContainer}>
      <div className={styles.resetBox}>
        <div className={styles.resetHeader}>
          <h1 className={styles.resetTitle}>
            <span className={styles.sonicIcon}>🔐</span> 
            <AnimatedText deps={[i18n.language]}>
              {t('login.forgotPasswordTitle')}
            </AnimatedText>
          </h1>
          <p className={styles.resetSubtitle}>
            <AnimatedText deps={[i18n.language]}>
              Définissez votre nouveau mot de passe
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
            <label htmlFor="new-password" className={styles.formLabel}>
              <AnimatedText deps={[i18n.language]}>
                Nouveau mot de passe
              </AnimatedText>
            </label>
            <input
              id="new-password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="confirm-password" className={styles.formLabel}>
              <AnimatedText deps={[i18n.language]}>
                Confirmer le mot de passe
              </AnimatedText>
            </label>
            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${styles.primaryButton} ${styles.resetButton} emoji-button emoji-key`}
          >
            <AnimatedText deps={[i18n.language]}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </AnimatedText>
          </button>
        </form>

        <div className={styles.backToLogin}>
          <button
            onClick={() => navigate('/login')}
            className={`${styles.secondaryButton} emoji-button emoji-arrow-left`}
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

export default ResetPassword; 
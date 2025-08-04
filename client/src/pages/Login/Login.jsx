import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import styles from './Login.module.css';
import { useTranslation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import toast from 'react-hot-toast';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [leavingForm, setLeavingForm] = useState(null); // 'signin' ou 'signup' ou null
  const [enteringClass, setEnteringClass] = useState('');
  const [formKey, setFormKey] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Vérifier si l'utilisateur arrive ici suite à une expiration de session
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message === 'session_expired') {
      toast.error(t('login.sessionExpired'), {
        duration: 5000,
      });
      setError(t('login.sessionExpired'));
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Appel API vers votre backend MongoDB
      const data = await ApiService.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      // Connexion réussie - utiliser accessToken et refreshToken
      login(data.user, data.accessToken, data.refreshToken);
      
      // Rediriger vers l'accueil
      navigate('/');
    } catch (error) {
      let errorMsg = error.message || t('login.invalidCredentials');
      if (errorMsg.includes('password') && errorMsg.includes('at least 6')) {
        errorMsg = t('login.passwordTooShort');
      }
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!credentials.email || !credentials.password || !credentials.username) {
      setError('Veuillez remplir tous les champs pour l\'inscription');
      return;
    }

    if (!acceptTerms) {
      setError(t('login.termsRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Créer un compte utilisateur
      const data = await ApiService.post('/api/auth/register', {
        email: credentials.email,
        password: credentials.password,
        username: credentials.username
        // role: 'visitor' // Supprimé, géré côté backend
      });

      // Inscription réussie, connexion automatique - utiliser accessToken et refreshToken
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/');
      alert('Compte créé avec succès ! Vous êtes maintenant connecté.');
    } catch (error) {
      let errorMsg = error.message || 'Erreur lors de la création du compte';
      if (errorMsg.includes('password') && errorMsg.includes('at least 6')) {
        errorMsg = t('login.passwordTooShort');
      }
      if (errorMsg.includes('username') && errorMsg.includes('at least 2')) {
        errorMsg = t('login.usernameTooShort');
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setTransitioning(true);
    setLeavingForm(isRegisterMode ? 'signup' : 'signin');
    setEnteringClass('form-enter');
    setTimeout(() => {
      setShowRegister(!isRegisterMode);
      setIsRegisterMode(!isRegisterMode);
      setError('');
      setCredentials({ email: '', password: '', username: '' });
      setAcceptTerms(false);
      setLeavingForm(null);
      setTimeout(() => {
        setEnteringClass('form-enter-active');
      }, 10); // Prochain tick pour déclencher la transition
      setTransitioning(false);
    }, 400); // Durée de la transition CSS
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>
            <span className={styles.sonicIcon}>🌀</span> 
            <AnimatedText deps={[i18n.language]}>
              {t('login.title')}
            </AnimatedText>
          </h1>
          {/* <p className={styles.loginSubtitle}>Connectez-vous avec MongoDB !</p> */}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AnimatedText deps={[i18n.language]}>
              {error}
            </AnimatedText>
          </div>
        )}

        <div className={`${styles.formContainer} ${isRegisterMode ? styles.signup : styles.signin}`}>
          {/* Formulaire de connexion (toujours présent mais caché si en mode register) */}
          {(!showRegister || leavingForm === 'signin') && (
            <form
              className={
                styles.formTransition + ' ' +
                (transitioning
                  ? (leavingForm === 'signin' ? styles['form-leave-active'] : styles['form-leave'])
                  : (!showRegister ? (enteringClass ? styles[enteringClass] : styles['form-enter-active']) : styles['form-leave'])
                )
              }
              style={{ zIndex: leavingForm === 'signin' ? 2 : 1 }}
              onSubmit={handleSubmit}
            >
              <div className={styles.formField}>
                <label htmlFor="login-email" className={styles.formLabel}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.email')}
                  </AnimatedText>
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({...prev, email: e.target.value}))}
                  className={styles.formInput}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="login-password" className={styles.formLabel}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.password')}
                  </AnimatedText>
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
                  className={styles.formInput}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.primaryButton} ${styles.loginButton} emoji-button emoji-key`}
              >
                <AnimatedText deps={[i18n.language]}>
                  {loading ? t('login.loading') : t('login.loginBtn')}
                </AnimatedText>
              </button>
              <div className={styles.forgotPassword}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`${styles.forgotPasswordLink} emoji-button emoji-question`}
                >
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.forgotPassword')}
                  </AnimatedText>
                </button>
              </div>
            </form>
          )}
          {/* Formulaire d'inscription (toujours présent mais caché si en mode signin) */}
          {(showRegister || leavingForm === 'signup') && (
            <form
              className={
                styles.formTransition + ' ' +
                (transitioning
                  ? (leavingForm === 'signup' ? styles['form-leave-active'] : styles['form-leave'])
                  : (showRegister ? (enteringClass ? styles[enteringClass] : styles['form-enter-active']) : styles['form-leave'])
                )
              }
              style={{ zIndex: leavingForm === 'signup' ? 2 : 1 }}
              onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
            >
              <div className={styles.formField}>
                <label htmlFor="register-email" className={styles.formLabel}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.email')}
                  </AnimatedText>
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({...prev, email: e.target.value}))}
                  className={styles.formInput}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="register-username" className={styles.formLabel}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.username')}
                  </AnimatedText>
                </label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 20); // Limiter à 20 caractères
                    setCredentials(prev => ({...prev, username: value}));
                  }}
                  className={styles.formInput}
                  placeholder={t('login.usernamePlaceholder')}
                  maxLength={20}
                  required
                  autoComplete="username"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="register-password" className={styles.formLabel}>
                  <AnimatedText deps={[i18n.language]}>
                    {t('login.password')}
                  </AnimatedText>
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
                  className={styles.formInput}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className={styles.checkbox}
                    required
                  />
                  <span className={styles.checkboxText}>
                    <AnimatedText deps={[i18n.language]}>
                      {t('login.acceptTerms')}
                    </AnimatedText>
                    {' '}
                    <a 
                      href="/conditions-generales" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.termsLink}
                    >
                      <AnimatedText deps={[i18n.language]}>
                        {t('login.termsOfService')}
                      </AnimatedText>
                    </a>
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.primaryButton} ${styles.registerButton} emoji-button emoji-sparkle`}
              >
                <AnimatedText deps={[i18n.language]}>
                  {loading ? t('login.loadingRegister') : t('login.registerBtn')}
                </AnimatedText>
              </button>
            </form>
          )}
        </div>

        <div className={styles.modeToggle}>
          <button
            type="button"
            onClick={handleToggleMode}
            className={`${styles.toggleButton} emoji-button ${isRegisterMode ? 'emoji-key' : 'emoji-sparkle'}`}
          >
            <AnimatedText deps={[i18n.language]}>
              {isRegisterMode ? t('login.alreadyHaveAccount') : t('login.noAccount')}
            </AnimatedText>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../components/ui/AnimatedText/AnimatedText';
import ApiService from '../../services/ApiService';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmText: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username.trim()) {
      setError(t('profile.errors.usernameRequired'));
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError(t('profile.errors.passwordsDontMatch'));
      setLoading(false);
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError(t('profile.errors.currentPasswordRequired'));
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        username: formData.username
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const data = await ApiService.put('/api/auth/profile', updateData, true);

      // Mettre à jour les données utilisateur - utiliser les tokens actuels
      const currentToken = localStorage.getItem('segarow_token');
      const refreshToken = localStorage.getItem('segarow_refresh_token');
      login(data.user, currentToken, refreshToken);
      setSuccess(t('profile.updateSuccess'));
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(t('profile.errors.server'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInputChange = (e) => {
    const { name, value } = e.target;
    setDeleteData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!deleteData.password) {
      toast.error(t('profile.errors.deletePasswordRequired'));
      return;
    }

    if (deleteData.confirmText !== 'SUPPRIMER MON COMPTE') {
      toast.error(t('profile.errors.deleteConfirmText'));
      return;
    }

    const isAdmin = user?.role === 'admin';
    const confirmMessage = isAdmin 
      ? t('profile.deleteConfirm.admin')
      : t('profile.deleteConfirm.user');
    
    const finalConfirm = window.confirm(confirmMessage);

    if (!finalConfirm) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError('');

      const data = await ApiService.delete('/api/auth/delete-account', {
        password: deleteData.password,
        confirmText: deleteData.confirmText
      }, true);

      const statsMessage = `\n${t('profile.deleteStats')} :\n• ${data.deletedData.likes} likes\n• ${data.deletedData.articles} articles\n• ${data.deletedData.reviews} reviews`;
      const adminMessage = data.deletedData.wasAdmin ? `\n\n${t('profile.deleteAdminLost')}` : '';
      
      toast.success(`✅ ${t('profile.deleteSuccess')}\n${statsMessage}${adminMessage}`, {
        duration: 6000,
      });
      
      // Déconnecter l'utilisateur et rediriger
      logout();
      navigate('/');
    } catch (error) {
      setError(t('profile.errors.server'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileBox}>
        <div className={styles.profileHeader}>
          <h1 className={`${styles.profileTitle} emoji-visitor`}>
            <AnimatedText deps={[i18n.language]}>{t('profile.title')}</AnimatedText>
          </h1>
          <p className={styles.profileSubtitle}>
            <AnimatedText deps={[i18n.language]}>{t('profile.subtitle')}</AnimatedText>
          </p>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <AnimatedText deps={[i18n.language]}>{t('profile.email')}</AnimatedText> :
            </span>
            <span className={styles.infoValue}>{user?.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <AnimatedText deps={[i18n.language]}>{t('profile.role')}</AnimatedText> :
            </span>
            <span className={styles.infoValue}>
              <AnimatedText deps={[i18n.language]}>
                <span className={user?.role === 'admin' ? 'emoji-admin' : 'emoji-visitor'}>
                  {user?.role === 'admin' ? t('profile.admin') : t('profile.visitor')}
                </span>
              </AnimatedText>
            </span>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <AnimatedText deps={[i18n.language]}>{error}</AnimatedText>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <AnimatedText deps={[i18n.language]}>{success}</AnimatedText>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <AnimatedText deps={[i18n.language]}>
                {t('profile.generalInfoTitle')}
              </AnimatedText>
            </h3>
            
            <div className={styles.formField}>
              <label htmlFor="profile-username" className={styles.formLabel}>
                <AnimatedText deps={[i18n.language]}>{t('profile.username')}</AnimatedText>
              </label>
              <input
                id="profile-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 20); // Limiter à 20 caractères
                  setFormData(prev => ({...prev, username: value}));
                }}
                className={styles.formInput}
                placeholder={t('profile.usernamePlaceholder')}
                maxLength={20}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <AnimatedText deps={[i18n.language]}>
                {t('profile.passwordChangeTitle')}
              </AnimatedText>
            </h3>
            <p className={styles.sectionDescription}>
              <AnimatedText deps={[i18n.language]}>{t('profile.passwordChangeInfo')}</AnimatedText>
            </p>
            
            <div className={styles.formField}>
              <label htmlFor="profile-current-password" className={styles.formLabel}>
                <AnimatedText deps={[i18n.language]}>{t('profile.currentPassword')}</AnimatedText>
              </label>
              <input
                id="profile-current-password"
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="profile-new-password" className={styles.formLabel}>
                <AnimatedText deps={[i18n.language]}>{t('profile.newPassword')}</AnimatedText>
              </label>
              <input
                id="profile-new-password"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="profile-confirm-password" className={styles.formLabel}>
                <AnimatedText deps={[i18n.language]}>{t('profile.confirmNewPassword')}</AnimatedText>
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.saveButton} emoji-button emoji-save`}
            >
              <AnimatedText deps={[i18n.language]}>
                {loading ? t('profile.saving') : t('profile.save')}
              </AnimatedText>
            </button>
          </div>
        </form>

        {/* Section dangereuse - Suppression de compte */}
        <div className={styles.dangerSection}>
          <div className={styles.dangerHeader}>
            <h3 className={`${styles.dangerTitle} emoji-danger-zone`}>
              <AnimatedText deps={[i18n.language]}>{t('profile.dangerZoneTitle')}</AnimatedText>
            </h3>
            <p className={styles.dangerDescription}>
              <AnimatedText deps={[i18n.language]}>{t('profile.dangerZoneInfo')}</AnimatedText>
            </p>
          </div>
          
          {!showDeleteSection ? (
            <button
              type="button"
              onClick={() => setShowDeleteSection(true)}
              className={`${styles.showDeleteBtn} emoji-button emoji-delete`}
            >
              <AnimatedText deps={[i18n.language]}>{t('profile.deleteAccountBtn')}</AnimatedText>
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className={styles.deleteForm}>
              <div className={styles.deleteWarning}>
                <h4 className="emoji-warning">
                  <AnimatedText deps={[i18n.language]}>{t('profile.deleteFinalTitle')}</AnimatedText>
                </h4>
                <p>
                  <AnimatedText deps={[i18n.language]}>{t('profile.deleteWillRemove')}</AnimatedText>
                </p>
                <ul>
                  <li><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.profile')}</AnimatedText></li>
                  <li><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.likes')}</AnimatedText></li>
                  <li><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.comments')}</AnimatedText></li>
                  <li><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.articles')}</AnimatedText></li>
                  <li><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.likesOnContent')}</AnimatedText></li>
                  {user?.role === 'admin' && (
                    <>
                      <li><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.adminStatus')}</AnimatedText></strong></li>
                      <li><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.siteStats')}</AnimatedText></strong></li>
                      <li><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.addContent')}</AnimatedText></strong></li>
                      <li><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteList.deleteContent')}</AnimatedText></strong></li>
                    </>
                  )}
                </ul>
                {user?.role === 'admin' ? (
                  <p><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteAdminWarning')}</AnimatedText></strong></p>
                ) : (
                  <p><strong><AnimatedText deps={[i18n.language]}>{t('profile.deleteIrreversible')}</AnimatedText></strong></p>
                )}
              </div>

              <div className={styles.deleteFields}>
                <div className={styles.formField}>
                  <label htmlFor="delete-password" className={styles.formLabel}>
                    <AnimatedText deps={[i18n.language]}>{t('profile.deletePasswordLabel')}</AnimatedText>
                  </label>
                  <input
                    id="delete-password"
                    type="password"
                    name="password"
                    value={deleteData.password}
                    onChange={handleDeleteInputChange}
                    className={styles.formInput}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="delete-confirm" className={styles.formLabel}>
                    <AnimatedText deps={[i18n.language]}>{t('profile.deleteConfirmLabel')}</AnimatedText>
                  </label>
                  <input
                    id="delete-confirm"
                    type="text"
                    name="confirmText"
                    value={deleteData.confirmText}
                    onChange={handleDeleteInputChange}
                    className={styles.formInput}
                    placeholder="SUPPRIMER MON COMPTE"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className={styles.deleteActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteSection(false);
                    setDeleteData({ password: '', confirmText: '' });
                    setError('');
                  }}
                  className={styles.cancelDeleteBtn}
                  disabled={deleteLoading}
                >
                  <AnimatedText deps={[i18n.language]}>{t('profile.cancel')}</AnimatedText>
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || !deleteData.password || deleteData.confirmText !== 'SUPPRIMER MON COMPTE'}
                  className={styles.confirmDeleteBtn}
                >
                  <AnimatedText deps={[i18n.language]}>
                    {deleteLoading ? t('profile.deleting') : t('profile.deleteConfirmBtn')}
                  </AnimatedText>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 
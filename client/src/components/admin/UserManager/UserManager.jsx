import React, { useState, useEffect, useMemo } from 'react';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import SearchBar from '../../ui/SearchBar/SearchBar';
import styles from './UserManager.module.css';
import { useTranslation } from 'react-i18next';
import ApiService from '../../../services/ApiService';
import toast from 'react-hot-toast';

const UserManager = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteLoading, setDeleteLoading] = useState({});

  // Construire l'URL de l'API avec les paramètres de recherche
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }
    return `/api/admin/users?${params.toString()}`;
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [apiUrl]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await ApiService.get(apiUrl, true);
      setUsers(data.users || []);
    } catch (err) {
      setError(t('userManager.loadError'));
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteUser = async (userId, username, email) => {
    const confirmMessage = t('userManager.deleteConfirm', { username, email });

    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== 'SUPPRIMER') {
      toast(t('userManager.deleteCancelled'), { className: 'toast-info' });
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [userId]: true }));
      setError('');

      // Utiliser une requête fetch personnalisée pour DELETE avec body
      const token = localStorage.getItem('segarow_token');
      const response = await fetch(`${ApiService.API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmAction: true })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('userManager.deleteSuccess'));
        loadUsers(); // Recharger la liste
      } else {
        toast.error(data.message || t('userManager.deleteError'));
        setError(data.message || t('userManager.deleteError'));
      }
    } catch (err) {
      toast.error(err.message || t('userManager.deleteError'));
      setError(err.message || t('userManager.deleteError'));
    } finally {
      setDeleteLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.userManager}>
      <div className={styles.header}>
        <h2>👥 
          <AnimatedText deps={[i18n.language]}>
            {t('userManager.title')}
          </AnimatedText>
        </h2>
        <div className={styles.headerActions}>
          <button onClick={loadUsers} className={styles.refreshBtn}>
            🔄 
            <AnimatedText deps={[i18n.language]}>
              {t('userManager.refresh')}
            </AnimatedText>
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>❌ 
        <AnimatedText deps={[i18n.language]}>
          {error}
        </AnimatedText>
      </div>}

      {/* Barre de recherche */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder={t('search.usersPlaceholder')}
      />

      {/* Liste des utilisateurs */}
      <div className={styles.usersSection}>
        <h3>📋 
          <AnimatedText deps={[i18n.language]}>
            {t('userManager.userList', { count: users.length })}
          </AnimatedText>
        </h3>
        
        {loading ? (
          <div className={styles.loading}>
            <AnimatedText deps={[i18n.language]}>
              {t('userManager.loading')}
            </AnimatedText>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <AnimatedText deps={[i18n.language]}>
              {searchTerm.trim() ? t('search.noResults') : t('userManager.noUsers')}
            </AnimatedText>
          </div>
        ) : (
          <>
            {/* Affichage du nombre de résultats si une recherche est active */}
            {searchTerm.trim() && (
              <div className={styles.searchResults}>
                <p>
                  <AnimatedText deps={[i18n.language, users.length]}>
                    {t('search.resultsCount', { count: users.length })}
                  </AnimatedText>
                </p>
              </div>
            )}
            
            <div className={styles.usersList}>
              {users.map((user) => (
                <div key={user._id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userMain}>
                      <div className={styles.userName}>
                        {user.role === 'admin' ? '🔧' : '👤'} {user.username}
                      </div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                    <div className={styles.userMeta}>
                      <div className={styles.userRole}>
                        {user.role === 'admin' ? (
                          <span className={styles.adminRole}>🛡️ 
                            <AnimatedText deps={[i18n.language]}>
                              {t('userManager.admin')}
                            </AnimatedText>
                          </span>
                        ) : (
                          <span className={styles.visitorRole}>👤 
                            <AnimatedText deps={[i18n.language]}>
                              {t('userManager.visitor')}
                            </AnimatedText>
                          </span>
                        )}
                      </div>
                      <div className={styles.userDate}>
                        📅 
                        <AnimatedText deps={[i18n.language]}>
                          {t('userManager.registeredOn', { date: formatDate(user.createdAt) })}
                        </AnimatedText>
                      </div>
                    </div>
                    <div className={styles.userActions}>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.username, user.email)}
                        disabled={deleteLoading[user._id]}
                        className={styles.deleteUserBtn}
                        title={t('userManager.deleteUser')}
                      >
                        {deleteLoading[user._id] ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManager; 
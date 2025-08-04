import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import styles from './LogManager.module.css';

const LogManager = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50
      });
      
      if (selectedDate) params.append('date', selectedDate);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedActionType) params.append('actionType', selectedActionType);

      const token = localStorage.getItem('segarow_token');

      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé. Veuillez vous reconnecter.');
      }

      const response = await fetch(`/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          throw new Error('Token invalide ou expiré. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
          throw new Error('Accès refusé. Droits administrateur requis.');
        } else {
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      
      setLogs(data.logs || []);
      setStats(data.stats || {});
      setAvailableDates(data.availableDates || []);
    } catch (error) {
      toast.error(error.message || t('admin.logs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedDate, selectedLevel, selectedActionType, t]);

  // Charger les logs au montage du composant
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const downloadLogs = async (date = null, format = 'json') => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({ format });
      if (date) params.append('date', date);

      const response = await fetch(`/api/admin/logs/download?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('segarow_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      // Créer un blob et télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = date ? `segarow-logs-${date}.${format}` : `segarow-logs-all.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('admin.logs.downloadSuccess'));
    } catch (error) {
      toast.error(t('admin.logs.downloadError'));
    } finally {
      setDownloading(false);
    }
  };



  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          📋 {t('admin.logs.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📋 {t('admin.logs.title')}</h2>
        <p>{t('admin.logs.description')}</p>
      </div>

      {/* Statistiques */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>📊 {t('admin.logs.totalLogs')}</h3>
          <p>{stats.totalLogs || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>💾 {t('admin.logs.totalSize')}</h3>
          <p>{stats.totalSizeMB || '0.00'} MB</p>
        </div>
        <div className={styles.statCard}>
          <h3>📅 {t('admin.logs.oldestLog')}</h3>
          <p>{stats.oldestLog ? formatDate(stats.oldestLog) : t('admin.logs.none')}</p>
        </div>
        <div className={styles.statCard}>
          <h3>🕒 {t('admin.logs.newestLog')}</h3>
          <p>{stats.newestLog ? formatDate(stats.newestLog) : t('admin.logs.none')}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <select 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Toutes les dates</option>
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
        
        <select 
          value={selectedLevel} 
          onChange={(e) => setSelectedLevel(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tous les niveaux</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>
        
        <select 
          value={selectedActionType} 
          onChange={(e) => setSelectedActionType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tous les types</option>
          <option value="admin_action">Actions admin</option>
          <option value="account_deletion">Suppressions de comptes</option>
          <option value="cleanup">Nettoyages</option>
          <option value="system_error">Erreurs système</option>
          <option value="user_action">Actions utilisateur</option>
        </select>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.downloadBtn}
          onClick={() => downloadLogs(selectedDate, 'json')}
          disabled={downloading}
        >
          {downloading ? '⏳' : '⬇️'} {t('admin.logs.download')} JSON
        </button>
        <button
          className={styles.downloadBtn}
          onClick={() => downloadLogs(selectedDate, 'csv')}
          disabled={downloading}
        >
          {downloading ? '⏳' : '⬇️'} {t('admin.logs.download')} CSV
        </button>

        <button
          className={styles.refreshBtn}
          onClick={loadLogs}
          disabled={loading}
        >
          🔄 {t('admin.logs.refresh')}
        </button>
      </div>

      {/* Liste des logs */}
      <div className={styles.logsList}>
        <h3>📄 {t('admin.logs.availableLogs')}</h3>
        
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            📭 {t('admin.logs.noLogs')}
          </div>
        ) : (
          <div className={styles.logsTable}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Niveau</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Utilisateur</th>
                  <th>Données</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className={styles.logRow}>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>
                      <span className={`${styles.logLevel} ${styles[log.level.toLowerCase()]}`}>
                        {log.level}
                      </span>
                    </td>
                    <td>{log.message}</td>
                    <td>{log.actionType}</td>
                    <td>{log.userEmail || log.userId?.email || 'N/A'}</td>
                    <td>
                      {log.data ? (
                        <details>
                          <summary>Voir</summary>
                          <pre>{JSON.stringify(log.data, null, 2)}</pre>
                        </details>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informations */}
      <div className={styles.info}>
        <h3>ℹ️ {t('admin.logs.info.title')}</h3>
        <ul>
          <li>{t('admin.logs.info.rotation')}</li>
          <li>{t('admin.logs.info.retention')}</li>
          <li>{t('admin.logs.info.format')}</li>
        </ul>
      </div>
    </div>
  );
};

export default LogManager; 
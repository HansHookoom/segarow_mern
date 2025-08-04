import React, { useState, useEffect } from 'react';
import LikeService from '../../../services/LikeService';
import ApiService from '../../../services/ApiService';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './LikesManager.module.css';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const LikesManager = ({ selectedContent: initialSelectedContent, onClearSelection }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentLikes, setContentLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSelectedContent) {
      // Si on a un contenu sélectionné depuis l'extérieur, charger ses likes directement
      loadContentLikes(
        initialSelectedContent.type, 
        initialSelectedContent.id, 
        initialSelectedContent.title
      );
    } else {
      loadStats();
    }
  }, [initialSelectedContent]);

  useEffect(() => {
    if (!initialSelectedContent) {
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await LikeService.getLikesStats();
      setStats(response);
    } catch (err) {
      setError(t('likesManager.statsError', { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const loadContentLikes = async (contentType, contentId, contentTitle) => {
    try {
      setLoading(true);
      setError('');
      const response = await LikeService.getContentLikes(contentType, contentId);
      setContentLikes(response.likes);
      setSelectedContent({ 
        type: contentType, 
        id: contentId, 
        title: contentTitle,
        likeCount: response.likeCount 
      });
    } catch (err) {
      setError(t('likesManager.likesError', { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const fixAllLikesIssues = async () => {
    if (!window.confirm(t('likesManager.fixConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let report = t('likesManager.repairReportStart') + '\n\n';
      
      // 1. DIAGNOSTIC
      report += t('likesManager.diagnosticStep') + '\n';
      const diagnostic = await ApiService.get('/api/likes/admin/diagnostic', true);

      report += t('likesManager.realData', { total: diagnostic.realCounts.total }) + '\n';
      report += t('likesManager.storedCounters', { total: diagnostic.storedCounts.total }) + '\n';
      report += t('likesManager.inconsistencies', { total: diagnostic.inconsistencies.totalInconsistent }) + '\n';
      report += t('likesManager.orphanedLikes', { total: diagnostic.orphanedLikes }) + '\n';
      report += t('likesManager.deletedContentLikes', { total: diagnostic.deletedContentLikes }) + '\n';
      report += t('likesManager.totalProblematicLikes', { total: diagnostic.totalProblematicLikes }) + '\n\n';

      // 2. NETTOYAGE DES LIKES PROBLÉMATIQUES (si nécessaire)
      let cleanupResult = null;
      if (diagnostic.totalProblematicLikes > 0) {
        report += t('likesManager.cleanupStep') + '\n';
        
        cleanupResult = await ApiService.post('/api/likes/admin/cleanup-orphaned-likes', {}, true);
        report += t('likesManager.cleanedLikes', { cleaned: cleanupResult.cleaned }) + '\n';
        if (cleanupResult.orphanedUsers > 0) {
          report += `   - Likes orphelins (utilisateurs supprimés) : ${cleanupResult.orphanedUsers}\n`;
        }
        if (cleanupResult.deletedContent > 0) {
          report += `   - Likes avec contenus supprimés : ${cleanupResult.deletedContent}\n`;
        }
        report += '\n';
      } else {
        report += t('likesManager.noOrphanedLikes') + '\n\n';
      }

      // 3. SYNCHRONISATION
      let syncResult = null;
      if (diagnostic.summary.needsSync || cleanupResult) {
        report += t('likesManager.syncStep') + '\n';
        
        syncResult = await ApiService.post('/api/likes/admin/sync-counters', {}, true);
        report += t('likesManager.fixedCounters', { total: syncResult.fixed.total }) + '\n';
        report += t('likesManager.fixedArticles', { articles: syncResult.fixed.articles }) + '\n';
        report += t('likesManager.fixedReviews', { reviews: syncResult.fixed.reviews }) + '\n';
        report += t('likesManager.fixedComments', { comments: syncResult.fixed.comments }) + '\n\n';
      } else {
        report += t('likesManager.allCountersSynced') + '\n\n';
      }

      // 4. RÉSUMÉ FINAL
      report += t('likesManager.repairFinished') + '\n\n';
      
      const totalActions = (cleanupResult?.cleaned || 0) + (syncResult?.fixed.total || 0);
      if (totalActions === 0) {
        report += t('likesManager.nothingToFix');
        toast.success(t('likesManager.nothingToFix'));
      } else {
        report += t('likesManager.fixedProblems', { total: totalActions });
        toast.success(t('likesManager.fixedProblems', { total: totalActions }));
      }

      alert(report);
      await loadStats();
      
    } catch (err) {
      toast.error(t('likesManager.fixError', { message: err.message }));
      setError(t('likesManager.fixError', { message: err.message }));
    } finally {
      setLoading(false);
    }
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

  if (loading && !stats) {
    return <div className={styles.loading}>
      <AnimatedText deps={[i18n.language]}>
        {t('likesManager.loadingStats')}
      </AnimatedText>
    </div>;
  }

  if (error && !stats) {
    return <div className={styles.error}>❌ 
      <AnimatedText deps={[i18n.language]}>
        {error}
      </AnimatedText>
    </div>;
  }

  if (selectedContent) {
    return (
      <div className={styles.likesManager}>
        <div className={styles.header}>
          <button 
            onClick={() => {
              setSelectedContent(null);
              if (onClearSelection) onClearSelection();
            }}
            className={styles.backBtn}
          >
            ← 
            <AnimatedText deps={[i18n.language]}>
              {t('likesManager.backToStats')}
            </AnimatedText>
          </button>
          <h2>
            <AnimatedText deps={[i18n.language]}>
              {t('likesManager.likesFor', { title: selectedContent.title })}
            </AnimatedText>
          </h2>
          <p>
            {selectedContent.likeCount} 
            <AnimatedText deps={[i18n.language]}>
              &nbsp;{selectedContent.likeCount <= 1 ? t('likesManager.like') : t('likesManager.likes')}
            </AnimatedText> 
            <AnimatedText deps={[i18n.language]}>
              &nbsp;{t('likesManager.total')}
            </AnimatedText>
          </p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <AnimatedText deps={[i18n.language]}>
              {t('likesManager.loading')}
            </AnimatedText>
          </div>
        ) : contentLikes.length === 0 ? (
          <div className={styles.emptyState}>
            <AnimatedText deps={[i18n.language]}>
              {t('likesManager.noLikesForContent')}
            </AnimatedText>
          </div>
        ) : (
          <div className={styles.likesList}>
            {contentLikes.map((like) => (
              <div key={like.id} className={styles.likeItem}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>👤 {like.user.username}</div>
                  <div className={styles.userEmail}>{like.user.email}</div>
                </div>
                <div className={styles.likeDate}>
                  ❤️ {formatDate(like.likedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.likesManager}>
      <div className={styles.header}>
        <h2>📊 
          <AnimatedText deps={[i18n.language]}>
            {t('likesManager.title')}
          </AnimatedText>
        </h2>
        <button onClick={loadStats} className={styles.refreshBtn}>
          🔄 
          <AnimatedText deps={[i18n.language]}>
            {t('likesManager.refresh')}
          </AnimatedText>
        </button>
      </div>

      {error && <div className={styles.error}>❌ 
        <AnimatedText deps={[i18n.language]}>
          {error}
        </AnimatedText>
      </div>}

      {stats && (
        <>
          {/* Statistiques globales */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.stats.totalLikes}</div>
              <div className={styles.statLabel}>
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.totalLikes')}
                </AnimatedText>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.stats.totalArticleLikes}</div>
              <div className={styles.statLabel}>
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.articleLikes')}
                </AnimatedText>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.stats.totalReviewLikes}</div>
              <div className={styles.statLabel}>
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.reviewLikes')}
                </AnimatedText>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.stats.totalCommentLikes}</div>
              <div className={styles.statLabel}>
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.commentLikes')}
                </AnimatedText>
              </div>
            </div>
          </div>

          {/* Outils de maintenance */}
          <div className={styles.toolsSection}>
            <h3>🔧 
              <AnimatedText deps={[i18n.language]}>
                {t('likesManager.maintenanceTools')}
              </AnimatedText>
            </h3>
            <div className={styles.toolsGrid}>
              <button 
                onClick={fixAllLikesIssues}
                disabled={loading}
                className={styles.diagnosticBtn}
              >
                🔧 
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.fixAll')}
                </AnimatedText>
              </button>
            </div>
            <p className={styles.toolsDescription}>
              <strong>
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.fixTitle')}
                </AnimatedText>
              </strong> 
              <AnimatedText deps={[i18n.language]}>
                {t('likesManager.fixDesc')}
              </AnimatedText>
            </p>
          </div>

          {/* Top contenus */}
          <div className={styles.topContent}>
            <div className={styles.section}>
              <h3>🏆 
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.topArticles')}
                </AnimatedText>
              </h3>
              {stats.topContent.articles.length === 0 ? (
                <p>
                  <AnimatedText deps={[i18n.language]}>
                    Aucun article liké pour le moment.
                  </AnimatedText>
                </p>
              ) : (
                <div className={styles.contentList}>
                  {stats.topContent.articles.map((article) => (
                    <div key={article._id} className={styles.contentItem}>
                      <div className={styles.contentInfo}>
                        <div className={styles.contentTitle}>{article.title}</div>
                        <div className={styles.contentAuthor}>
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.byAuthor', { author: article.author?.username || article.author?.email || t('likesManager.unknownUser') })}
                          </AnimatedText>
                        </div>
                      </div>
                      <div className={styles.contentLikes}>
                        <span className={styles.likeCount}>❤️ {article.likeCount}</span>
                        <button
                          onClick={() => loadContentLikes('article', article._id, article.title)}
                          className={styles.viewBtn}
                        >
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.view')}
                          </AnimatedText>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3>🏆 
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.topReviews')}
                </AnimatedText>
              </h3>
              {stats.topContent.reviews.length === 0 ? (
                <p>
                  <AnimatedText deps={[i18n.language]}>
                    Aucune review likée pour le moment.
                  </AnimatedText>
                </p>
              ) : (
                <div className={styles.contentList}>
                  {stats.topContent.reviews.map((review) => (
                    <div key={review._id} className={styles.contentItem}>
                      <div className={styles.contentInfo}>
                        <div className={styles.contentTitle}>
                          {review.gameTitle || review.title}
                        </div>
                        <div className={styles.contentAuthor}>
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.byAuthor', { author: review.author?.username || review.author?.email || t('likesManager.unknownUser') })}
                          </AnimatedText>
                        </div>
                      </div>
                      <div className={styles.contentLikes}>
                        <span className={styles.likeCount}>❤️ {review.likeCount}</span>
                        <button
                          onClick={() => loadContentLikes('review', review._id, review.gameTitle || review.title)}
                          className={styles.viewBtn}
                        >
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.view')}
                          </AnimatedText>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3>🏆 
                <AnimatedText deps={[i18n.language]}>
                  {t('likesManager.topComments')}
                </AnimatedText>
              </h3>
              {!stats.topContent.comments || stats.topContent.comments.length === 0 ? (
                <p>
                  <AnimatedText deps={[i18n.language]}>
                    Aucun commentaire liké pour le moment.
                  </AnimatedText>
                </p>
              ) : (
                <div className={styles.contentList}>
                  {stats.topContent.comments.map((comment) => (
                    <div key={comment._id} className={styles.contentItem}>
                      <div className={styles.contentInfo}>
                        <div className={styles.contentTitle}>
                          {comment.content?.substring(0, 60)}...
                        </div>
                        <div className={styles.contentAuthor}>
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.byAuthor', { author: comment.author?.username || comment.author?.email || t('likesManager.unknownUser') })} sur "{comment.article?.title}"
                          </AnimatedText>
                        </div>
                      </div>
                      <div className={styles.contentLikes}>
                        <span className={styles.likeCount}>❤️ {comment.likesCount}</span>
                        <button
                          onClick={() => loadContentLikes('comment', comment._id, 'Commentaire')}
                          className={styles.viewBtn}
                        >
                          <AnimatedText deps={[i18n.language]}>
                            {t('likesManager.view')}
                          </AnimatedText>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top utilisateurs */}
          <div className={styles.section}>
            <h3>🏆 
              <AnimatedText deps={[i18n.language]}>
                {t('likesManager.topLikers')}
              </AnimatedText>
            </h3>
            {stats.topLikers.length === 0 ? (
              <p>
                <AnimatedText deps={[i18n.language]}>
                  Aucune activité de like pour le moment.
                </AnimatedText>
              </p>
            ) : (
              <div className={styles.usersList}>
                {stats.topLikers.map((user) => (
                  <div key={user._id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>👤 {user.username}</div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                    <div className={styles.userLikes}>
                      ❤️ {user.likesCount} 
                      <AnimatedText deps={[i18n.language]}>
                        {user.likesCount <= 1 ? 'like' : 'likes'}
                      </AnimatedText>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LikesManager; 
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import ArticleService from '../../../services/ArticleService';
import ReviewService from '../../../services/ReviewService';
import AdminPostForm from '../AdminPostForm/AdminPostForm';
import AdminPostList from '../AdminPostList/AdminPostList';
import ImageManager from '../ImageManager/ImageManager';
import LikesManager from '../LikesManager/LikesManager';
import UserManager from '../UserManager/UserManager';
import LogManager from '../LogManager/LogManager';
import Pagination from '../../../components/ui/Pagination/Pagination';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './AdminDashboard.module.css';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('articles');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [articles, setArticles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContentForLikes, setSelectedContentForLikes] = useState(null);
  
  // États pour la pagination
  const [currentArticlePage, setCurrentArticlePage] = useState(1);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [articlesPagination, setArticlesPagination] = useState({ total: 1, totalArticles: 0 });
  const [reviewsPagination, setReviewsPagination] = useState({ total: 1, totalReviews: 0 });
  const itemsPerPage = 5; // 5 éléments par page dans l'admin (cohérent avec le front)

  const { t, i18n } = useTranslation();

  // Rediriger si pas admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/';
      return;
    }
  }, [isAdmin]);

  // Charger les données
  useEffect(() => {
    if (!['images', 'likes', 'users', 'logs'].includes(activeTab)) {
      loadData();
    }
    // Réinitialiser la sélection de contenu pour les likes quand on change d'onglet
    if (activeTab !== 'likes') {
      setSelectedContentForLikes(null);
    }
  }, [activeTab, currentArticlePage, currentReviewPage]);

  // Charger les compteurs de tous les onglets au démarrage
  useEffect(() => {
    loadAllCounters();
  }, []);

  // Fonction pour charger seulement les compteurs (sans les données complètes)
  const loadAllCounters = async () => {
    try {
      // Charger le compteur d'articles (page 1, 1 élément suffit pour avoir le total)
      const articlesResponse = await ArticleService.getArticles(1, 1);
      setArticlesPagination(prev => ({
        ...prev,
        totalArticles: articlesResponse.pagination?.totalArticles || 0
      }));

      // Charger le compteur de reviews (page 1, 1 élément suffit pour avoir le total)
      const reviewsResponse = await ReviewService.getReviews(1, 1);
      setReviewsPagination(prev => ({
        ...prev,
        totalReviews: reviewsResponse.pagination?.totalReviews || 0
      }));
    } catch (err) {
      // Erreur lors du chargement des compteurs
    }
  };

  // Réinitialiser les pages à 1 quand on change d'onglet
  useEffect(() => {
    setCurrentArticlePage(1);
    setCurrentReviewPage(1);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (activeTab === 'articles') {
        const response = await ArticleService.getArticles(currentArticlePage, itemsPerPage);
        setArticles(response.articles || []);
        setArticlesPagination(prev => ({
          total: response.pagination?.total || 1,
          totalArticles: response.pagination?.totalArticles || prev.totalArticles || 0
        }));
      } else if (activeTab === 'reviews') {
        const response = await ReviewService.getReviews(currentReviewPage, itemsPerPage);
        setReviews(response.reviews || []);
        setReviewsPagination(prev => ({
          total: response.pagination?.total || 1,
          totalReviews: response.pagination?.totalReviews || prev.totalReviews || 0
        }));
      }
    } catch (err) {
      setError(`Erreur lors du chargement des ${activeTab}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (activeTab === 'articles') {
      setCurrentArticlePage(page);
    } else if (activeTab === 'reviews') {
      setCurrentReviewPage(page);
    }
    // Scroll vers le haut pour une meilleure UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (post) => {
    if (post._action === 'viewLikes') {
      // Rediriger vers l'onglet likes avec les infos du post
      const contentType = activeTab === 'articles' ? 'article' : 'review';
      const contentTitle = post.gameTitle || post.title;
      setSelectedContentForLikes({
        type: contentType,
        id: post._id,
        title: contentTitle
      });
      setActiveTab('likes');
    } else {
      setEditingPost(post);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('adminPostList.deleteConfirm'))) {
      return;
    }

    try {
      if (activeTab === 'articles') {
        await ArticleService.deleteArticle(id);
        toast.success(t('adminPostList.articleDeleted'));
      } else {
        await ReviewService.deleteReview(id);
        toast.success(t('adminPostList.reviewDeleted'));
      }
      
      loadData(); // Recharger les données
      loadAllCounters(); // Recharger les compteurs pour tous les onglets
    } catch (err) {
      toast.error(t('adminPostList.deleteError', { message: err.message }));
      setError(t('adminPostList.deleteError', { message: err.message }));
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingPost) {
        // Modification
        if (activeTab === 'articles') {
          await ArticleService.updateArticle(editingPost._id, formData);
          toast.success(t('adminPostList.articleUpdated'));
        } else {
          await ReviewService.updateReview(editingPost._id, formData);
          toast.success(t('adminPostList.reviewUpdated'));
        }
      } else {
        // Création - revenir à la page 1 pour voir le nouvel élément
        if (activeTab === 'articles') {
          await ArticleService.createArticle(formData);
          setCurrentArticlePage(1);
          toast.success(t('adminPostList.articleCreated'));
        } else {
          await ReviewService.createReview(formData);
          setCurrentReviewPage(1);
          toast.success(t('adminPostList.reviewCreated'));
        }
      }

      setShowForm(false);
      setEditingPost(null);
      loadData(); // Recharger les données
      loadAllCounters(); // Recharger les compteurs pour tous les onglets
    } catch (err) {
      toast.error(t('adminPostList.saveError', { message: err.message }));
      throw new Error(t('adminPostList.saveError', { message: err.message }));
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  if (!isAdmin) {
    return <div>
      <AnimatedText deps={[i18n.language]}>
        {t('admin.accessDenied')}
      </AnimatedText>
    </div>;
  }

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <h1>
          🔧 <AnimatedText deps={[i18n.language]}>{t('admin.title')}</AnimatedText>
        </h1>
        <p>
          <AnimatedText deps={[i18n.language]}>
            {t('admin.welcome', { user: user?.username || user?.email })}
          </AnimatedText>
        </p>
      </div>

      {error && (
        <div className={styles.error}>
          ❌ <AnimatedText deps={[i18n.language]}>{error}</AnimatedText>
        </div>
      )}

      {!showForm ? (
        <>
          {/* Onglets */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'articles' ? styles.active : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              📰 <AnimatedText deps={[i18n.language]}>{t('admin.tabs.articles', { count: articlesPagination.totalArticles })}</AnimatedText>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.active : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ⭐ <AnimatedText deps={[i18n.language]}>{t('admin.tabs.reviews', { count: reviewsPagination.totalReviews })}</AnimatedText>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'images' ? styles.active : ''}`}
              onClick={() => setActiveTab('images')}
            >
              🖼️ <AnimatedText deps={[i18n.language]}>{t('admin.tabs.images')}</AnimatedText>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'likes' ? styles.active : ''}`}
              onClick={() => setActiveTab('likes')}
            >
              ❤️ <AnimatedText deps={[i18n.language]}>{t('admin.tabs.likes')}</AnimatedText>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 <AnimatedText deps={[i18n.language]}>{t('admin.tabs.users')}</AnimatedText>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              📋 <AnimatedText deps={[i18n.language]}>{t('admin.tabs.logs')}</AnimatedText>
            </button>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'images' ? (
            <ImageManager onClose={() => setActiveTab('articles')} />
          ) : activeTab === 'likes' ? (
            <LikesManager 
              selectedContent={selectedContentForLikes}
              onClearSelection={() => setSelectedContentForLikes(null)}
            />
          ) : activeTab === 'users' ? (
            <UserManager />
          ) : activeTab === 'logs' ? (
            <LogManager />
          ) : (
            <>
              {/* Bouton créer */}
              <div className={styles.actions}>
                <button
                  className={styles.createBtn}
                  onClick={handleCreateNew}
                >
                  ➕ <AnimatedText deps={[i18n.language]}>
                    {activeTab === 'articles' ? t('admin.createArticle') : t('admin.createReview')}
                  </AnimatedText>
                </button>
              </div>

              {/* Liste des posts */}
              {loading ? (
                <div className={styles.loading}>
                  <AnimatedText deps={[i18n.language]}>{t('admin.loading')}</AnimatedText>
                </div>
              ) : (
                <>
                  <AdminPostList
                    posts={activeTab === 'articles' ? articles : reviews}
                    type={activeTab}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pagination={activeTab === 'articles' ? articlesPagination : reviewsPagination}
                    currentPage={activeTab === 'articles' ? currentArticlePage : currentReviewPage}
                    itemsPerPage={itemsPerPage}
                  />
                  
                  {/* Pagination */}
                  {((activeTab === 'articles' && articlesPagination.total > 1) || 
                    (activeTab === 'reviews' && reviewsPagination.total > 1)) && (
                    <div className={styles.paginationContainer}>
                      <Pagination 
                        currentPage={activeTab === 'articles' ? currentArticlePage : currentReviewPage}
                        totalPages={activeTab === 'articles' ? articlesPagination.total : reviewsPagination.total}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <AdminPostForm
          type={activeTab}
          initialData={editingPost}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 
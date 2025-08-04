import React from 'react';
import ReviewService from '../../../services/ReviewService';
import ImageService from '../../../services/ImageService';
import AssetService from '../../../services/AssetService';
import ImageWithSkeleton from '../../../components/ui/ImageWithSkeleton/ImageWithSkeleton';
import ConsoleLogo from '../../../components/ui/ConsoleLogo/ConsoleLogo';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import styles from './AdminPostList.module.css';
import { useTranslation } from 'react-i18next';

const AdminPostList = ({ posts, type, onEdit, onDelete, pagination, currentPage, itemsPerPage }) => {
  const { t, i18n } = useTranslation();

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          {type === 'articles' ? '📰' : '⭐'}
        </div>
        <h3>
          <AnimatedText deps={[i18n.language]}>
            {type === 'articles' ? t('adminPostList.noArticle') : t('adminPostList.noReview')}
          </AnimatedText>
        </h3>
        <p>
          <AnimatedText deps={[i18n.language]}>
            {type === 'articles' ? t('adminPostList.createFirstArticle') : t('adminPostList.createFirstReview')}
          </AnimatedText>
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const lang = i18n.language || 'fr';
    return date.toLocaleDateString(lang, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' ' + (lang === 'fr' ? 'à' : 'at') + ' ' + date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return AssetService.getDefaultArticleFallback();
    return ImageService.getImageUrl(imageUrl);
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return '#4CAF50'; // Vert
    if (rating >= 6) return '#FF9800'; // Orange
    if (rating >= 4) return '#FFC107'; // Jaune
    return '#F44336'; // Rouge
  };

  return (
    <div className={styles.postList}>
      <div className={styles.listHeader}>
        <h3>
          <AnimatedText deps={[i18n.language]}>
            {type === 'articles' ? '📰 ' + t('adminPostList.articles') : '⭐ ' + t('adminPostList.reviews')}
          </AnimatedText>
        </h3>
        {pagination && (
          <div className={styles.paginationInfo}>
            <AnimatedText deps={[i18n.language]}>
              {t('adminPostList.pageInfo', {
                current: currentPage,
                total: pagination.total,
                from: ((currentPage - 1) * itemsPerPage) + 1,
                to: Math.min(currentPage * itemsPerPage, pagination.totalArticles || pagination.totalReviews),
                totalItems: pagination.totalArticles || pagination.totalReviews,
                type: type === 'articles' ? t('adminPostList.articles') : t('adminPostList.reviews')
              })}
            </AnimatedText>
          </div>
        )}
      </div>

      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div key={post._id} className={styles.postCard}>
            {/* Wrapper pour contenu + actions (desktop layout) */}
            <div className={styles.postCardContent}>
              {/* Contenu */}
              <div className={styles.postContent}>
              <div className={styles.postHeader}>
                <h4 className={styles.postTitle}>{post.title}</h4>
                {type === 'reviews' && post.rating && (
                  <div className={styles.rating}>
                    <div 
                      className={styles.ratingScore}
                      style={{ color: getRatingColor(post.rating) }}
                    >
                      {post.rating}/10
                    </div>
                    <div className={styles.ratingStars}>
                      {getRatingStars(post.rating)}
                    </div>
                  </div>
                )}
              </div>

              {/* Méta-données spécifiques */}
              {type === 'reviews' && (
                <div className={styles.reviewMeta}>
                  {post.genre && (
                    <span className={styles.gameGenre}>🎮 <AnimatedText deps={[i18n.language]}>{t('genres.' + post.genre)}</AnimatedText></span>
                  )}
                  {post.platform && (
                    <span className={styles.platform}>
                      <ConsoleLogo 
                        platform={post.platform} 
                        size="small" 
                        className={styles.platformLogo}
                      />
                    </span>
                  )}
                </div>
              )}

              <p className={styles.postExcerpt}>
                {truncateText(post.excerpt, 120)}
              </p>

              <div className={styles.postMeta}>
                <span className={styles.author}>
                  👤 {post.author?.username || post.author?.email || 
                    <AnimatedText deps={[i18n.language]}>
                      {t('adminPostList.unknownAuthor')}
                    </AnimatedText>
                  }
                </span>
                <span className={styles.date}>
                  📅 {formatDate(post.createdAt)}
                </span>
                <span className={styles.likes}>
                  ❤️ {post.likeCount || 0} 
                  <AnimatedText deps={[i18n.language]}>
                    {(post.likeCount || 0) <= 1 ? t('adminPostList.like') : t('adminPostList.likes')}
                  </AnimatedText>
                </span>
                {post.updatedAt !== post.createdAt && (
                  <span className={styles.updated}>
                    ✏️ 
                    <AnimatedText deps={[i18n.language]}>
                      {t('adminPostList.updatedOn', { date: formatDate(post.updatedAt) })}
                    </AnimatedText>
                  </span>
                )}
              </div>

                            <div className={styles.postSlug}>
                🔗 /{post.slug}
              </div>
              </div>

              {/* Actions */}
              <div className={styles.postActions}>
                <button
                  onClick={() => {
                    const path = type === 'articles' ? `/news/${post.slug}` : `/reviews/${post.slug}`;
                    window.open(path, '_blank');
                  }}
                  className={styles.viewBtn}
                  title={type === 'articles' ? t('adminPostList.viewArticle') : t('adminPostList.viewReview')}
                >
                  👁️ 
                  <AnimatedText deps={[i18n.language]}>
                    {type === 'articles' ? t('adminPostList.viewArticle') : t('adminPostList.viewReview')}
                  </AnimatedText>
                </button>
                <button
                  onClick={() => onEdit(post)}
                  className={styles.editBtn}
                  title={t('adminPostList.edit')}
                >
                  ✏️ 
                  <AnimatedText deps={[i18n.language]}>
                    {t('adminPostList.edit')}
                  </AnimatedText>
                </button>
                <button
                  onClick={() => onDelete(post._id)}
                  className={styles.deleteBtn}
                  title={t('adminPostList.delete')}
                >
                  🗑️ 
                  <AnimatedText deps={[i18n.language]}>
                    {t('adminPostList.delete')}
                  </AnimatedText>
                </button>
                {(post.likeCount || 0) > 0 && (
                  <button
                    onClick={() => onEdit && onEdit({ ...post, _action: 'viewLikes' })}
                    className={styles.likesBtn}
                    title={t('adminPostList.viewLikes')}
                  >
                    👥 
                    <AnimatedText deps={[i18n.language]}>
                      {t('adminPostList.likes')}
                    </AnimatedText>
                  </button>
                )}
              </div>
            </div>

            {/* Image */}
            <div className={styles.postImage}>
              <ImageWithSkeleton
                src={getImageSrc(post.image)}
                alt={post.title}
                fallbackSrc={AssetService.getDefaultArticleFallback()}
                skeletonHeight="100%"
                className={styles.postImageContent}
                skeletonProps={{ className: 'slow' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPostList; 
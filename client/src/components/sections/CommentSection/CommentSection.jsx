import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import ApiService from '../../../services/ApiService';
import Comment from '../Comment/Comment';
import styles from './CommentSection.module.css';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../../ui/AnimatedText/AnimatedText';
import toast from 'react-hot-toast';

const CommentSection = ({ contentId, contentType }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // État pour le tri
  const [sortBy, setSortBy] = useState('recent'); // 'recent' ou 'likes'
  
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const loadComments = async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const endpoint = contentType === 'article' 
        ? `/api/comments/news/${contentId}?page=${page}&limit=5&sortBy=${sortBy}`
        : `/api/comments/review/${contentId}?page=${page}&limit=5&sortBy=${sortBy}`;
      
      const response = await ApiService.get(endpoint, true); // Envoyer l'auth si disponible
      
      if (append) {
        // Lors du chargement de commentaires supplémentaires, on ajoute tous les commentaires
        // et on laisse la fonction organizeCommentsForDisplay s'occuper de la hiérarchie
        setComments(prev => {
          // Créer une liste de tous les commentaires (anciens + nouveaux) sans doublons
          const allComments = [...prev, ...response.comments];
          const uniqueComments = allComments.filter((comment, index, self) => 
            index === self.findIndex(c => c._id === comment._id)
          );
          return uniqueComments;
        });
      } else {
        setComments(response.comments);
      }
      
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalComments(response.pagination.totalComments);
      setHasNextPage(response.pagination.hasNextPage);
      
    } catch (error) {
      toast.error(t('comments.loadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreComments = () => {
    if (hasNextPage && !loadingMore) {
      loadComments(currentPage + 1, true);
    }
  };

  useEffect(() => {
    loadComments();
  }, [contentId, contentType]);

  // Recharger les commentaires quand le tri change
  useEffect(() => {
    setCurrentPage(1);
    loadComments(1, false);
  }, [sortBy]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error(t('comments.loginPrompt'));
      return;
    }

    if (!newComment.trim()) {
      toast.error(t('comments.emptyComment'));
      return;
    }

    setSubmitting(true);
    
    try {
      const commentData = {
        content: newComment,
        [contentType === 'article' ? 'articleId' : 'reviewId']: contentId
      };
      
      await ApiService.post('/api/comments', commentData, true);
      setNewComment('');
      toast.success(t('comments.added'));
      // Recharger tous les commentaires
      setCurrentPage(1);
      loadComments(1, false);
    } catch (error) {
      toast.error(t('comments.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId, content) => {
    if (!content.trim()) {
      toast.error(t('comments.emptyReply'));
      return;
    }

    setSubmitting(true);
    
    try {
      const replyData = {
        content: content,
        [contentType === 'article' ? 'articleId' : 'reviewId']: contentId,
        parentCommentId: commentId
      };
      
      await ApiService.post('/api/comments', replyData, true);
      toast.success(t('comments.replyAdded'));
      // Recharger tous les commentaires
      setCurrentPage(1);
      loadComments(1, false);
    } catch (error) {
      toast.error(t('comments.replyAddError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      await ApiService.delete(`/api/comments/${commentId}`, true);
      toast.success(t('comments.deleted'));
      // Recharger tous les commentaires
      setCurrentPage(1);
      loadComments(1, false);
    } catch (error) {
      toast.error(t('comments.deleteError'));
    }
  };

  const handleForceDeleteComment = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce commentaire ?\n\nCette action est irréversible.')) {
      return;
    }

    try {
      await ApiService.delete(`/api/comments/${commentId}/force`, true);
      toast.success(t('comments.forceDeleted'));
      // Recharger tous les commentaires
      setCurrentPage(1);
      loadComments(1, false);
    } catch (error) {
      toast.error(t('comments.forceDeleteError'));
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error(t('comments.loginPrompt'));
      return;
    }

    try {
      // Utiliser la route toggle qui gère automatiquement like/unlike
      await ApiService.post(`/api/likes/comment/${commentId}`, {}, true);
      
      // Recharger tous les commentaires pour mettre à jour les likes
      setCurrentPage(1);
      loadComments(1, false);
    } catch (error) {
      toast.error(t('comments.likeError'));
    }
  };

  // Fonction pour organiser les commentaires en hiérarchie
  const organizeCommentsForDisplay = (comments) => {
    const commentMap = new Map();
    const rootComments = [];

    // Créer un map de tous les commentaires
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] });
    });

    // Organiser en hiérarchie
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment._id);
      
      if (comment.parentComment) {
        // C'est une réponse
        const parent = commentMap.get(comment.parentComment._id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        // C'est un commentaire racine
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  // Fonction récursive pour afficher les commentaires avec leurs réponses
  const renderCommentWithReplies = (comment) => {
    return (
      <div key={comment._id} className={styles.commentTree}>
        <Comment
          comment={comment}
          onDelete={handleDeleteComment}
          onForceDelete={handleForceDeleteComment}
          onLike={handleLikeComment}
          onReply={handleSubmitReply}
          currentUser={user}
        />
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.repliesContainer}>
            {comment.replies.map(reply => renderCommentWithReplies(reply))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>{t('comments.loading')}</div>;
  }

  // Calculer la profondeur correcte de chaque commentaire
  const calculateCommentDepth = (comment, allComments, depth = 0) => {
    if (!comment.parentComment) {
      return 0; // Commentaire principal
    }
    
    // Trouver le commentaire parent dans la liste complète
    const parent = allComments.find(c => c._id === comment.parentComment._id);
    if (!parent) {
      return 1; // Parent non trouvé, considérer comme niveau 1
    }
    
    // Calculer récursivement la profondeur
    return calculateCommentDepth(parent, allComments, depth + 1) + 1;
  };

  const commentsWithDepth = comments.map(comment => ({
    ...comment,
    replyDepth: calculateCommentDepth(comment, comments)
  }));

  // Organiser les commentaires en hiérarchie
  const organizedComments = organizeCommentsForDisplay(commentsWithDepth);

  return (
    <div className={styles.commentSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.title}>
          <AnimatedText deps={[t, totalComments]}>{t('comments.title', { count: totalComments })}</AnimatedText>
        </h3>
        
        <div className={styles.sortContainer}>
          <label htmlFor="comment-sort" className={styles.sortLabel}>
            <AnimatedText deps={[t]}>{t('comments.sortBy')}</AnimatedText>
          </label>
          <select 
            id="comment-sort"
            name="sortBy"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="recent">{t('comments.mostRecent')}</option>
            <option value="likes">{t('comments.mostLiked')}</option>
          </select>
        </div>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <label htmlFor="main-comment" className={styles.commentLabel}>
            <AnimatedText deps={[t]}>{t('comments.addComment')}</AnimatedText>
          </label>
          <textarea
            id="main-comment"
            name="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.placeholder')}
            className={styles.commentInput}
            disabled={submitting}
            rows={3}
            maxLength={1000}
          />
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting || !newComment.trim()}
          >
            <AnimatedText deps={[t, submitting]}>
              {submitting ? t('comments.publishing') : t('comments.publish')}
            </AnimatedText>
          </button>
        </form>
      )}

      {!isAuthenticated && (
        <p className={styles.loginPrompt}>
          <AnimatedText deps={[t]}>{t('comments.loginPrompt')}</AnimatedText>
        </p>
      )}

      <div className={styles.commentsList}>
        {organizedComments.map((comment) => renderCommentWithReplies(comment))}
      </div>

      {hasNextPage && (
        <div className={styles.loadMoreContainer}>
          <button
            onClick={loadMoreComments}
            className={styles.loadMoreBtn}
            disabled={loadingMore}
          >
            <AnimatedText deps={[t, loadingMore, totalComments, comments.length]}>
              {loadingMore ? t('comments.loading') : t('comments.loadMore', { count: totalComments - comments.length })}
            </AnimatedText>
          </button>
        </div>
      )}

      {comments.length === 0 && (
        <p className={styles.noComments}>
          <AnimatedText deps={[t]}>{t('comments.none')}</AnimatedText>
        </p>
      )}
    </div>
  );
};

export default CommentSection; 
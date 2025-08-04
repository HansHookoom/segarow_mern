import React, { useState } from 'react';
import styles from './Comment.module.css';

const Comment = ({ comment, onReply, onDelete, onForceDelete, onLike, currentUser }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Gérer l'ajout d'une réponse
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      await onReply(comment._id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      // Erreur ajout réponse
    } finally {
      setSubmittingReply(false);
    }
  };

  // Gérer la suppression
  const handleDelete = () => {
    const confirmDelete = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?\n\n' +
      (comment.replies?.length > 0 
        ? 'Ce commentaire a des réponses. Il sera remplacé par "Commentaire supprimé" mais les réponses seront conservées.'
        : 'Ce commentaire sera supprimé définitivement.')
    );

    if (confirmDelete) {
      onDelete(comment._id);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isDeleted = comment.isDeleted;
  const isCurrentUserComment = currentUser && comment.author?._id === currentUser.id;
  const canDelete = currentUser && (isCurrentUserComment || currentUser.role === 'admin');

  const isReply = comment.parentComment;
  const replyDepth = comment.replyDepth || 0;

  return (
    <div 
      className={`${styles.commentContainer} ${isReply ? styles.replyComment : ''}`}
    >
      <div className={styles.comment}>
        {/* En-tête du commentaire */}
        <div className={styles.commentHeader}>
          <div className={styles.authorInfo}>
            {isReply && (
              <span className={styles.replyIndicator}>
                ↳ En réponse à {comment.parentComment?.isDeleted ? 'un commentaire supprimé' : (comment.parentComment?.author?.username || 'un utilisateur')}
              </span>
            )}
            <span className={styles.authorName}>
              {isDeleted ? (
                <span className={styles.deletedUser}>👻 Utilisateur supprimé</span>
              ) : (
                <>
                  {comment.author?.role === 'admin' ? '🔧' : '👤'} {comment.author?.username}
                </>
              )}
            </span>
            <span className={styles.timestamp}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          {canDelete && !isDeleted && (
            <button
              onClick={handleDelete}
              className={styles.deleteBtn}
              title="Supprimer le commentaire"
            >
              🗑️
            </button>
          )}
          
          {canDelete && isDeleted && (
            <button
              onClick={() => onForceDelete(comment._id)}
              className={styles.forceDeleteBtn}
              title="Supprimer définitivement ce commentaire"
            >
              💀
            </button>
          )}
        </div>

        {/* Contenu du commentaire */}
        <div className={styles.commentContent}>
          {isDeleted ? (
            <span className={styles.deletedContent}>
              <em>Commentaire supprimé</em>
            </span>
          ) : (
            <p>{comment.content}</p>
          )}
        </div>

        {/* Actions du commentaire */}
        {!isDeleted && (
          <div className={styles.commentActions}>
            <button
              onClick={() => onLike(comment._id)}
              className={`${styles.likeBtn} ${comment.isLiked ? styles.liked : ''}`}
              disabled={!currentUser}
              title={currentUser ? 'Liker ce commentaire' : 'Connectez-vous pour liker'}
            >
              {comment.isLiked ? '❤️' : '🤍'} {comment.likesCount || 0}
            </button>

            {currentUser && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className={styles.replyBtn}
              >
                💬 Répondre
              </button>
            )}
          </div>
        )}

        {/* Formulaire de réponse */}
        {showReplyForm && currentUser && (
          <form onSubmit={handleSubmitReply} className={styles.replyForm}>
            <div className={styles.replyHeader}>
              <span className={styles.replyingTo}>
                Réponse à {comment.author?.username} :
              </span>
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className={styles.replyInput}
              rows={2}
              maxLength={1000}
              disabled={submittingReply}
            />
            <div className={styles.replyActions}>
              <span className={styles.charCount}>
                {replyContent.length}/1000
              </span>
              <div className={styles.replyButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className={styles.cancelBtn}
                  disabled={submittingReply}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className={styles.submitReplyBtn}
                >
                  {submittingReply ? '📤 Envoi...' : '📤 Répondre'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Comment; 
import React from 'react';
import styles from './ErrorState.module.css';

const ErrorState = ({
  type = 'error', // 'error' ou 'loading'
  title,
  message,
  emoji = '❌',
  buttonText,
  onRetry,
  className = '',
  children,
}) => {
  return (
    <div className={[
      type === 'error' ? styles.errorState : styles.loadingState,
      className
    ].join(' ')}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={type === 'error' ? styles.emojiError : styles.emojiNews}>
        {emoji}
      </div>
      {message && <p className={styles.message}>{message}</p>}
      {children}
      {buttonText && onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default ErrorState; 
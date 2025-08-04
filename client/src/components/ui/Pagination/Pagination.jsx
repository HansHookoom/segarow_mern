import React from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../AnimatedText/AnimatedText';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t, i18n } = useTranslation();

  if (totalPages <= 1) return null;

  const handlePageChange = (page, event) => {
    // Empêcher la propagation des événements pour éviter les conflits
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Logique pour afficher les numéros de page
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajuster startPage si on est proche de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Toujours afficher la première page
    if (startPage > 1) {
      pages.push(
        <li key={1}>
          <button
            onClick={(e) => handlePageChange(1, e)}
            className={1 === currentPage ? styles.current : ''}
          >
            1
          </button>
        </li>
      );
      
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis-start">
            <span className={styles.ellipsis}>...</span>
          </li>
        );
      }
    }

    // Pages du milieu
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i}>
          <button
            onClick={(e) => handlePageChange(i, e)}
            className={i === currentPage ? styles.current : ''}
          >
            {i}
          </button>
        </li>
      );
    }

    // Toujours afficher la dernière page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis-end">
            <span className={styles.ellipsis}>...</span>
          </li>
        );
      }
      
      pages.push(
        <li key={totalPages}>
          <button
            onClick={(e) => handlePageChange(totalPages, e)}
            className={totalPages === currentPage ? styles.current : ''}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    return pages;
  };

  return (
    <div className={styles.pagination}>
      <ul>
        {/* Bouton Précédent */}
        {currentPage > 1 && (
          <li>
            <button 
              onClick={(e) => handlePageChange(currentPage - 1, e)}
              className={`${styles.prev}`}
            >
              <AnimatedText deps={[i18n.language]}>
                {t('pagination.previous')}
              </AnimatedText>
            </button>
          </li>
        )}
        
        {/* Numéros de page */}
        {renderPageNumbers()}
        
        {/* Bouton Suivant */}
        {currentPage < totalPages && (
          <li>
            <button 
              onClick={(e) => handlePageChange(currentPage + 1, e)}
              className={`${styles.next}`}
            >
              <AnimatedText deps={[i18n.language]}>
                {t('pagination.next')}
              </AnimatedText>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Pagination; 
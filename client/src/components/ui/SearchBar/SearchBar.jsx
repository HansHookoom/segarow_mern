import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedText from '../AnimatedText/AnimatedText';
import styles from './SearchBar.module.css';

const SearchBar = ({ onSearch, placeholder, className = '' }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.searchBar} ${className}`}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          id="search-input"
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder || t('search.placeholder')}
          className={styles.searchInput}
          aria-label={t('search.ariaLabel')}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label={t('search.clear')}
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className={styles.searchButton} aria-label={t('search.submit')}>
        <AnimatedText deps={[i18n.language]}>
          {t('search.submit')}
        </AnimatedText>
      </button>
    </form>
  );
};

export default SearchBar; 
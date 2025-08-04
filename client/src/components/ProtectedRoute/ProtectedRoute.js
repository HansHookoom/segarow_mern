// src/components/ProtectedRoute.js - NOUVELLE VERSION
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './ProtectedRoute.module.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div>Vérification des permissions...</div>
      </div>
    );
  }

  // Si authentification requise mais pas connecté
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si admin requis mais pas admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className={styles.accessDeniedContainer}>
        <h2 className={styles.accessDeniedTitle}>❌ Accès refusé</h2>
        <p className={styles.accessDeniedText}>Vous devez être administrateur pour accéder à cette page.</p>
        <button 
          onClick={() => window.history.back()}
          className={styles.backButton}
        >
          Retour
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import useInactivityTimeout from './hooks/useInactivityTimeout';
import useServerStatus from './hooks/useServerStatus';
import Header from './components/common/Header/Header';
import Footer from './components/common/Footer/Footer';
import NetworkStatus from './components/common/NetworkStatus/NetworkStatus';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import Reviews from './pages/Reviews/Reviews';
import Video from './pages/Video/Video';
import SingleContent from './pages/SingleContent/SingleContent';
import Profile from './pages/Profile/Profile';
import AboutUs from './pages/AboutUs/AboutUs';
import LegalNotice from './pages/LegalNotice/LegalNotice';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import AdminDashboard from './components/admin/AdminDashboard/AdminDashboard';
import GlobalStyles from './styles/GlobalStyles';
import NotFound from './pages/NotFound/NotFound';
import styles from './App.module.css';
import { ThemeProvider } from './context/ThemeContext';
import './styles/Emojis.css';
import './styles/ToastStyles.css';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Composant pour gérer la redirection de la route racine
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingIcon}>🌀</div>
          <div>Chargement de Segarow...</div>
        </div>
      </div>
    );
  }
  
  // Redirection vers home par défaut (accessible même connecté)
  return <Navigate to="/home" replace />;
};

// Composant principal des routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  // Activer le timeout d'inactivité de 15 minutes pour tous les utilisateurs connectés
  useInactivityTimeout(15, t);
  
  // Vérifier le statut des serveurs et rediriger si nécessaire
  useServerStatus();

  return (
    <div className="App">
      {/* Header affiché partout */}
      <Header />
      
      {/* Indicateur de statut réseau */}
      <NetworkStatus />
      
      <Routes>
        {/* Route racine avec logique d'authentification */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Pages publiques */}
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Login />
        } />
        <Route path="/forgot-password" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <ForgotPassword />
        } />
        <Route path="/reset-password" element={
          isAuthenticated ? <Navigate to="/home" replace /> : <ResetPassword />
        } />
        
        {/* Pages de contenu */}
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<SingleContent />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/:slug" element={<SingleContent />} />
        <Route path="/videos" element={<Video />} />
        <Route path="/about" element={<AboutUs />} />
        
        {/* Pages légales */}
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="/conditions-generales" element={<PrivacyPolicy />} />
        
        {/* Pages protégées */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Page d'administration (Admin seulement) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Route 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Footer affiché partout */}
      <Footer />
    </div>
  );
};

// App principal
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <GlobalStyles />
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'toast-base',
              success: {
                className: 'toast-success',
                iconTheme: {
                  primary: 'white',
                  secondary: '#4CAF50',
                },
              },
              error: {
                className: 'toast-error',
                iconTheme: {
                  primary: 'white',
                  secondary: '#f44336',
                },
              },
              warning: {
                className: 'toast-warning',
                iconTheme: {
                  primary: 'white',
                  secondary: '#ff9800',
                },
              },
              info: {
                className: 'toast-info',
                iconTheme: {
                  primary: 'white',
                  secondary: '#2196F3',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 
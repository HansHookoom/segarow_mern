import React from 'react';
import { validateExternalUrl, sanitizeExternalUrl } from '../../../utils/security';

const SecureExternalLink = ({ 
  href, 
  children, 
  className = '', 
  target = '_blank', 
  rel = 'noopener noreferrer',
  fallback = null,
  ...props 
}) => {
  // Valider l'URL
  if (!validateExternalUrl(href)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('URL externe non autorisée:', href);
    }
    return fallback || <span className={className} {...props}>{children}</span>;
  }

  // Nettoyer l'URL
  const sanitizedUrl = sanitizeExternalUrl(href);
  if (!sanitizedUrl) {
    return fallback || <span className={className} {...props}>{children}</span>;
  }

  return (
    <a 
      href={sanitizedUrl}
      target={target}
      rel={rel}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
};

export default SecureExternalLink; 
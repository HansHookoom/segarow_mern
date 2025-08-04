import React, { useState } from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './ImageWithSkeleton.css';

const ImageWithSkeleton = ({ 
  src, 
  alt, 
  className = '',
  style = {},
  onError,
  fallbackSrc,
  skeletonHeight = '200px',
  skeletonProps = {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = (e) => {
    setIsLoading(false);
    setHasError(true);
    
    if (fallbackSrc && e.target.src !== fallbackSrc) {
      e.target.src = fallbackSrc;
      setHasError(false);
      setIsLoading(true);
    }
    
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`image-with-skeleton ${className}`} style={style}>
      {isLoading && (
        <SkeletonLoader 
          height={skeletonHeight}
          className="image-skeleton"
          {...skeletonProps}
        />
      )}
      
      <img
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        className={`skeleton-image ${isLoading ? 'loading' : 'loaded'}`}
      />
    </div>
  );
};

export default ImageWithSkeleton; 
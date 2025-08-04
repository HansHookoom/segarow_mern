import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ 
  width = '100%', 
  height = '200px', 
  borderRadius = '8px',
  className = '' 
}) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    >
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export default SkeletonLoader; 
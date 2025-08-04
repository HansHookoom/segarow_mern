import React from 'react';

const YouTubeIframe = ({ videoId, title, width = '100%', height = '100%', ...props }) => {
  if (!videoId) {
    return (
      <div style={{
        width,
        height,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px'
      }}>
        <div>Vidéo non disponible</div>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
      title={title || `YouTube video ${videoId}`}
      width={width}
      height={height}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{
        borderRadius: '8px',
        border: 'none'
      }}
      {...props}
    />
  );
};

export default YouTubeIframe; 
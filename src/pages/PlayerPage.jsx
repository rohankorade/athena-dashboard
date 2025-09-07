// src/pages/PlayerPage.jsx

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PlayerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const videoUrl = searchParams.get('url');
  const videoTitle = searchParams.get('title');

  // A fallback if the URL is missing
  if (!videoUrl) {
    return (
      <div className="player-page-container">
        <div className="player-error-message">
          <h1>Error: Video URL not found.</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page-container">
      <header className="player-header">
        <h1 className="player-title">{videoTitle}</h1>
      </header>
      
      <main className="player-video-wrapper">
        <div className="player-video-container">
          <iframe
            src={videoUrl}
            title={videoTitle}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen"
          ></iframe>
        </div>
      </main>
    </div>
  );
}

export default PlayerPage;
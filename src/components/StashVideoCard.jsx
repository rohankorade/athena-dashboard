// src/components/StashVideoCard.jsx

import React from 'react';

// Helper function to clean up the title for display
const formatTitle = (title) => {
  if (!title) return 'Untitled';
  return title
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/-1080p|-720p|-SD/i, '') // Remove quality tags
    .replace(/-/g, ' ') // Replace remaining hyphens
    .trim();
};

function StashVideoCard({ video }) {
  const handlePlay = () => {
    window.open(video.fileLink, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(video.fileLink)
      .then(() => {
        // Optional: Show a temporary success message
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
      });
  };

  return (
    <div className="stash-video-card">
      <div className="stash-card-main">
        <h4 className="stash-video-title">{formatTitle(video.title)}</h4>
        <p className="stash-video-filename">{video.fileName}</p>
        <div className="stash-metadata-pills">
          <span className="pill-item">{video.fileSize}</span>
          <span className="pill-item">{video.videoType}</span>
          <span className="pill-item">{video.collection}</span>
        </div>
      </div>
      <div className="stash-card-actions">
        <button onClick={handleCopy} className="button-modern-gray small-button">Copy Link</button>
        <button onClick={handlePlay} className="button-modern-blue small-button">Play</button>
      </div>
    </div>
  );
}

export default StashVideoCard;
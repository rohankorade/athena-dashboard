// src/components/StashVideoCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthenticatedImage from '../hooks/useAuthenticatedImage';
import Highlight from './Highlight'; // Import the new component

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const [day, month, year] = dateString.split('-');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

// A small component to handle the authenticated image loading
const AuthenticatedImage = ({ src, ...props }) => {
  const apiUrl = src ? `/api/stash/image?url=${encodeURIComponent(src)}` : null;
  const { imageSrc, loading, error } = useAuthenticatedImage(apiUrl);

  if (loading) {
    // You can return a placeholder or spinner here
    return <div className="image-placeholder" style={{ aspectRatio: '16/9', backgroundColor: '#333' }}></div>;
  }

  if (error) {
    // You can return an error indicator here
    return <div className="image-placeholder" style={{ aspectRatio: '16/9', backgroundColor: '#333' }}>Error</div>;
  }

  return imageSrc ? <img src={imageSrc} {...props} /> : <div className="image-placeholder" style={{ aspectRatio: '16/9', backgroundColor: '#333' }}></div>;
};


function StashVideoCard({ video, searchTerm }) { // Accept searchTerm prop
  const navigate = useNavigate();

  const handlePlay = () => {
    if (video.file_video_type === 'MP4' && video.file_link.includes('/file/')) {
      const embedUrl = video.file_link.replace('/file/', '/embed/');
      const playerUrl = `/player?url=${encodeURIComponent(embedUrl)}&title=${encodeURIComponent(video.scene_title)}`;
      window.open(playerUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(video.file_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(video.file_link)
      .then(() => alert('Link copied!'))
      .catch(err => console.error('Failed to copy: ', err));
  };
  
  const handleSource = () => {
    window.open(video.scene_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="stash-card">
      <div className="stash-card-visual">
        <AuthenticatedImage
          src={video.scene_cover}
          alt={video.scene_title} 
          loading="lazy" 
          className="stash-card-thumbnail"
        />
        {video.scene_preview && (
          <AuthenticatedImage
            src={video.scene_preview}
            alt="Scene preview"
            className="stash-card-preview"
          />
        )}
      </div>
      <div className="stash-card-info">
        <h3 className="stash-card-title" title={video.scene_title}>
          <Highlight text={video.scene_title} search={searchTerm} />
        </h3>
        <p className="stash-card-performers">
          <Highlight 
            text={Array.isArray(video.scene_performers) ? video.scene_performers.join(', ') : video.scene_performers} 
            search={searchTerm} 
          />
        </p>
        <div className="stash-card-metadata">
          <span>🗓️ {formatDate(video.scene_date)}</span>
          <span>💾 {video.file_size}</span>
          <span className="collection-tag">{video.collection}</span>
        </div>
      </div>
      <div className="stash-card-actions">
        <div className="action-group-left">
          <button title="View Source" onClick={handleSource}>🔗</button>
          <button title="Copy Link" onClick={handleCopy}>📋</button>
        </div>
        <button className="play-button" onClick={handlePlay}>▶ Play</button>
      </div>
    </div>
  );
}

export default StashVideoCard;
// src/components/StashVideoCard.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthenticatedImage from '../hooks/useAuthenticatedImage';
import Highlight from './Highlight';

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

const AuthenticatedImage = ({ src, showPlaceholder = false, ...props }) => {
  const apiUrl = src ? `/api/stash/image?url=${encodeURIComponent(src)}` : null;
  const { imageSrc, loading, error, isCorrupt } = useAuthenticatedImage(apiUrl);

  if (isCorrupt) {
    return null;
  }
  if (loading) {
    return showPlaceholder ? <div className="image-placeholder"></div> : null;
  }
  if (error) {
    return showPlaceholder ? <div className="image-placeholder">Error</div> : null;
  }
  return imageSrc ? <img src={imageSrc} {...props} /> : null;
};

function StashVideoCard({ video, searchTerm }) {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  // --- NEW: Handler for clicking a performer's name ---
  const handlePerformerClick = (performerName) => {
    const trimmedName = performerName.trim();
    if (trimmedName) {
      navigate(`/utilities/stash/search/${encodeURIComponent(trimmedName)}/page/1`);
    }
  };

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
    <div
      className="stash-card"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="stash-card-visual">
        <AuthenticatedImage
          src={video.scene_cover}
          alt={video.scene_title}
          loading="lazy"
          className="stash-card-thumbnail"
          showPlaceholder={true}
        />
        {video.scene_preview && isHovering && (
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
        {/* --- MODIFIED: This block now renders clickable performer names --- */}
        <p className="stash-card-performers">
          {(video.scene_performers || []).map((name, index, arr) => (
            <React.Fragment key={name}>
              <button className="performer-link" onClick={() => handlePerformerClick(name)}>
                <Highlight text={name} search={searchTerm} />
              </button>
              {index < arr.length - 1 && ', '}
            </React.Fragment>
          ))}
        </p>
        <div className="stash-card-metadata">
          <span>🗓️ {formatDate(video.scene_date)}</span>
          <span>💾 {video.file_size}</span>
          <span className="collection-tag">{video.collectionName}</span>
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
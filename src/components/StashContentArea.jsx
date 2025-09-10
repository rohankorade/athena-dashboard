// src/components/StashContentArea.jsx

import React from 'react';
import StashVideoCard from './StashVideoCard';
import PaginationControls from './PaginationControls';

// --- NEW: Helper to format bytes ---
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function StashContentArea({ view, data, isLoading, collectionName, searchTerm, cacheStats, onCacheStatsClick, sortOrder, onSortChange }) {

  const renderContent = () => {
    if (isLoading) {
      return <p className="loading-message">Loading...</p>;
    }

    if (view === 'dashboard' && data.stats) {
      return (
        <div className="dashboard-view-content">
          <div className="stats-grid">
              <div className="stat-item">
                  <span className="stat-value">{data.stats.totalVideos}</span>
                  <span className="stat-label">Videos</span>
              </div>
              <div className="stat-item">
                  <span className="stat-value">{data.stats.totalCollections}</span>
                  <span className="stat-label">Collections</span>
              </div>
              <div className="stat-item clickable" onClick={onCacheStatsClick}>
                  <span className="stat-value">{formatBytes(cacheStats?.totalSize || 0)}</span>
                  <span className="stat-label">Cache Size</span>
              </div>
          </div>
          <h2>Recently Added</h2>
          <div className="video-grid">
            {data.recent.map(video => <StashVideoCard key={video._id} video={video} searchTerm={searchTerm} />)}
          </div>
        </div>
      );
    }
    
    if (data.videos && data.videos.length > 0) {
      return (
        <div className="collection-view-wrapper">
          <div className="video-grid">
            {data.videos.map(video => <StashVideoCard key={video._id} video={video} searchTerm={searchTerm} />)}
          </div>
          <PaginationControls 
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            collectionName={collectionName}
            view={view}
            searchTerm={searchTerm}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>
      );
    }

    if (view === 'search') {
        return <p className="loading-message">No results found for "{searchTerm}".</p>;
    }

    return <p className="loading-message">No videos found in this collection.</p>;
  };

  return (
    <main className="stash-content-area">
      {renderContent()}
    </main>
  );
}

export default StashContentArea;
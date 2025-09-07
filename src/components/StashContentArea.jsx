// src/components/StashContentArea.jsx

import React from 'react';
import StashVideoCard from './StashVideoCard';
import PaginationControls from './PaginationControls';

// The collectionName prop is added here
function StashContentArea({ view, data, isLoading, collectionName }) {

  const renderContent = () => {
    if (isLoading) {
      return <p className="loading-message">Loading...</p>;
    }

    if (view === 'dashboard' && data.stats) {
      return (
        // ... (dashboard view remains the same)
        <div className="dashboard-view-content">
          <div className="stats-grid">
              <div className="stat-item">
                  <span className="stat-value">{data.stats.totalVideos}</span>
                  <span className="stat-label">Total Videos</span>
              </div>
              <div className="stat-item">
                  <span className="stat-value">{data.stats.totalCollections}</span>
                  <span className="stat-label">Total Collections</span>
              </div>
          </div>
          <h2>Recently Added</h2>
          <div className="video-grid">
            {data.recent.map(video => <StashVideoCard key={video._id} video={video} />)}
          </div>
        </div>
      );
    }
    
    if (data.videos && data.videos.length > 0) {
      return (
        <div className="collection-view-wrapper">
          <div className="video-grid">
            {data.videos.map(video => <StashVideoCard key={video._id} video={video} />)}
          </div>
          <PaginationControls 
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            collectionName={collectionName} // Pass the collectionName down
          />
        </div>
      );
    }

    return <p className="loading-message">No videos found.</p>;
  };

  return (
    <main className="stash-content-area">
      {renderContent()}
    </main>
  );
}

export default StashContentArea;
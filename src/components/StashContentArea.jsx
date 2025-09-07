// src/components/StashContentArea.jsx

import React from 'react';
import StashVideoCard from './StashVideoCard';
import PaginationControls from './PaginationControls';

function StashContentArea({ view, data, isLoading, onPageChange }) {

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
    
    // The collection view now returns a Fragment, making the grid and pagination
    // direct children of the main container.
    if (data.videos && data.videos.length > 0) {
      return (
        <div className="collection-view-wrapper">
          <div className="video-grid">
            {data.videos.map(video => <StashVideoCard key={video._id} video={video} />)}
          </div>
          <PaginationControls 
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            onPageChange={onPageChange}
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
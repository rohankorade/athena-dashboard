// src/pages/utilities/StashCollectionPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StashVideoCard from '../../components/StashVideoCard';

function StashCollectionPage() {
  const { collectionName } = useParams();
  const [data, setData] = useState({ videos: [], currentPage: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/stash/collections/${collectionName}?page=${page}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error(`Failed to fetch videos for ${collectionName}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [collectionName, page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/utilities/stash" className="button button-secondary" style={{float: 'right'}}>
            &larr; Back to Collections
        </Link>
        <h1>{collectionName.replace(/_/g, ' ')}</h1>
        <p>Page {data.currentPage} of {data.totalPages}</p>
      </div>

      <div className="page-content" style={{ flexDirection: 'column', overflowY: 'auto', padding: '1rem' }}>
        {isLoading ? (
          <p>Loading videos...</p>
        ) : (
          data.videos.map(video => <StashVideoCard key={video._id} video={video} />)
        )}
        
        <div className="pagination-controls">
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                Previous Page
            </button>
            <span>Page {data.currentPage}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>
                Next Page
            </button>
        </div>
      </div>
    </div>
  );
}

export default StashCollectionPage;
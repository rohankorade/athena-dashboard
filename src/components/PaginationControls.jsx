// src/components/PaginationControls.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function PaginationControls({ currentPage, totalPages, collectionName, view, searchTerm }) {
  if (totalPages <= 1) {
    return null;
  }

  let prevPagePath, nextPagePath;

  // Create different links based on whether we are searching or browsing a collection
  if (view === 'search') {
    // FIX: Encode the searchTerm to handle spaces and special characters correctly
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    prevPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/${currentPage - 1}`;
    nextPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/${currentPage + 1}`;
  } else {
    prevPagePath = `/utilities/stash/${collectionName}/page/${currentPage - 1}`;
    nextPagePath = `/utilities/stash/${collectionName}/page/${currentPage + 1}`;
  }


  return (
    <div className="pagination-controls">
      {currentPage > 1 ? (
        <Link to={prevPagePath} className="button-modern-gray">
          &larr; Previous Page
        </Link>
      ) : (
        <button disabled className="button-modern-gray">&larr; Previous Page</button>
      )}
      
      <span>
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link to={nextPagePath} className="button-modern-gray">
          Next Page &rarr;
        </Link>
      ) : (
        <button disabled className="button-modern-gray">Next Page &rarr;</button>
      )}
    </div>
  );
}

export default PaginationControls;
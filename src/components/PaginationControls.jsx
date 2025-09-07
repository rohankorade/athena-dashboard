// src/components/PaginationControls.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function PaginationControls({ currentPage, totalPages, collectionName, view, searchTerm }) {
  if (totalPages <= 1) {
    return null;
  }

  // --- NEW: Generate all four navigation paths ---
  let firstPagePath, prevPagePath, nextPagePath, lastPagePath;

  if (view === 'search') {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    firstPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/1`;
    prevPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/${currentPage - 1}`;
    nextPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/${currentPage + 1}`;
    lastPagePath = `/utilities/stash/search/${encodedSearchTerm}/page/${totalPages}`;
  } else {
    firstPagePath = `/utilities/stash/${collectionName}/page/1`;
    prevPagePath = `/utilities/stash/${collectionName}/page/${currentPage - 1}`;
    nextPagePath = `/utilities/stash/${collectionName}/page/${currentPage + 1}`;
    lastPagePath = `/utilities/stash/${collectionName}/page/${totalPages}`;
  }

  // --- NEW: Simplified conditions for disabling buttons ---
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="pagination-controls">
      {/* First Page Button */}
      {canGoBack ? (
        <Link to={firstPagePath} className="button-modern-gray" title="First Page">
          &laquo;
        </Link>
      ) : (
        <button disabled className="button-modern-gray">&laquo;</button>
      )}

      {/* Previous Page Button */}
      {canGoBack ? (
        <Link to={prevPagePath} className="button-modern-gray">
          &larr; Previous
        </Link>
      ) : (
        <button disabled className="button-modern-gray">&larr; Previous</button>
      )}
      
      <span>
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Page Button */}
      {canGoForward ? (
        <Link to={nextPagePath} className="button-modern-gray">
          Next &rarr;
        </Link>
      ) : (
        <button disabled className="button-modern-gray">Next &rarr;</button>
      )}

      {/* Last Page Button */}
      {canGoForward ? (
        <Link to={lastPagePath} className="button-modern-gray" title="Last Page">
          &raquo;
        </Link>
      ) : (
        <button disabled className="button-modern-gray">&raquo;</button>
      )}
    </div>
  );
}

export default PaginationControls;
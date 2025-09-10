// src/components/PaginationControls.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function PaginationControls({ currentPage, totalPages, collectionName, view, searchTerm, sortOrder, onSortChange }) {
  const [pageInput, setPageInput] = useState(currentPage);
  const navigate = useNavigate();

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  if (totalPages <= 1) {
    return null;
  }

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      let newPath;
      if (view === 'search') {
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        newPath = `/utilities/stash/search/${encodedSearchTerm}/page/${pageNum}`;
      } else {
        newPath = `/utilities/stash/${collectionName}/page/${pageNum}`;
      }
      navigate(newPath);
    } else {
      // If input is invalid, reset it to the current page
      setPageInput(currentPage);
    }
  };

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

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <div className="pagination-controls">
      <div className="sort-controls">
        <button
          onClick={() => onSortChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="button-modern-gray"
          title={`Sort: ${sortOrder === 'asc' ? 'Oldest to Newest' : 'Newest to Oldest'}`}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      <div className="page-navigation">
        {canGoBack ? (
          <Link to={firstPagePath} className="button-modern-gray" title="First Page">&laquo;</Link>
        ) : (
          <button disabled className="button-modern-gray">&laquo;</button>
        )}

        {canGoBack ? (
          <Link to={prevPagePath} className="button-modern-gray" title="Previous Page">&larr;</Link>
        ) : (
          <button disabled className="button-modern-gray">&larr;</button>
        )}

        <form onSubmit={handlePageInputSubmit} className="page-input-form">
          <input
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            className="page-input"
            aria-label={`Page ${currentPage} of ${totalPages}`}
          />
          <span>/ {totalPages}</span>
        </form>

        {canGoForward ? (
          <Link to={nextPagePath} className="button-modern-gray" title="Next Page">&rarr;</Link>
        ) : (
          <button disabled className="button-modern-gray">&rarr;</button>
        )}

        {canGoForward ? (
          <Link to={lastPagePath} className="button-modern-gray" title="Last Page">&raquo;</Link>
        ) : (
          <button disabled className="button-modern-gray">&raquo;</button>
        )}
      </div>
    </div>
  );
}

export default PaginationControls;
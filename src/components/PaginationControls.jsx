// src/components/PaginationControls.jsx

import React from 'react';

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null; // Don't show controls if there's only one page
  }

  return (
    <div className="pagination-controls">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage <= 1}
        className="button-modern-gray"
      >
        &larr; Previous Page
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage >= totalPages}
        className="button-modern-gray"
      >
        Next Page &rarr;
      </button>
    </div>
  );
}

export default PaginationControls;
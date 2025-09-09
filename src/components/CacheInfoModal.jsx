// src/components/CacheInfoModal.jsx

import React from 'react';
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '450px',
  },
};

Modal.setAppElement('#root');

// Helper to format bytes into KB, MB, etc.
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function CacheInfoModal({ isOpen, onRequestClose, cacheStats }) {
  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to delete all cached images? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/stash/clear-cache', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          alert('Cache cleared successfully!');
          window.location.reload(); // Refresh the page
        } else {
          alert('Failed to clear cache.');
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('An error occurred while clearing the cache.');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Cache Information">
      <h2>Cache Information</h2>
      <div className="cache-stats-details">
        <h4>Breakdown by File Type:</h4>
        {cacheStats && Object.keys(cacheStats.breakdown).length > 0 ? (
          <ul>
            {Object.entries(cacheStats.breakdown).map(([ext, size]) => (
              <li key={ext}>
                <span>{ext.toUpperCase()} Files:</span>
                <span>{formatBytes(size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>The cache is currently empty.</p>
        )}
        <hr />
        <p className="total-size">
          <strong>Total Size:</strong>
          <strong>{formatBytes(cacheStats?.totalSize || 0)}</strong>
        </p>
      </div>
      <div className="modal-actions">
        <button onClick={onRequestClose} className="button button-secondary">Close</button>
        <button onClick={handleClearCache} className="button-modern-pink">Clear Cache</button>
      </div>
    </Modal>
  );
}

export default CacheInfoModal;
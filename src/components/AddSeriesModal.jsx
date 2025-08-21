// src/components/AddSeriesModal.jsx

import React, { useState } from 'react';
import Modal from 'react-modal';

// Basic styling for the modal
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
  },
};

// Bind modal to your app element (for accessibility)
Modal.setAppElement('#root');

function AddSeriesModal({ isOpen, onRequestClose, onSeriesAdded }) {
  const [seriesName, setSeriesName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seriesName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: seriesName }),
      });

      if (response.ok) {
        setSeriesName(''); // Clear input on success
        onSeriesAdded();
        onRequestClose();
      } else { console.error('Failed to add series'); }
    } catch (error) { console.error('Error:', error); }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Add New Test Series">
      <h2>Add New Test Series</h2>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="seriesName">Series Name</label>
          <input
            id="seriesName" type="text" value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder="e.g., Vision IAS Prelims 2026"
            autoFocus required
          />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onRequestClose} className="button button-secondary">Cancel</button>
          <button type="submit" className="button button-primary">Save Series</button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSeriesModal;
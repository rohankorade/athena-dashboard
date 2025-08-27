// src/components/ExplanationModal.jsx

import React from 'react';
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '60%', maxWidth: '800px', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column',
  },
};

Modal.setAppElement('#root');

function ExplanationModal({ isOpen, onRequestClose, explanation }) {
  const isImage = explanation && /\.(jpeg|jpg|gif|png)$/.test(explanation);
  const API_BASE = `http://${window.location.hostname}:5000`; // Define the base URL for your server

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Explanation Modal">
      <h2>Explanation</h2>
      <div className="explanation-content" style={{ flexGrow: 1, overflowY: 'auto' }}>
        {explanation ? (
          isImage ? (
            // --- MODIFIED LINE ---
            <img src={`${API_BASE}/${explanation}`} alt="Explanation" style={{ width: '100%', height: 'auto' }} />
          ) : (
            <p>{explanation}</p>
          )
        ) : (
          <p>No explanation is available for this question.</p>
        )}
      </div>
      <div className="modal-actions" style={{ marginTop: '1rem' }}>
        <button onClick={onRequestClose} className="button button-primary">Close</button>
      </div>
    </Modal>
  );
}

export default ExplanationModal;
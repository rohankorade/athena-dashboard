import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    backgroundColor: '#2a2a2a', // Dark theme for modal
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '8px',
    padding: '20px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

Modal.setAppElement('#root');

function SettingsModal({ isOpen, onRequestClose, currentSettings, onSettingsSave }) {
  const [localSettings, setLocalSettings] = useState(currentSettings);

  // Sync local state when the modal opens with new props
  useEffect(() => {
    setLocalSettings(currentSettings);
  }, [currentSettings, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put('/api/pomodoro/settings', localSettings)
      .then(res => {
        onSettingsSave(res.data); // Update parent state
        onRequestClose(); // Close modal
      })
      .catch(err => console.error("Error saving settings:", err));
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Pomodoro Settings">
      <h2>Timer Settings</h2>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="workMinutes">Work (minutes)</label>
          <input id="workMinutes" name="workMinutes" type="number" value={localSettings.workMinutes} onChange={handleChange} min="1" required />
        </div>
        <div className="form-group">
          <label htmlFor="shortBreakMinutes">Short Break (minutes)</label>
          <input id="shortBreakMinutes" name="shortBreakMinutes" type="number" value={localSettings.shortBreakMinutes} onChange={handleChange} min="1" required />
        </div>
        <div className="form-group">
          <label htmlFor="longBreakMinutes">Long Break (minutes)</label>
          <input id="longBreakMinutes" name="longBreakMinutes" type="number" value={localSettings.longBreakMinutes} onChange={handleChange} min="1" required />
        </div>
        <div className="form-group">
          <label htmlFor="sessionsPerLongBreak">Sessions per Long Break</label>
          <input id="sessionsPerLongBreak" name="sessionsPerLongBreak" type="number" value={localSettings.sessionsPerLongBreak} onChange={handleChange} min="1" required />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onRequestClose} className="button button-secondary">Cancel</button>
          <button type="submit" className="button button-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default SettingsModal;

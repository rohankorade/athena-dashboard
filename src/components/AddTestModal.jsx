// src/components/AddTestModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '450px', borderRadius: '8px',
  },
};
Modal.setAppElement('#root');

function AddTestModal({ isOpen, onRequestClose, onTestAdded, seriesList, selectedSeries }) {
  // State for all form fields
  const [testNumber, setTestNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split('T')[0]);
  const [questionsCorrect, setQuestionsCorrect] = useState('');
  const [questionsIncorrect, setQuestionsIncorrect] = useState('');
  const [marksScored, setMarksScored] = useState('');
  const [currentSeries, setCurrentSeries] = useState(selectedSeries);

  // Auto-calculated fields
  const [attempted, setAttempted] = useState(0);
  const totalQuestions = 100;

  // Update calculated fields whenever correct/incorrect counts change
  useEffect(() => {
    const correct = parseInt(questionsCorrect, 10) || 0;
    const incorrect = parseInt(questionsIncorrect, 10) || 0;
    setAttempted(correct + incorrect);
  }, [questionsCorrect, questionsIncorrect]);

  // Update selected series when modal opens
  useEffect(() => { if (isOpen) { setCurrentSeries(selectedSeries); } }, [isOpen, selectedSeries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      series: currentSeries,
      testNumber,
      dateTaken,
      questionsCorrect,
      questionsIncorrect,
      marksScored
    };

    try {
      const response = await fetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onTestAdded();
        onRequestClose();
      } else { console.error('Failed to add test'); }
    } catch (error) { console.error('Error:', error); }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles} contentLabel="Add Test Score">
      <h2>Add New Test Score</h2>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label htmlFor="series">Test Series</label>
          <select id="series" value={currentSeries} onChange={e => setCurrentSeries(e.target.value)}>
            {seriesList.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="testNumber">Test No.</label>
            <input id="testNumber" type="text" value={testNumber} onChange={e => setTestNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input id="subject" type="text" value={subject} onChange={e => setSubject(e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="dateTaken">Date Taken</label>
          <input id="dateTaken" type="date" value={dateTaken} onChange={e => setDateTaken(e.target.value)} required />
        </div>
        <div className="form-row">
            <div className="form-group">
                <label htmlFor="correct">Correct</label>
                <input id="correct" type="number" value={questionsCorrect} onChange={e => setQuestionsCorrect(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="incorrect">Incorrect</label>
                <input id="incorrect" type="number" value={questionsIncorrect} onChange={e => setQuestionsIncorrect(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="attempted">Attempted</label>
                <input id="attempted" type="number" value={attempted} disabled className="disabled-input" />
            </div>
        </div>
        <div className="form-group">
          <label htmlFor="score">Marks Scored</label>
          <input id="score" type="number" step="0.01" value={marksScored} onChange={e => setMarksScored(e.target.value)} required />
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onRequestClose} className="button button-secondary">Cancel</button>
          <button type="submit" className="button button-primary">Save Score</button>
        </div>
      </form>
    </Modal>
  );
}

export default AddTestModal;
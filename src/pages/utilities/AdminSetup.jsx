// src/pages/utilities/AdminSetup.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminSetup() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [timeLimit, setTimeLimit] = useState(120); // Default time in minutes
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [maxMarks, setMaxMarks] = useState(200);
  const [negativeMarking, setNegativeMarking] = useState(0.5);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the list of available test collections
    fetch('http://localhost:5000/api/mocks/collections')
      .then(res => res.json())
      .then(data => {
        setCollections(data);
        if (data.length > 0) {
          setSelectedCollection(data[0]); // Default to the first one
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching collections:", err);
        setIsLoading(false);
      });
  }, []);

  // New useEffect to fetch question count when collection changes
  useEffect(() => {
    if (!selectedCollection) return;

    setIsLoading(true);
    fetch(`http://localhost:5000/api/mocks/collections/${selectedCollection}/details`)
      .then(res => res.json())
      .then(data => {
        setTotalQuestions(data.totalQuestions || 0);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching collection details:", err);
        setTotalQuestions(0); // Reset on error
        setIsLoading(false);
      });
  }, [selectedCollection]);

  const handleCreateLobby = async () => {
    if (!selectedCollection) return;
    
    const response = await fetch('http://localhost:5000/api/mocks/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collectionName: selectedCollection,
        timeLimit: timeLimit,
        totalQuestions: totalQuestions,
        maxMarks: maxMarks,
        negativeMarking: negativeMarking
      }),
    });
    const sessionData = await response.json();

    if (sessionData && sessionData._id) {
      // Redirect the admin to the new lobby page
      navigate(`/utilities/local-mock/lobby/${sessionData._id}`);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create a Local Mock Exam</h1>
        <p>Select a question paper and create a lobby for participants to join.</p>
      </div>
      <div className="setup-form">
        <label htmlFor="collection-select">Select Test Paper:</label>
        <select 
          id="collection-select"
          value={selectedCollection} 
          onChange={e => setSelectedCollection(e.target.value)}
          disabled={isLoading}
        >
          {collections.map(name => <option key={name} value={name}>{name}</option>)}
        </select>

        {isLoading && <p>Loading questions count...</p>}

        <label htmlFor="total-questions-display">Total Questions:</label>
        <p id="total-questions-display" className="form-static-display">
          {totalQuestions > 0 ? totalQuestions : 'N/A'}
        </p>

        <label htmlFor="time-limit-input">Set Time Limit (minutes):</label>
        <input
          id="time-limit-input"
          type="number"
          value={timeLimit}
          onChange={e => setTimeLimit(e.target.value)}
          className="time-limit-input"
        />

        <label htmlFor="max-marks-input">Set Maximum Marks:</label>
        <input
          id="max-marks-input"
          type="number"
          value={maxMarks}
          onChange={e => setMaxMarks(e.target.value)}
          className="time-limit-input"
        />

        <label htmlFor="negative-marking-input">Negative Marking (e.g., 0.25):</label>
        <input
          id="negative-marking-input"
          type="number"
          step="0.01"
          value={negativeMarking}
          onChange={e => setNegativeMarking(e.target.value)}
          className="time-limit-input"
        />

        <button onClick={handleCreateLobby} className="button button-primary" disabled={isLoading || totalQuestions === 0}>
          Create Lobby
        </button>
      </div>
    </div>
  );
}

export default AdminSetup;
// src/pages/utilities/AdminSetup.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminSetup() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
      });
  }, []);

  const handleCreateLobby = async () => {
    if (!selectedCollection) return;
    
    const response = await fetch('http://localhost:5000/api/mocks/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName: selectedCollection }),
    });
    const sessionData = await response.json();

    if (sessionData && sessionData._id) {
      // Redirect the admin to the new lobby page
      navigate(`/utilities/local-mock/lobby/${sessionData._id}`);
    }
  };

  if (isLoading) {
    return <div className="page-container">Loading available tests...</div>;
  }

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
        >
          {collections.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button onClick={handleCreateLobby} className="button button-primary">
          Create Lobby
        </button>
      </div>
    </div>
  );
}

export default AdminSetup;
// src/pages/utilities/JoinLobby.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JoinLobby() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    const response = await fetch(`${API_BASE}/api/mocks/session-by-code/${code.trim()}`);
    if (response.ok) {
      const session = await response.json();
      // Use the session's main ID (_id) for the lobby URL
      navigate(`/utilities/local-mock/lobby/${session._id}`);
    } else {
      setError('Invalid session code. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Join a Local Mock Exam</h1>
      </div>
      <form onSubmit={handleSubmit} className="setup-form">
        <label htmlFor="session-code">Enter Session Code:</label>
        <input 
          id="session-code" type="text" value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder="e.g., AB12CD"
        />
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button type="submit" className="button button-primary">Join Lobby</button>
      </form>
    </div>
  );
}

export default JoinLobby;
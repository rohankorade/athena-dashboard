// src/pages/utilities/LobbyView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE = `http://${window.location.hostname}:5000`;

function LobbyView() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(API_BASE);

    // Check if the user has a saved username and session ID
    const savedUsername = sessionStorage.getItem('exam_username');
    const savedSessionId = sessionStorage.getItem('exam_sessionId');
    if (savedUsername && savedSessionId === sessionId) {
      // If we're in the same lobby as before, restore the user's state
      setUsername(savedUsername);
      setIsRegistered(true);
    }

    // Connect to the specific lobby room
    socket.emit('join_lobby', sessionId);
    
    // Listen for updates from the server
    socket.on('lobby_update', (updatedSession) => {
      setSession(updatedSession);
    });
    
    // Clean up on component unmount
    return () => {
      socket.off('lobby_update');
      socket.disconnect();
    };
  }, [sessionId]);

  const handleRegister = (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim(); // Create the variable here
    if (!trimmedUsername) return;

    // Emit registration event to the server
    const socket = io(API_BASE);
    socket.emit('participant_join', { sessionId, username: trimmedUsername });
    setIsRegistered(true);

    // Save the username and session ID to sessionStorage
    sessionStorage.setItem('exam_username', trimmedUsername);
    sessionStorage.setItem('exam_sessionId', sessionId);
  };
  
  const handleReadyToggle = (e) => {
    const isReady = e.target.checked;
    const socket = io(API_BASE);
    socket.emit('participant_ready', { sessionId, username, isReady });
  };
  
  if (!session) {
    return <div className="page-container">Loading lobby...</div>;
  }
  
  const currentUser = session.participants.find(p => p.username === username);

  // Check if all participants are ready
  const allReady = session.participants.length > 0 && session.participants.every(p => p.isReady);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Exam Lobby</h1>
        <h2>Session Code: <span className="session-code-display">{session.sessionCode}</span></h2>
      </div>

      {!isRegistered ? (
        <form onSubmit={handleRegister} className="setup-form">
          <label htmlFor="username">Enter Your Name:</label>
          <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          <button type="submit" className="button button-primary">Register</button>
        </form>
      ) : (
        <div className="lobby-content">
          <h3>Participants</h3>
          <ul className="participant-list">
            {session.participants.map(p => (
              <li key={p.username} className={p.isReady ? 'ready' : ''}>
                {p.username}
                <span>{p.isReady ? '✅ Ready' : '⏳ Not Ready'}</span>
              </li>
            ))}
          </ul>
          
          <div className="readiness-check">
            <label>
              <input type="checkbox" checked={currentUser?.isReady || false} onChange={handleReadyToggle} />
              I am ready
            </label>
          </div>
          
          <div className="admin-controls">
            <button className="button button-primary" disabled={!allReady}>
              Start Exam for All
            </button>
            {!allReady && <p>The exam can start once all participants are ready.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default LobbyView;
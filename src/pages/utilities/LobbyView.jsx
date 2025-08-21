// src/pages/utilities/LobbyView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE = `http://${window.location.hostname}:5000`;

// Create the socket connection once and reuse it across the component's lifecycle.
const socket = io(API_BASE);

function LobbyView() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const isAdminView = location.pathname.startsWith('/utilities');

  useEffect(() => {
    const savedUsername = sessionStorage.getItem('exam_username');
    const savedSessionId = sessionStorage.getItem('exam_sessionId');
    if (savedUsername && savedSessionId === sessionId) {
      setUsername(savedUsername);
      setIsRegistered(true);
    }

    socket.emit('join_lobby', sessionId);
    
    socket.on('lobby_update', setSession);

    socket.on('exam_started', ({ attemptId }) => {
      navigate(`/exam/${attemptId}`);
    });
    
    return () => {
      socket.off('lobby_update');
      socket.off('exam_started');
    };
  }, [sessionId, navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    socket.emit('participant_join', { sessionId, username: trimmedUsername });
    setIsRegistered(true);
    sessionStorage.setItem('exam_username', trimmedUsername);
    sessionStorage.setItem('exam_sessionId', sessionId);
  };
  
  const handleReadyToggle = (e) => {
    const isReady = e.target.checked;
    socket.emit('participant_ready', { sessionId, username, isReady });
  };

  const handleStartExam = () => {
    socket.emit('start_exam', sessionId);
  };
  
  if (!session) {
    return <div className="page-container">Loading lobby...</div>;
  }
  
  const currentUser = session.participants.find(p => p.username === username);
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
          
          {isAdminView && (
            <div className="admin-controls">
              <button className="button button-primary" onClick={handleStartExam} disabled={!allReady}>
                Start Exam for All
              </button>
              {!allReady && <p>The exam can start once all participants are ready.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LobbyView;
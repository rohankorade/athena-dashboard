// src/pages/utilities/LobbyView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE = `http://${window.location.hostname}:5000`;
const socket = io(API_BASE);
const ADMIN_USERNAME = "Rohan";

function LobbyView() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const isAdminView = location.pathname.startsWith('/utilities');

  useEffect(() => {
    // For regular participants, check if they are already registered
    if (!isAdminView) {
      const savedUsername = sessionStorage.getItem('exam_username');
      const savedSessionId = sessionStorage.getItem('exam_sessionId');
      if (savedUsername && savedSessionId === sessionId) {
        setUsername(savedUsername);
        setIsRegistered(true);
      }
    }

    // Join the lobby and set up listeners
    socket.emit('join_lobby', sessionId);
    
    const handleLobbyUpdate = (updatedSession) => setSession(updatedSession);
    socket.on('lobby_update', handleLobbyUpdate);

    // Listen for the new broadcast event
    const handleExamStartedForAll = ({ attemptMap }) => {
        const currentUsername = isAdminView ? ADMIN_USERNAME : username;
        const attemptId = attemptMap[currentUsername];

        // If the current user has an attemptId in the map, navigate
        if (attemptId) {
            navigate(`/exam/${attemptId}`);
        }
    };
    socket.on('exam_started_for_all', handleExamStartedForAll);
    
    // Cleanup function to remove listeners
    return () => {
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('exam_started_for_all', handleExamStartedForAll);
    };
  }, [sessionId, isAdminView, username, navigate]);

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
  
  const handleAdminParticipation = () => {
    const isAdminParticipating = session?.participants.some(p => p.username === ADMIN_USERNAME);
    if (isAdminParticipating) {
      socket.emit('admin_leave_session', { sessionId, username: ADMIN_USERNAME });
    } else {
      socket.emit('admin_join_session', { sessionId, username: ADMIN_USERNAME });
    }
  };

  if (!session) {
    return <div className="page-container">Loading lobby...</div>;
  }
  
  const currentUser = session.participants.find(p => p.username === username);
  const isAdminParticipating = session.participants.some(p => p.username === ADMIN_USERNAME);
  const allReady = session.participants.length > 0 && session.participants.every(p => p.isReady);

  // --- RENDER LOGIC --- //

  if (!isAdminView && !isRegistered) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Exam Lobby</h1></div>
        <div className="centered-card-container">
          <div className="setup-card">
            <h2>Join the Session</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group-vertical">
                <label htmlFor="username">Enter Your Name</label>
                <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus placeholder="Your Name" />
              </div>
              <div className="setup-actions">
                <button type="submit" className="button-action-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Exam Lobby</h1>
        <h2>Session Code: <span className="session-code-display">{session.sessionCode}</span></h2>
      </div>
      <div className="centered-card-container">
        <div className="setup-card">
          <h2>Participants ({session.participants.length})</h2>
          <ul className="participant-list">
            {session.participants.map(p => (
              <li key={p.username} className={p.isReady ? 'ready' : ''}>
                <span>{p.username} {p.username === ADMIN_USERNAME && '(Admin)'}</span>
                <span>{p.isReady ? '✅ Ready' : '⏳ Not Ready'}</span>
              </li>
            ))}
          </ul>
          <div className="lobby-actions">
            {!isAdminView && (
              <div className="readiness-check">
                <label>
                  <input type="checkbox" checked={currentUser?.isReady || false} onChange={handleReadyToggle} />
                  I am ready
                </label>
              </div>
            )}
            
            {isAdminView && (
              <div className="admin-controls">
                <button className="btn-reset button-modern-pink custom-margin-right" onClick={handleAdminParticipation}>
                  {isAdminParticipating ? 'Leave Session' : 'Join as Participant'}
                </button>
                <button className="btn-reset button-modern-green" onClick={handleStartExam} disabled={!allReady}>
                  Start Exam for All
                </button>
                {!allReady && <p className="all-ready-notice">The exam can start once all participants are ready.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LobbyView;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:5000`;

function SessionListPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/api/mocks/sessions`);
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (isLoading) {
    return <div className="page-container"><h1>All Mock Sessions</h1><p>Loading sessions...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Mock Sessions</h1>
        <p>Review ongoing and completed exam sessions.</p>
      </div>
      <div className="session-list">
        {sessions.length === 0 ? (
          <p>No sessions found.</p>
        ) : (
          sessions.map(session => (
            <Link to={`/utilities/sessions/${session._id}`} key={session._id} className="session-card">
              <div className="session-card-header">
                <h3>{session.examCollectionName}</h3>
                <span className={`status-badge status-${session.status}`}>{session.status}</span>
              </div>
              <div className="session-card-body">
                <p><strong>Code:</strong> {session.sessionCode}</p>
                <p><strong>Participants:</strong> {session.participants.length}</p>
                <p><strong>Time Limit:</strong> {session.timeLimit / 60} minutes</p>
                <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default SessionListPage;

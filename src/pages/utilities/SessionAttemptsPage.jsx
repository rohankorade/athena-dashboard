import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:5000`;

function SessionAttemptsPage() {
  const { sessionId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/api/mocks/sessions/${sessionId}/attempts`);
        const data = await response.json();
        setAttempts(data);
      } catch (error) {
        console.error("Failed to fetch attempts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttempts();
  }, [sessionId]);

  if (isLoading) {
    return <div className="page-container"><h1>Session Attempts</h1><p>Loading attempts...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Session Attempts</h1>
        <p>Review attempts for session <strong>{sessionId}</strong>.</p>
      </div>
      <div className="session-list">
        {attempts.length === 0 ? (
          <p>No attempts found for this session.</p>
        ) : (
          attempts.map(attempt => (
            <Link to={`/utilities/sessions/${sessionId}/attempts/${attempt._id}`} key={attempt._id} className="session-card">
              <div className="session-card-header">
                <h3>{attempt.username}</h3>
                <span className={`status-badge status-${attempt.isCompleted ? 'finished' : 'active'}`}>
                  {attempt.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="session-card-body">
                <p><strong>Started:</strong> {new Date(attempt.startTime).toLocaleString()}</p>
                {attempt.isCompleted && (
                  <>
                    <p><strong>Submitted:</strong> {new Date(attempt.submittedAt).toLocaleString()}</p>
                    <p><strong>Score:</strong> {attempt.finalScore}</p>
                  </>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default SessionAttemptsPage;

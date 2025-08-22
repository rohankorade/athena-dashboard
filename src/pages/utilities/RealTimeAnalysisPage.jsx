// src/pages/utilities/RealTimeAnalysisPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';


function RealTimeAnalysisPage() {
  const { attemptId } = useParams();
  const socket = useSocket();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const API_BASE = `http://${window.location.hostname}:5000`;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch the initial attempt data
        const attemptRes = await fetch(`${API_BASE}/api/exam-attempt/${attemptId}`);
        const attemptData = await attemptRes.json();
        setAttempt(attemptData);

        // Fetch the questions for the exam
        if (attemptData.examCollectionName) {
          const questionsRes = await fetch(`${API_BASE}/api/exam-questions/${attemptData.examCollectionName}`);
          const questionsData = await questionsRes.json();
          setQuestions(questionsData);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [attemptId]);

  useEffect(() => {
    if (!socket) return;
    // Join the room to receive real-time updates for this attempt
    socket.emit('join_attempt_room', attemptId);

    // Listen for updates
    const handleAttemptUpdate = (updatedAttempt) => {
      setAttempt(updatedAttempt);
    };
    socket.on('attempt_update', handleAttemptUpdate);

    // Clean up on component unmount
    return () => {
      socket.off('attempt_update', handleAttemptUpdate);
      // Should also add a 'leave_attempt_room' event on the server for cleanup
    };
  }, [socket, attemptId]);

  const stats = useMemo(() => {
    if (!attempt) return { answered: 0, unanswered: 0, marked: 0, unseen: 0, score: 0 };

    const answered = attempt.answers.filter(a => a.status === 'answered').length;
    const unanswered = attempt.answers.filter(a => a.status === 'unanswered').length;
    const marked = attempt.answers.filter(a => a.status === 'marked_for_review').length;
    const unseen = attempt.answers.filter(a => a.status === 'unseen').length;

    return { answered, unanswered, marked, unseen, score: attempt.finalScore };
  }, [attempt]);

  if (isLoading) {
    return <div className="page-container"><h1>Real-Time Analysis</h1><p>Loading analysis...</p></div>;
  }

  if (!attempt) {
    return <div className="page-container"><h1>Error</h1><p>Could not load attempt data.</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Live Analysis: {attempt.username}</h1>
        <p>Exam: <strong>{attempt.examCollectionName}</strong></p>
      </div>

      <div className="analysis-dashboard">
        <div className="stats-grid live-stats">
          <div className="stat-item score">
            <span className="stat-label">Score</span>
            <span className="stat-value">{attempt.isCompleted ? stats.score : 'N/A'}</span>
          </div>
          <div className="stat-item answered">
            <span className="stat-label">Answered</span>
            <span className="stat-value">{stats.answered}</span>
          </div>
          <div className="stat-item unanswered">
            <span className="stat-label">Unanswered</span>
            <span className="stat-value">{stats.unanswered}</span>
          </div>
          <div className="stat-item marked">
            <span className="stat-label">Marked for Review</span>
            <span className="stat-value">{stats.marked}</span>
          </div>
           <div className="stat-item unseen">
            <span className="stat-label">Unseen</span>
            <span className="stat-value">{stats.unseen}</span>
          </div>
        </div>

        <div className="palette-container">
          <h2>Question Status</h2>
          <div className="palette-grid">
            {questions.map(q => {
              const answer = attempt.answers.find(a => a.question_number === q.question_number);
              const status = answer ? answer.status : 'unseen';
              return (
                <div key={q.question_number} className={`palette-button ${status}`}>
                  {q.question_number}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealTimeAnalysisPage;
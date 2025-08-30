// src/components/ExamCountdown.jsx

import React, { useState, useEffect } from 'react';

// Calculates full days remaining
const calculateDaysRemaining = (examDateString) => {
  const today = new Date();
  const examDate = new Date(examDateString);
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  const differenceInTime = examDate.getTime() - today.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
};

// Calculates the raw time remaining in milliseconds
const calculateTimeRemaining = (examDateString) => {
    const now = new Date();
    const examDate = new Date(examDateString);
    examDate.setHours(0, 0, 0, 0);
    const differenceInMs = examDate.getTime() - now.getTime();
    return differenceInMs < 0 ? 0 : differenceInMs;
}

// --- NEW: This function now returns an object of time parts ---
const getTimeParts = (milliseconds) => {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    return {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
    };
}

function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- NEW: State now holds the time parts object ---
  const [timeParts, setTimeParts] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/exams', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch exams');
        }
        const data = await response.json();
        setExams(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (exams.length === 0) return;
    const timerId = setInterval(() => {
        const remainingMs = calculateTimeRemaining(exams[0].date);
        setTimeParts(getTimeParts(remainingMs));
    }, 1000);
    return () => clearInterval(timerId);
  }, [exams]);

  if (isLoading) return <div>Loading exams...</div>;
  if (error) return <div>Error: {error}</div>;
  if (exams.length === 0) return <div>No upcoming exams found.</div>;

  const primaryExam = exams[0];
  const secondaryExams = exams.slice(1, 7);

  return (
    <div className="countdown-container">
      <div className="primary-card">
        <h3>{primaryExam.name}</h3>
        <div className="divider"></div>
        <div className="days-remaining-large">{calculateDaysRemaining(primaryExam.date)}</div>
        <div className="days-text">days remaining</div>
        <div className="subtle-divider"></div>
        {/* --- NEW: JSX rendering for the styled time --- */}
        <div className="hours-remaining">
            <span>{timeParts.hours}</span>
            <span className="countdown-time-unit">H</span>
            <span>{timeParts.minutes}</span>
            <span className="countdown-time-unit">M</span>
            <span>{timeParts.seconds}</span>
            <span className="countdown-time-unit">S</span>
        </div>
      </div>
      <div className="secondary-grid">
        {secondaryExams.map(exam => (
          <div className="secondary-card" key={exam._id}>
            <div className="days-remaining-small">{calculateDaysRemaining(exam.date)}</div>
            <p>{exam.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExamCountdown;
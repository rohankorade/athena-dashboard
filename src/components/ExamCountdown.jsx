// src/components/ExamCountdown.jsx

import React, { useState, useEffect } from 'react';

// A helper function to calculate the days remaining
const calculateDaysRemaining = (examDateString) => {
  const today = new Date();
  const examDate = new Date(examDateString);
  
  // To avoid issues with timezones, we'll compare dates only
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);

  const differenceInTime = examDate.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays;
};

function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This function fetches the data from our backend
    const fetchExams = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/exams');
        if (!response.ok) {
          throw new Error('Network response was not ok');
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
  }, []); // Empty array means this effect runs only once

  // --- Render Logic ---

  if (isLoading) {
    return <div>Loading exams...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (exams.length === 0) {
    return <div>No upcoming exams found.</div>;
  }

  // The backend already sorts the exams, so the first one is the primary one
  const primaryExam = exams[0];
  const secondaryExams = exams.slice(1, 7); // Get the next 6 exams for the grid

  return (
    <div className="countdown-container">
      {/* Left Side: Primary Card */}
      <div className="primary-card">
        <h3>{primaryExam.name}</h3>
        <div className="divider"></div>
        <div className="days-remaining-large">{calculateDaysRemaining(primaryExam.date)}</div>
        <div className="days-text">days remaining</div>
      </div>

      {/* Right Side: Secondary Grid */}
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
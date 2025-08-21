// src/pages/utilities/PomodoroTimer.jsx

import React, { useState, useEffect } from 'react';

// --- Constants for Timer Durations (in minutes) ---
const WORK_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;

function PomodoroTimer() {
  const [minutes, setMinutes] = useState(WORK_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);

  // This useEffect hook contains the core timer logic
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Session ended
            const alertSound = new Audio('/alert.mp3'); // Assumes you have alert.mp3 in your /public folder
            alertSound.play();
            
            // Switch session type
            const newIsWorkSession = !isWorkSession;
            setIsWorkSession(newIsWorkSession);
            setMinutes(newIsWorkSession ? WORK_MINUTES : SHORT_BREAK_MINUTES);
            setSeconds(0);
            setIsActive(false); // Pause timer after session ends
          } else {
            // Decrement minute and reset seconds
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          // Decrement second
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    // Cleanup function to clear the interval
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes, isWorkSession]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinutes(isWorkSession ? WORK_MINUTES : SHORT_BREAK_MINUTES);
    setSeconds(0);
  };

  // Format time to always show two digits (e.g., 05 instead of 5)
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return (
    <div className="page-container">
       <div className="page-header">
        <h1>Pomodoro Timer</h1>
      </div>
      <div className="pomodoro-container">
        <div className="session-indicator">
          {isWorkSession ? 'Work Session' : 'Break Time'}
        </div>
        <div className="timer-display">
          {formattedMinutes}:{formattedSeconds}
        </div>
        <div className="timer-controls">
          <button onClick={handleStartPause} className="button button-primary timer-button">
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={handleReset} className="button button-secondary timer-button">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default PomodoroTimer;
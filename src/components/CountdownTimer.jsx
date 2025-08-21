// src/components/CountdownTimer.jsx
import React, { useState, useEffect } from 'react';

function CountdownTimer({ startTime, timeLimit }) {
  const calculateRemainingTime = () => {
    const now = new Date();
    const start = new Date(startTime);
    const elapsedSeconds = Math.floor((now - start) / 1000);
    return Math.max(0, timeLimit - elapsedSeconds);
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [startTime, timeLimit]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="countdown-timer">
      <h4>Time Remaining</h4>
      <p>{formatTime(remainingTime)}</p>
      {remainingTime === 0 && <p className="time-up">Time's Up!</p>}
    </div>
  );
}

export default CountdownTimer;

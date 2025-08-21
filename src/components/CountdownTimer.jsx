// src/components/CountdownTimer.jsx
import React from 'react';

function CountdownTimer({ remainingTime }) {
  const formatTime = (seconds) => {
    // Handle the initial null or undefined state gracefully
    if (seconds === null || typeof seconds === 'undefined' || seconds < 0) {
      return "00:00:00";
    }
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

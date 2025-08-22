// src/pages/Utilities.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const utilities = [
  { title: 'Sessions Info', path: '/utilities/sessions', description: 'Review mock sessions that are currently ongoing or have been concluded.' },
  { title: 'Local Mock', path: '/utilities/local-mock/setup', description: 'Host a real-time exam over LAN.' },
  { title: 'Join Mock Exam', path: '/utilities/local-mock/join', description: 'Join a session with a code.' },
  { title: 'Pomodoro Timer', path: '/utilities/pomodoro-timer', description: 'Focus and break timer.' },
];

function Utilities() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Utilities</h1>
        <p>A collection of tools to aid your preparation.</p>
      </div>
      <div className="utilities-grid">
        {utilities.map((util, index) => (
          <Link to={util.path} key={`${util.title}-${index}`} className="utility-card">
            <h3>{util.title}</h3>
            <p>{util.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Utilities;
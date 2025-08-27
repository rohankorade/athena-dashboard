// src/pages/Utilities.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const utilities = [
  { title: 'Sessions Info', path: '/utilities/sessions', description: 'Review mock sessions' },
  { title: 'Practice', path: '/utilities/practice', description: 'Interactive question practice' },
  { title: 'Create Mock', path: '/utilities/local-mock/setup', description: 'Host an exam over LAN' },
  { title: 'Join Mock', path: '/utilities/local-mock/join', description: 'Join a session with a code' },
  { title: 'Pomodoro Timer', path: '/utilities/pomodoro-timer', description: 'Focus and break timer' },
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
            <div className="card-divider"></div>
            <p>{util.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Utilities;
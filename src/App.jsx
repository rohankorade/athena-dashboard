// src/App.jsx

import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import './App.css';
import WelcomeMessage from './components/WelcomeMessage';

function App() {
  return (
    <div className="dashboard-container">
      <header className="welcome-section">
        <WelcomeMessage />
      </header>

      {/* Child routes will be rendered here */}
      <Outlet /> 
    </div>
  );
}

export default App;
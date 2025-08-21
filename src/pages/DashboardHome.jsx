// src/pages/DashboardHome.jsx

import React from 'react';
import ExamCountdown from '../components/ExamCountdown';
import Performance from '../components/Performance';
import FooterNav from '../components/FooterNav';

function DashboardHome() {
  return (
    <>
      <main className="main-content">
        <div className="countdown-section">
          <ExamCountdown />
        </div>
        <div className="performance-section">
          <Performance />
        </div>
      </main>
      <footer className="footer-nav-section">
        <FooterNav />
      </footer>
    </>
  );
}

export default DashboardHome;
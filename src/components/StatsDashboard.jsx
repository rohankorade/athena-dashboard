// src/components/StatsDashboard.jsx

import React from 'react';

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StatsDashboard({ stats }) {
  if (!stats) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="stats-container">
      <StatCard value={stats.daysToCSP} label="Days to CSP" />
      <StatCard value={stats.total} label="Total Editorials" />
      <StatCard value={stats.read} label="Read" />
      <StatCard value={stats.unread} label="Unread" />
      <StatCard value={stats.perDay} label="Per Day Metric" />
    </div>
  );
}

export default StatsDashboard;
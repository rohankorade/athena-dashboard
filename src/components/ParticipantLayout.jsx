// src/components/ParticipantLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

function ParticipantLayout() {
  // This component provides the base container for the layout,
  // ensuring participant pages have the same full-screen foundation as the main app,
  // but without the header or other admin-specific UI elements.
  return (
    <div className="dashboard-container">
      <Outlet />
    </div>
  );
}

export default ParticipantLayout;

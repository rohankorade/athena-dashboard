// src/components/StashSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';

function StashSidebar({ collections, activeView, searchTerm, onSearchChange }) {
  // A helper function to create the correct link path
  const getPath = (viewName) => `/utilities/stash/${viewName}`;

  return (
    <aside className="stash-sidebar">
      <div className="sidebar-search-container">
        <input
          type="text"
          placeholder="🔍 Search all videos..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* Use NavLink for dashboard */}
          <li>
            <NavLink to={getPath('dashboard')}>
              <span>Dashboard</span>
              {/* This empty span ensures flex justification works like the items below */}
              <span></span>
            </NavLink>
          </li>
          {/* Map collections to NavLink components */}
          {collections.map(col => (
            <li key={col.name}>
               <NavLink to={getPath(col.name)}>
                <span>{col.name.replace(/_/g, ' ')}</span>
                <span className="collection-count">{col.count}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default StashSidebar;
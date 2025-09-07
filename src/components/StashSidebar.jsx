// src/components/StashSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';

// 1. Accept a new prop: `onNavLinkClick`
function StashSidebar({ collections, searchTerm, onSearchChange, onNavLinkClick }) {
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
          <li>
            {/* 2. Add the onClick handler to the NavLink */}
            <NavLink to={getPath('dashboard')} onClick={onNavLinkClick} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Dashboard
            </NavLink>
          </li>
          {collections.map(col => (
            <li key={col.name}>
              {/* 3. Add the onClick handler here as well */}
              <NavLink to={getPath(col.name)} onClick={onNavLinkClick} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
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
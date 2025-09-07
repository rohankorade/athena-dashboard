// src/components/StashSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';

function StashSidebar({ collections, searchTerm, onSearchChange }) {
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
            <NavLink to={getPath('dashboard')} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Dashboard
            </NavLink>
          </li>
          {collections.map(col => (
            <li key={col.name}>
              <NavLink to={getPath(col.name)} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
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
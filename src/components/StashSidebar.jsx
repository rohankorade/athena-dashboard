// src/components/StashSidebar.jsx

import React from 'react';

function StashSidebar({ collections, activeView, onSelectView, searchTerm, onSearchChange }) {
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
          <li 
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => onSelectView('dashboard')}
          >
            Dashboard
          </li>
          {collections.map(col => (
            <li 
              key={col.name}
              className={activeView === col.name ? 'active' : ''}
              onClick={() => onSelectView(col.name)}
            >
              {col.name.replace(/_/g, ' ')}
              <span className="collection-count">{col.count}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default StashSidebar;
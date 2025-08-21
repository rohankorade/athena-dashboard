// src/components/NoteListItem.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function NoteListItem({ note, onToggleRead }) {
  const { paper, subject, theme, tags, date } = note.frontmatter;

  const handleToggle = () => {
    onToggleRead(note._id, !note.isRead);
  };

  return (
    <div className="note-list-item-card" title={`Athena ID: ${note._id}`}>
      {/* --- Section 1: Card Header --- */}
      <div className="note-header">
        <div className="note-header-main">
          <p className="note-title">{note.title}</p>
          <p className="note-date">
            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`status-indicator ${note.isRead ? 'read' : 'unread'}`}>
          {note.isRead ? 'Read' : 'Unread'}
        </span>
      </div>
      
      {/* --- Section 2: Card Body --- */}
      <div className="note-body">
        {/* Left side of the body */}
        <div className="note-body-main">
          <div className="metadata-grid">
            <span>📄 Paper</span>
            <span>{Array.isArray(paper) ? paper.join(', ') : paper}</span>
            <span>📚 Subject</span>
            <span>{Array.isArray(subject) ? subject.join(', ') : subject}</span>
            <span>🎯 Theme</span>
            <span className="theme-text">{Array.isArray(theme) ? theme.join(', ') : theme}</span>
          </div>
          <div className="tag-pills-container">
            {tags?.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
          </div>
        </div>
        {/* Right side of the body */}
        <div className="note-body-actions">
          <Link to={`/editorials/view/${note._id}`} className="button button-modern-gray small-button btn-reset">View</Link>
          <button onClick={handleToggle} className="button-modern-purple small-button">
            {note.isRead ? 'Mark as Unread' : 'Mark as Read'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteListItem;
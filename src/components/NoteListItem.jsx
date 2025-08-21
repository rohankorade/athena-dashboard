// src/components/NoteListItem.jsx
import React from 'react';

function NoteListItem({ note, onToggleRead }) {
  const handleToggle = () => {
    onToggleRead(note._id, !note.isRead);
  };

  return (
    <div className="note-list-item">
      <div className="note-info">
        <p className="note-title">{note.title}</p>
        <p className="note-date">
          {new Date(note.frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <span className={`status-indicator ${note.isRead ? 'read' : 'unread'}`}>
          {note.isRead ? 'Read' : 'Unread'}
        </span>
      </div>
      <div className="note-actions">
        <button className="button-secondary small-button">View</button>
        <button onClick={handleToggle} className="button-secondary small-button">
          {note.isRead ? 'Mark as Unread' : 'Mark as Read'}
        </button>
      </div>
    </div>
  );
}
export default NoteListItem;
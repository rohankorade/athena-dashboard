// src/components/NextToRead.jsx

import React from 'react';

function NextToRead({ note, onUpdate }) {
  if (!note) {
    return (
      <div className="pending-reading-list">
        <h3>Pending Reading List</h3>
        <p className="all-read-message">You're all caught up! 🎉</p>
      </div>
    );
  }

  const handleMarkAsRead = async () => {
    // 1. Update the note in the database
    await fetch(`http://localhost:5000/api/editorials/${note._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    });
    // 2. Tell the parent page to refresh all dashboard data
    onUpdate();
  };

  return (
    <div className="pending-reading-list">
      <h3>Next to Read</h3>
      <div className="next-to-read-card">
        <div className="note-info">
          <p className="note-title">{note.title}</p>
          <p className="note-date">
            {new Date(note.frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="note-actions">
          <button className="button-primary small-button">View</button>
          <button onClick={handleMarkAsRead} className="button-secondary small-button">
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  );
}

export default NextToRead;
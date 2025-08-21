// src/components/NextToRead.jsx

import React from 'react';
import NoteListItem from './NoteListItem'; // 1. Import the component

// 2. Accept the main onToggleRead function as a prop
function NextToRead({ note, onToggleRead }) {
  if (!note) {
    return (
      <div className="pending-reading-list">
        <h3>Next to Read</h3>
        <p className="all-read-message">You're all caught up! 🎉</p>
      </div>
    );
  }

  return (
    <div className="pending-reading-list">
      <h3>Next to Read</h3>
      {/* 3. Reuse the NoteListItem component */}
      <NoteListItem note={note} onToggleRead={onToggleRead} />
    </div>
  );
}

export default NextToRead;
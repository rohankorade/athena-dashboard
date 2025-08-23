// src/pages/NoteView.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

function NoteView() {
  const [note, setNote] = useState(null);
  const { noteId } = useParams(); // Gets the ':id' from the URL

  useEffect(() => {
    if (noteId) {
      // Get the token from localStorage
      const token = localStorage.getItem('authToken');

      fetch(`http://localhost:5000/api/editorials/${noteId}`, {
        headers: {
          // Add the Authorization header
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setNote(data));
    }
  }, [noteId]);

  if (!note) {
    return <div>Loading note...</div>;
  }

  const { title, frontmatter, rawContent, analysisContent, keywordsContent } = note;

  return (
    <div className="note-view-container">
      <div className="note-view-header">
        {/* Left side: Title and Date */}
        <div className="note-view-header-main">
          <h1 className="note-view-title">{title}</h1>
          <p className="note-view-date">
            {new Date(frontmatter.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* Right side: Back Button */}
        <Link to="/editorials" className="button-modern-pink">
          &larr; Back to List
        </Link>
      </div>

      <div className="metadata-box">
        <h4>Metadata</h4>
        <div className="metadata-grid">
          <span>📄 Paper</span><span>{Array.isArray(frontmatter.paper) ? frontmatter.paper.join(', ') : frontmatter.paper}</span>
          <span>📚 Subject</span><span>{Array.isArray(frontmatter.subject) ? frontmatter.subject.join(', ') : frontmatter.subject}</span>
          <span>🎯 Theme</span><span className="theme-text">{Array.isArray(frontmatter.theme) ? frontmatter.theme.join(', ') : frontmatter.theme}</span>
        </div>
        <div className="tag-pills-container">
          {frontmatter.tags?.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
        </div>
      </div>

      <div className="note-content-section">
        <h3>Raw</h3>
        <ReactMarkdown>{rawContent}</ReactMarkdown>
      </div>

      <div className="note-content-section">
        <h3>Analysis</h3>
        <ReactMarkdown>{analysisContent}</ReactMarkdown>
      </div>
      
      <div className="note-content-section">
        <h3>Keywords</h3>
        <ReactMarkdown>{keywordsContent}</ReactMarkdown>
      </div>
    </div>
  );
}

export default NoteView;
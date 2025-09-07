// src/components/Highlight.jsx

import React from 'react';

// Memoizing the regex creation can help with performance if the component re-renders often.
const createHighlightRegex = (search = '') => {
  if (!search) return null;
  // Escape special regex characters from the search terms
  const terms = search.split(' ').filter(Boolean).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return null;
  // Create a regex that finds any of the search terms
  return new RegExp(`(${terms.join('|')})`, 'gi');
};

const Highlight = ({ text = '', search = '' }) => {
  const regex = createHighlightRegex(search);
  
  // If there's no search term, no regex, or no text, just return the original text
  if (!regex || !text) {
    return text;
  }

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        // Test if the part is one of the search terms
        regex.test(part) ? (
          <mark key={i} style={{ backgroundColor: '#ffc107', color: 'black' }}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default Highlight;
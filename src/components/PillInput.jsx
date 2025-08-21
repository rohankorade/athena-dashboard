// src/components/PillInput.jsx

import React, { useState } from 'react';

function PillInput({ terms, setTerms }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const newTerm = inputValue.trim();
      if (newTerm && !terms.includes(newTerm)) {
        setTerms([...terms, newTerm]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue) {
      removeTerm(terms.length - 1);
    }
  };

  const removeTerm = (indexToRemove) => {
    setTerms(terms.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="pill-input-container">
      {terms.map((term, index) => (
        <div key={index} className="pill">
          {term}
          <button onClick={() => removeTerm(index)} className="pill-remove">×</button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search Parameters"
        className="pill-input"
      />
    </div>
  );
}

export default PillInput;
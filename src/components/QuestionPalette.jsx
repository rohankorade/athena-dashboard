// src/components/QuestionPalette.jsx
import React from 'react';

function QuestionPalette({ attempt, questions, setCurrentQuestionIndex }) {
  if (!attempt || !questions) {
    return null;
  }

  const getStatusClass = (questionNumber) => {
    const answer = attempt.answers.find(a => a.question_number === questionNumber);
    if (!answer) return 'unseen';
    return answer.status; // 'answered', 'unanswered', 'marked_for_review', 'unseen'
  };

  const handlePaletteClick = (index) => {
    setCurrentQuestionIndex(index);
  };

  return (
    <div className="palette-container">
      <h3>Question Palette</h3>
      <div className="palette-grid">
        {questions.map((question, index) => (
          <button
            key={question.question_number}
            className={`palette-button ${getStatusClass(question.question_number)}`}
            onClick={() => handlePaletteClick(index)}
          >
            {question.question_number}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionPalette;

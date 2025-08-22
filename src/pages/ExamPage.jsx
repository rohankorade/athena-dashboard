// src/pages/ExamPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket'; // Use the single, shared socket instance

import QuestionPalette from '../components/QuestionPalette';
import CountdownTimer from '../components/CountdownTimer';

function ExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null);
  const [fontSize, setFontSize] = useState(1); // Initial font size in rem

  const FONT_SIZE_STEP = 0.125;
  const MIN_FONT_SIZE = 0.875;
  const MAX_FONT_SIZE = 1.25;

  const increaseFontSize = () => {
    setFontSize(prevSize => Math.min(prevSize + FONT_SIZE_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prevSize => Math.max(prevSize - FONT_SIZE_STEP, MIN_FONT_SIZE));
  };

  const handleAnswerUpdate = useCallback((status) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;
    socket.emit('update_answer', {
      attemptId,
      question_number: question.question_number,
      selected_option_index: selectedOption,
      status: status,
    });
    const updatedAnswers = [...attempt.answers];
    const answerToUpdate = updatedAnswers.find(a => a.question_number === question.question_number);
    if (answerToUpdate) {
      answerToUpdate.status = status;
      answerToUpdate.selected_option_index = selectedOption;
      setAttempt(prev => ({ ...prev, answers: updatedAnswers }));
    }
  }, [attemptId, currentQuestionIndex, questions, selectedOption, attempt]);

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleNext = () => {
    handleAnswerUpdate(selectedOption === null ? 'unanswered' : 'answered');
    moveToNextQuestion();
  };

  const handleSkip = () => {
    handleAnswerUpdate('unanswered');
    moveToNextQuestion();
  };

  const handleMarkForReview = () => {
    handleAnswerUpdate('marked_for_review');
    moveToNextQuestion();
  };

  const handleSubmitExam = () => {
    if (window.confirm("Are you sure you want to submit the test?")) {
        socket.emit('submit_exam', { attemptId });
    }
  };

  useEffect(() => {
    const API_BASE = `http://${window.location.hostname}:5000`; // API_BASE is only needed for fetch
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const attemptRes = await fetch(`${API_BASE}/api/exam-attempt/${attemptId}`);
        const attemptData = await attemptRes.json();
        setAttempt(attemptData);
        setRemainingTime(attemptData.timeLimit);

        if (attemptData.examSession) {
            socket.emit('join_lobby', attemptData.examSession._id);
        }

        if (attemptData.examCollectionName) {
          const questionsRes = await fetch(`${API_BASE}/api/exam-questions/${attemptData.examCollectionName}`);
          const questionsData = await questionsRes.json();
          setQuestions(questionsData);
        }
      } catch (error) {
        console.error("Failed to fetch exam data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    socket.on('timer_tick', ({ remainingTime: serverTime }) => {
        setRemainingTime(serverTime);
    });

    socket.on('exam_finished', ({ attemptId }) => {
        navigate(`/results/${attemptId}`);
    });

    return () => {
        socket.off('timer_tick');
        socket.off('exam_finished');
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    if (attempt && questions.length > 0) {
      const currentQuestionNumber = questions[currentQuestionIndex]?.question_number;
      const savedAnswer = attempt.answers.find(a => a.question_number === currentQuestionNumber);
      setSelectedOption(savedAnswer?.selected_option_index ?? null);
    }
  }, [currentQuestionIndex, attempt, questions]);

  if (isLoading || !attempt || questions.length === 0) {
    return <div className="page-container">Loading Exam...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="exam-container">
      <header className="exam-header">
        <div>
          <h2>{attempt.examCollectionName}</h2>
        </div>
        <CountdownTimer remainingTime={remainingTime} />
      </header>
      <div className="exam-main">
        <div className="exam-left-panel">
          <div className="question-area">
            <div className="question-header">
              <div className="question-number-badge">
                Question {currentQuestion.question_number}
              </div>
              <div className="font-size-controls">
                <button onClick={decreaseFontSize} className="font-size-button">-</button>
                <span className="font-size-label">Font Size</span>
                <button onClick={increaseFontSize} className="font-size-button">+</button>
              </div>
            </div>
            <div className="question-content" style={{ fontSize: `${fontSize}rem` }}>
              <p>{currentQuestion.question}</p>
            </div>
            <div className="options-container" style={{ fontSize: `${fontSize}rem` }}>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="option">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name={`question-${currentQuestion.question_number}`}
                    value={index}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                  />
                  <label htmlFor={`option-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="question-controls">
            <div className="question-controls-left">
              <button onClick={handleMarkForReview} className="button-secondary">Mark for Review & Next</button>
              <button onClick={handleSkip} className="button-secondary">Skip & Next</button>
              <button onClick={handleNext} className="button-primary">Save & Next</button>
            </div>
            <button onClick={handleSubmitExam} className="button button-danger">Submit Test</button>
          </div>
        </div>
        <div className="exam-right-panel">
          <QuestionPalette
            attempt={attempt}
            questions={questions}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
          />
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
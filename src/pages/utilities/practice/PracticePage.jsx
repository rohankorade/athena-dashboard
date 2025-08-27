// src/pages/utilities/practice/PracticePage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../../contexts/SocketContext';
import ExplanationModal from '../../../components/ExplanationModal';

/**
 * PalettePanel: A sub-component responsible for rendering the right sidebar,
 * which includes real-time stats, the per-question timer, and the question navigation palette.
 */
function PalettePanel({ questions, answers, currentIndex, onQuestionSelect, timeOnQuestion }) {
    // Memoized calculation for real-time score and stats
    const stats = useMemo(() => {
        if (!answers) return { correct: 0, incorrect: 0, score: 0 };
        const correct = answers.filter(a => a.status === 'correct').length;
        const incorrect = answers.filter(a => a.status === 'incorrect').length;
        const score = (correct * 2) - (incorrect * 0.5);
        return { correct, incorrect, score };
    }, [answers]);

    // Helper to format seconds into MM:SS format
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };
    
    return (
        <aside className="practice-status-sidebar">
            {/* Real-time performance statistics */}
            <div className="practice-stats">
                <div className="stat-item"><span className="stat-value" style={{ color: '#28a745' }}>{stats.correct}</span><span className="stat-label">Correct</span></div>
                <div className="stat-item"><span className="stat-value" style={{ color: '#dc3545' }}>{stats.incorrect}</span><span className="stat-label">Incorrect</span></div>
                <div className="stat-item"><span className="stat-value">{stats.score.toFixed(2)}</span><span className="stat-label">Total Score</span></div>
            </div>
            {/* Timer for the current question */}
            <div className="question-timer">
                <span>Time on Q:</span>
                <span>{formatTime(timeOnQuestion)}</span>
            </div>
            {/* Clickable grid of all questions for navigation */}
            <div className="palette-grid">
                {questions.map((q, index) => {
                    const status = answers[index]?.status || 'unanswered';
                    const isActive = index === currentIndex;
                    let content;

                    if (status === 'correct') {
                        content = <span className="icon correct">✓</span>;
                    } else if (status === 'incorrect') {
                        content = <span className="icon incorrect">✗</span>;
                    } else {
                        content = q.question_number;
                    }
                    return (
                        <button key={q.question_number} className={`palette-button practice-${status} ${isActive ? 'active' : ''}`} onClick={() => onQuestionSelect(index)}>
                            {content}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}


/**
 * PracticePage: The main component for the interactive practice session.
 * It manages the overall state, handles user interactions, and communicates with the server.
 */
function PracticePage() {
    // --- React Hooks ---
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();

    // --- State Management ---
    const [practiceAttempt, setPracticeAttempt] = useState(null); // Stores the entire attempt object from the DB
    const [questions, setQuestions] = useState([]); // Stores the question data for the current test
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null); // Tracks which radio button is selected
    const [timeOnQuestion, setTimeOnQuestion] = useState(0); // The live timer for the current question
    const [isModalOpen, setIsModalOpen] = useState(false); // Controls the explanation modal visibility
    const [fontSize, setFontSize] = useState(1.1); // Controls the font size of the question text

    // --- Derived State (Calculated from other state variables) ---
    const currentAnswer = useMemo(() => practiceAttempt?.answers[currentQuestionIndex], [practiceAttempt, currentQuestionIndex]);
    const isAnswerChecked = useMemo(() => currentAnswer?.status === 'correct' || currentAnswer?.status === 'incorrect', [currentAnswer]);

    // --- Font Size Controls ---
    const FONT_SIZE_STEP = 0.1;
    const MIN_FONT_SIZE = 0.9;
    const MAX_FONT_SIZE = 1.5;
    const increaseFontSize = () => setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
    const decreaseFontSize = () => setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));

    // --- Effects ---

    // Effect for fetching initial data when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const headers = { 'Authorization': `Bearer ${token}` };
                const attemptRes = await fetch(`http://localhost:5000/api/practice/attempt/${attemptId}`, { headers });
                const attemptData = await attemptRes.json();
                setPracticeAttempt(attemptData);
                const questionsRes = await fetch(`http://localhost:5000/api/practice/questions/${attemptData.practiceTestCollection}`, { headers });
                const questionsData = await questionsRes.json();
                setQuestions(questionsData);
            } catch (error) { 
                console.error("Failed to fetch practice data:", error); 
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
    }, [attemptId]);

    // Effect for running the per-question timer
    useEffect(() => {
        let timer;
        if (!isAnswerChecked && !isLoading) {
            timer = setInterval(() => setTimeOnQuestion(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isAnswerChecked, isLoading, currentQuestionIndex]);

    // Effect to sync the UI state when the question index changes
    useEffect(() => {
        if (practiceAttempt) {
            const answer = practiceAttempt.answers[currentQuestionIndex];
            setSelectedOption(answer.selected_option_index);
            setTimeOnQuestion(answer.timeTaken);
        }
    }, [currentQuestionIndex, practiceAttempt]);
    
    // Memoized calculation for real-time stats (correct, incorrect, score, percentage)
    const stats = useMemo(() => {
        if (!practiceAttempt) return { correct: 0, incorrect: 0, score: 0, attempted: 0, percentage: 0 };
        const correct = practiceAttempt.answers.filter(a => a.status === 'correct').length;
        const incorrect = practiceAttempt.answers.filter(a => a.status === 'incorrect').length;
        const score = (correct * 2) - (incorrect * 0.5);
        const attempted = correct + incorrect;
        const percentage = questions.length > 0 ? (attempted / questions.length) * 100 : 0;
        return { correct, incorrect, score, attempted, percentage };
    }, [practiceAttempt, questions]);

    // --- Event Handlers & Logic ---

    // Sends incremental time updates to the server
    const sendTimeUpdate = useCallback((timeToAdd) => {
        if (socket && timeToAdd > 0 && questions.length > 0) {
            socket.emit('practice_update_answer', {
                attemptId,
                question_number: questions[currentQuestionIndex]?.question_number,
                timeTaken: timeToAdd
            });
        }
    }, [socket, attemptId, questions, currentQuestionIndex]);

    // Handles navigation via Previous, Next, or Palette buttons
    const navigateToQuestion = useCallback((index) => {
        if (index < 0 || index >= questions.length || !practiceAttempt) return;
        const timeElapsed = timeOnQuestion - practiceAttempt.answers[currentQuestionIndex].timeTaken;
        sendTimeUpdate(timeElapsed);
        setCurrentQuestionIndex(index);
    }, [questions.length, timeOnQuestion, practiceAttempt, sendTimeUpdate, currentQuestionIndex]);

    // Checks the selected answer, updates state, and sends data to the server
    const handleCheckAnswer = () => {
        if (selectedOption === null) return;
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = String(selectedOption + 1) === currentQ.correct_answer;
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        
        const updatedAnswers = [...practiceAttempt.answers];
        const timeElapsed = timeOnQuestion - updatedAnswers[currentQuestionIndex].timeTaken;
        updatedAnswers[currentQuestionIndex] = { ...updatedAnswers[currentQuestionIndex], status: newStatus, selected_option_index: selectedOption, timeTaken: timeOnQuestion };
        setPracticeAttempt({ ...practiceAttempt, answers: updatedAnswers });

        if (socket) {
            socket.emit('practice_update_answer', {
                attemptId, 
                question_number: currentQ.question_number,
                status: newStatus, 
                selected_option_index: selectedOption, 
                timeTaken: timeElapsed,
            });
        }
    };
    
    // Toggles a question's status between 'unanswered' and 'marked_for_review'
    const handleMarkForReview = () => {
        const currentQ = questions[currentQuestionIndex];
        const newStatus = currentAnswer.status === 'marked_for_review' ? 'unanswered' : 'marked_for_review';
        const updatedAnswers = [...practiceAttempt.answers];
        updatedAnswers[currentQuestionIndex] = { ...updatedAnswers[currentQuestionIndex], status: newStatus };
        setPracticeAttempt({ ...practiceAttempt, answers: updatedAnswers });
        if (socket) {
             socket.emit('practice_mark_for_review', {
                attemptId, question_number: currentQ.question_number, status: newStatus,
            });
        }
    };

    // Finishes the session and navigates to the results page
    const handleFinishPractice = async () => {
        if (window.confirm("Are you sure you want to finish this practice session?")) {
            const timeElapsed = timeOnQuestion - practiceAttempt.answers[currentQuestionIndex].timeTaken;
            sendTimeUpdate(timeElapsed);
            try {
                const token = localStorage.getItem('authToken');
                await fetch(`http://localhost:5000/api/practice/attempt/${attemptId}/finish`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate(`/utilities/practice/results/${attemptId}`);
            } catch (error) { console.error("Error finishing practice:", error); }
        }
    };

    // --- Render Logic ---

    if (isLoading || !practiceAttempt || questions.length === 0) {
        return <div className="page-container">Loading Practice Session...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = Number(currentQuestion.correct_answer) - 1;

    return (
        <>
            <ExplanationModal 
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                explanation={currentQuestion.explanation}
            />
            <div className="practice-command-center">
                {/* Top Header Bar */}
                <header className="practice-header-bar">
                    <h3>{practiceAttempt.practiceTestCollection.replace(/_/g, ' ')}</h3>
                    <div className="practice-progress">
                        <span>{stats.percentage.toFixed(0)}%</span>
                        <progress value={stats.attempted} max={questions.length}></progress>
                    </div>
                    <button onClick={handleFinishPractice} className="button-modern-pink">Finish Practice</button>
                </header>
                
                {/* Main Content Area */}
                <main className="practice-main-content">
                    {/* Left Panel: Question and Options */}
                    <section className="practice-question-panel">
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
                        <p className="question-text" style={{ fontSize: `${fontSize}rem` }}>
                            {currentQuestion.question}
                        </p>
                        <div className="options-container" style={{ fontSize: `${fontSize}rem` }}>
                             {currentQuestion.options.map((option, index) => (
                                <div key={index} className={`option-item 
                                    ${isAnswerChecked && index === correctAnswerIndex ? 'correct' : ''} 
                                    ${isAnswerChecked && index === selectedOption && index !== correctAnswerIndex ? 'incorrect' : ''}`}
                                >
                                    <input type="radio" id={`option-${index}`} name={`q-${currentQuestion.question_number}`} value={index} checked={selectedOption === index} onChange={() => setSelectedOption(index)} disabled={isAnswerChecked}/>
                                    <label htmlFor={`option-${index}`}>{option}</label>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Right Sidebar: Stats, Timer, and Palette */}
                    <PalettePanel 
                        questions={questions}
                        answers={practiceAttempt.answers}
                        currentIndex={currentQuestionIndex}
                        onQuestionSelect={navigateToQuestion}
                        timeOnQuestion={timeOnQuestion}
                    />
                </main>

                {/* Sticky Footer Action Bar */}
                <footer className="practice-footer-bar">
                    <button onClick={handleMarkForReview} className={`button-secondary ${currentAnswer.status === 'marked_for_review' ? 'active' : ''}`}>
                        Mark for Review
                    </button>
                    <div className="footer-right-group">
                        <button onClick={() => setIsModalOpen(true)} className="button-secondary">Explanation</button>
                        <button onClick={handleCheckAnswer} disabled={isAnswerChecked || selectedOption === null} className="button-modern-green">Check Answer</button>
                        <button onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>&larr; Previous</button>
                        <button onClick={() => navigateToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === questions.length - 1}>Next &rarr;</button>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default PracticePage;
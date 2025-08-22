// src/pages/ResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:5000`;

function ResultsPage() {
    const { attemptId } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const attemptRes = await fetch(`${API_BASE}/api/exam-attempt/${attemptId}`);
                const attemptData = await attemptRes.json();
                setAttempt(attemptData);

                if (attemptData.examCollectionName) {
                    const questionsRes = await fetch(`${API_BASE}/api/exam-questions/${attemptData.examCollectionName}`);
                    const questionsData = await questionsRes.json();
                    setQuestions(questionsData);
                }
            } catch (error) {
                console.error("Failed to fetch results data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [attemptId]);

    if (isLoading || !attempt || questions.length === 0 || !attempt.examSession) {
        return <div className="page-container">Loading Results...</div>;
    }

    // Calculate stats with corrected logic
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    attempt.answers.forEach(answer => {
        if (answer.status === 'answered') {
            const question = questions.find(q => q.question_number === answer.question_number);
            const userAnswerAsString = String(answer.selected_option_index + 1);
            if (question && userAnswerAsString === question.correct_answer) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        } else {
            unansweredCount++;
        }
    });

    // New calculations for time taken
    const timeTaken = attempt.submittedAt && attempt.startTime ? new Date(attempt.submittedAt) - new Date(attempt.startTime) : 0;
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
    };

    // Use dynamic scoring from the populated session data
    const { maxMarks, totalQuestions, negativeMarking } = attempt.examSession;
    const marksPerCorrectAnswer = totalQuestions > 0 ? maxMarks / totalQuestions : 0;
    const totalScore = (correctCount * marksPerCorrectAnswer) - (incorrectCount * negativeMarking);

    // Also, display the score from the backend for consistency
    const storedScore = attempt.finalScore;

    return (
        <div className="page-container">
            <div className="results-header">
                <div className="results-header-info">
                    <h1>{attempt.examCollectionName}</h1>
                    <p>Submitted by: {attempt.username}</p>
                    <p class="time-taken"><strong>Time Taken:</strong> {formatTime(timeTaken)}</p>
                </div>
                <div className="results-header-stats">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Correct</span>
                            <span className="stat-value" style={{ color: 'green' }}>{correctCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Incorrect</span>
                            <span className="stat-value" style={{ color: 'red' }}>{incorrectCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Unanswered</span>
                            <span className="stat-value" style={{ color: 'gray' }}>{unansweredCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Score</span>
                            <span className="stat-value" style={{ color: 'blue' }}>{parseFloat(storedScore).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="detailed-results">
                {questions.map(question => {
                    const userAnswer = attempt.answers.find(a => a.question_number === question.question_number);
                    const isCorrect = userAnswer?.status === 'answered' && String(userAnswer.selected_option_index + 1) === question.correct_answer;
                    const resultClass = userAnswer?.status === 'answered' ? (isCorrect ? 'correct-answer' : 'incorrect-answer') : 'unanswered-question';
                    const correctAnswerIndex = Number(question.correct_answer) - 1;

                    const getBadgeInfo = (status) => {
                        if (status === 'correct-answer') return { text: 'Correct', className: 'correct' };
                        if (status === 'incorrect-answer') return { text: 'Incorrect', className: 'incorrect' };
                        return { text: 'Unanswered', className: 'unanswered' };
                    };

                    const badgeInfo = getBadgeInfo(resultClass);

                    return (
                        <div key={question.question_number} className={`result-item ${resultClass}`}>
                            <div className="result-item-header">
                                <h4 className="result-question-text">Q{question.question_number}: {question.question}</h4>
                                <span className={`result-badge ${badgeInfo.className}`}>{badgeInfo.text}</span>
                            </div>
                            <div className="result-item-body">
                                <p><strong>Your Answer:</strong> {userAnswer?.selected_option_index !== null && userAnswer.selected_option_index < question.options.length ? question.options[userAnswer.selected_option_index] : 'Not Answered'}</p>
                                <p><strong>Correct Answer:</strong> {question.options[correctAnswerIndex]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ResultsPage;

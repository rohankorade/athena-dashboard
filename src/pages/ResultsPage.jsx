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

    if (isLoading || !attempt || questions.length === 0) {
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

    return (
        <div className="page-container" style={{padding: '2rem'}}>
            <div className="results-header">
                <div className="results-header-info">
                    <h1>{attempt.examCollectionName}</h1>
                    <p>Submitted by: {attempt.username}</p>
                </div>
                <div className="results-header-stats">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Total Score</span>
                            <span className="stat-value">{attempt.finalScore}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Correct</span>
                            <span className="stat-value" style={{ color: 'var(--success-green, #28a745)' }}>{correctCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Incorrect</span>
                            <span className="stat-value" style={{ color: 'var(--danger-red, #dc3545)' }}>{incorrectCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Unanswered</span>
                            <span className="stat-value">{unansweredCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="detailed-results">
                {questions.map(question => {
                    const userAnswer = attempt.answers.find(a => a.question_number === question.question_number);
                    // Corrected logic for checking the answer
                    const isCorrect = userAnswer?.status === 'answered' && String(userAnswer.selected_option_index + 1) === question.correct_answer;
                    const resultClass = userAnswer?.status === 'answered' ? (isCorrect ? 'correct-answer' : 'incorrect-answer') : 'unanswered-question';
                    // Corrected logic for displaying the correct answer index
                    const correctAnswerIndex = Number(question.correct_answer) - 1;

                    return (
                        <div key={question.question_number} className={`result-item ${resultClass}`} style={{marginBottom: '1.5rem', border: '1px solid #ddd', padding: '1rem'}}>
                            <h4 className="result-question-text">Q{question.question_number}: {question.question}</h4>
                            <p><strong>Your Answer:</strong> {userAnswer?.selected_option_index !== null ? question.options[userAnswer.selected_option_index] : 'Not Answered'}</p>
                            {userAnswer?.status === 'answered' && !isCorrect && (
                                <p><strong>Correct Answer:</strong> {question.options[correctAnswerIndex]}</p>
                            )}
                            {/* You could add an 'explanation' field to your question model and display it here */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ResultsPage;

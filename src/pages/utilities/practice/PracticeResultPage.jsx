// src/pages/utilities/practice/PracticeResultPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// --- MODIFIED HELPER COMPONENT ---
function ExplanationContent({ explanation }) {
    const isImage = explanation && /\.(jpeg|jpg|gif|png)$/.test(explanation);
    const API_BASE = `http://${window.location.hostname}:5000`; // Define the base URL

    if (!explanation) {
        return <p>No explanation available.</p>;
    }
    if (isImage) {
        // --- MODIFIED LINE ---
        return <img src={`${API_BASE}/${explanation}`} alt="Explanation" style={{ maxWidth: '100%', height: 'auto', marginTop: '0.5rem' }} />;
    }
    return <p>{explanation}</p>;
}


function PracticeResultPage() {
    // ... the rest of the component remains the same
    const { attemptId } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                const attemptRes = await fetch(`http://localhost:5000/api/practice/attempt/${attemptId}`, { headers });
                const attemptData = await attemptRes.json();
                setAttempt(attemptData);

                const questionsRes = await fetch(`http://localhost:5000/api/practice/questions/${attemptData.practiceTestCollection}`, { headers });
                const questionsData = await questionsRes.json();
                setQuestions(questionsData);
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

    const correctCount = attempt.answers.filter(a => a.status === 'correct').length;
    const incorrectCount = attempt.answers.filter(a => a.status === 'incorrect').length;
    const unansweredCount = attempt.answers.filter(a => a.status === 'unanswered').length;
    const totalTime = attempt.answers.reduce((acc, a) => acc + a.timeTaken, 0);
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="page-container">
            <div className="results-header">
                <div className="results-header-info">
                    <h1>Practice Results: {attempt.practiceTestCollection.replace(/_/g, ' ')}</h1>
                    <p className="time-taken"><strong>Total Time:</strong> {formatTime(totalTime)}</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-item"><span className="stat-label">Correct</span><span className="stat-value" style={{ color: '#28a745' }}>{correctCount}</span></div>
                    <div className="stat-item"><span className="stat-label">Incorrect</span><span className="stat-value" style={{ color: '#dc3545' }}>{incorrectCount}</span></div>
                    <div className="stat-item"><span className="stat-label">Unanswered</span><span className="stat-value" style={{ color: '#6c757d' }}>{unansweredCount}</span></div>
                </div>
            </div>

            <div className="detailed-results">
                {questions.map(question => {
                    const userAnswer = attempt.answers.find(a => a.question_number === question.question_number);
                    const correctAnswerIndex = Number(question.correct_answer) - 1;

                    return (
                        <div key={question.question_number} className="result-item">
                            <div className="result-item-header">
                                <h4 className="result-question-text">Q{question.question_number}: {question.question}</h4>
                                <span className={`result-badge practice-${userAnswer.status}`}>{userAnswer.status}</span>
                            </div>
                            <div className="result-item-body">
                                <p><strong>Your Answer:</strong> {userAnswer.selected_option_index !== null ? question.options[userAnswer.selected_option_index] : 'Not Answered'}</p>
                                <p><strong>Correct Answer:</strong> {question.options[correctAnswerIndex]}</p>
                                <p><strong>Time Taken:</strong> {formatTime(userAnswer.timeTaken)}</p>
                                <details className="explanation-details">
                                    <summary>Show Explanation</summary>
                                    <ExplanationContent explanation={question.explanation} />
                                </details>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PracticeResultPage;
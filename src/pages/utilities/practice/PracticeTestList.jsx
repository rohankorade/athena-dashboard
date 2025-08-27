// src/pages/utilities/practice/PracticeTestList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PracticeTestList() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ... (useEffect remains the same)
    const fetchTests = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/practice/tests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTests(data);
        } else {
          console.error("Failed to fetch practice tests");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, []);

  // --- MODIFIED FUNCTION ---
  const handleStartPractice = async (testName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/practice/create-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: 'Rohan', // Hardcoded for now as it's a single-user app
          collectionName: testName 
        }),
      });

      if (response.ok) {
        const newAttempt = await response.json();
        // Navigate to the new practice page with the unique attempt ID
        navigate(`/utilities/practice/attempt/${newAttempt._id}`);
      } else {
        console.error("Failed to create practice attempt");
      }
    } catch (error) {
      console.error("Error starting practice session:", error);
    }
  };

  if (isLoading) {
    // ... (loading state remains the same)
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Practice Mode</h1>
        </div>
        <p>Loading available tests...</p>
      </div>
    );
  }

  return (
    // ... (return JSX remains the same)
    <div className="page-container">
      <div className="page-header">
        <h1>Practice Mode</h1>
        <p>Select a test to begin your practice session.</p>
      </div>
      <div className="session-list">
        {tests.length > 0 ? (
          tests.map(testName => (
            <div key={testName} className="session-card">
              <div className="session-card-header" style={{ alignItems: 'center' }}>
                <h3>{testName.replace(/_/g, ' ')}</h3>
                <button 
                  onClick={() => handleStartPractice(testName)}
                  className="button-action-primary"
                >
                  Start Practice
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No practice tests found in the database.</p>
        )}
      </div>
    </div>
  );
}

export default PracticeTestList;
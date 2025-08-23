// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_BASE = `http://${window.location.hostname}:5000`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('authToken', token); // Store the token
        navigate('/'); // Redirect to the main dashboard
      } else {
        const { message } = await response.json();
        setError(message || 'Failed to log in.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="centered-card-container">
        <div className="setup-card">
          <h2>Athena Dashboard Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group-vertical">
              <label htmlFor="auth-key">Authentication Key</label>
              <input
                id="auth-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoFocus
                required
              />
              {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
            </div>
            <div className="setup-actions">
              <button type="submit" className="button-action-primary">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
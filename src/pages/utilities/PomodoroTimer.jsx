import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SettingsModal from '../../components/SettingsModal';
import PomodoroTodoList from '../../components/PomodoroTodoList';
import './PomodoroTimer.css';

// Helper to format time
const formatTime = (time) => String(time).padStart(2, '0');

// Audio alert - assuming the file is in /public
const alertSound = new Audio('/alert.mp3');

function PomodoroTimer() {
  // State for timer settings, fetched from backend
  const [settings, setSettings] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsPerLongBreak: 4,
  });

  // Core timer state
  const [minutes, setMinutes] = useState(settings.workMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Session tracking state
  const [sessionType, setSessionType] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0); // Completed work sessions

  // Modal state
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  // --- Effects ---

  // 1. Fetch settings from the backend on initial load
  useEffect(() => {
    axios.get('/api/pomodoro/settings')
      .then(res => {
        setSettings(res.data);
        setMinutes(res.data.workMinutes); // Initialize timer with fetched work minutes
      })
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  // 2. Request notification permission on initial load
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // 3. The main timer logic
  useEffect(() => {
    let interval = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (isActive && minutes === 0 && seconds === 0) {
      // Session finished
      alertSound.play();
      showNotification(`${sessionType.charAt(0).toUpperCase() + sessionType.slice(1).replace('B', ' B')} session finished!`);

      // Log the completed session
      axios.post('/api/pomodoro/sessions', {
        sessionType: sessionType,
        duration: settings[`${sessionType}Minutes`],
      }).catch(err => console.error("Error logging session:", err));

      // Determine the next session
      if (sessionType === 'work') {
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);
        if (newSessionCount % settings.sessionsPerLongBreak === 0) {
          setSessionType('longBreak');
        } else {
          setSessionType('shortBreak');
        }
      } else { // If it was a short or long break
        setSessionType('work');
      }
      setIsActive(false); // Pause timer
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, sessionType, sessionCount, settings]);


  // 4. Update timer display when sessionType or settings change
  useEffect(() => {
    // We only want to reset the timer if it's NOT active.
    // This prevents the timer from resetting if settings are changed mid-session.
    if (!isActive) {
        switch (sessionType) {
            case 'work':
                setMinutes(settings.workMinutes);
                break;
            case 'shortBreak':
                setMinutes(settings.shortBreakMinutes);
                break;
            case 'longBreak':
                setMinutes(settings.longBreakMinutes);
                break;
            default:
                setMinutes(settings.workMinutes);
        }
        setSeconds(0);
    }
  }, [sessionType, settings]);


  // --- Helper Functions ---

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message);
    }
  };

  // --- Event Handlers ---

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    // Resets to the current session type's default time
    switch (sessionType) {
        case 'work':
            setMinutes(settings.workMinutes);
            break;
        case 'shortBreak':
            setMinutes(settings.shortBreakMinutes);
            break;
        case 'longBreak':
            setMinutes(settings.longBreakMinutes);
            break;
        default:
            setMinutes(settings.workMinutes);
    }
    setSeconds(0);
  };

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
  };

  // --- UI ---

  const getSessionIndicatorText = () => {
      switch (sessionType) {
          case 'work':
              return 'Work';
          case 'shortBreak':
              return 'Short Break';
          case 'longBreak':
              return 'Long Break';
          default:
              return 'Ready?';
      }
  }

  return (
    <div className="pomodoro-page-container">
      <div className="page-header">
        <h1>Pomodoro Timer</h1>
        <p>Work Session: {sessionCount % settings.sessionsPerLongBreak} / {settings.sessionsPerLongBreak}</p>
      </div>
      <div className="pomodoro-container">
        <div className="session-indicator">
          {getSessionIndicatorText()}
        </div>
        <div className="timer-display">
          {formatTime(minutes)}:{formatTime(seconds)}
        </div>
        <div className="timer-controls">
          <button onClick={handleStartPause} className="button button-primary timer-button">
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button onClick={handleReset} className="button button-secondary timer-button">
            Reset
          </button>
          <button onClick={() => setSettingsModalOpen(true)} className="button button-secondary timer-button">
            Settings
          </button>
          <Link to="/utilities/pomodoro-stats" className="button button-secondary timer-button">
            Stats
          </Link>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onRequestClose={() => setSettingsModalOpen(false)}
        currentSettings={settings}
        onSettingsSave={handleSettingsSave}
      />
      <PomodoroTodoList />
    </div>
  );
}

export default PomodoroTimer;
// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx'
import './index.css'
import './App.css'

// Import our new page components
import DashboardHome from './pages/DashboardHome.jsx';
import CSP from './pages/CSP.jsx';
import Editorials from './pages/Editorials.jsx';
import GeneralStudies from './pages/GeneralStudies.jsx';
import Sociology from './pages/Sociology.jsx';
import AnswerWriting from './pages/AnswerWriting.jsx';

// Note view component for viewing individual notes
import NoteView from './pages/NoteView.jsx';

//Utilities
import ParticipantLayout from './components/ParticipantLayout.jsx';
import Utilities from './pages/Utilities.jsx';
import PomodoroTimer from './pages/utilities/PomodoroTimer.jsx';
import AdminSetup from './pages/utilities/AdminSetup.jsx';
import JoinLobby from './pages/utilities/JoinLobby.jsx';
import LobbyView from './pages/utilities/LobbyView.jsx';
import ExamPage from './pages/ExamPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import SessionListPage from './pages/utilities/SessionListPage.jsx';
import SessionAttemptsPage from './pages/utilities/SessionAttemptsPage.jsx';
import RealTimeAnalysisPage from './pages/utilities/RealTimeAnalysisPage.jsx';
import PomodoroStats from './pages/utilities/PomodoroStats.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- Public, Self-Contained Routes --- */}
        {/* These routes are wrapped in a minimal layout to provide a consistent full-screen background */}
        <Route element={<ParticipantLayout />}>
          <Route path="/join" element={<JoinLobby />} />
          <Route path="/local-mock/lobby/:sessionId" element={<LobbyView />} />
          <Route path="/exam/:attemptId" element={<ExamPage />} />
          <Route path="/results/:attemptId" element={<ResultsPage />} />
        </Route>


        {/* --- Main Application Routes (with Layout) --- */}
        {/* App component is the parent layout for all nested routes */}
        <Route path="/" element={<App />}>
          {/* Child pages that will render inside App's <Outlet> */}
          <Route index element={<DashboardHome />} />
          <Route path="csp" element={<CSP />} />
          <Route path="editorials" element={<Editorials />} />
          <Route path="editorials/view/:noteId" element={<NoteView />} />
          <Route path="general-studies" element={<GeneralStudies />} />
          <Route path="sociology" element={<Sociology />} />
          <Route path="answer-writing" element={<AnswerWriting />} />

          {/* Nested routes for utilities, visible within the main app layout */}
          <Route path="utilities" element={<Utilities />} />
          <Route path="utilities/pomodoro-timer" element={<PomodoroTimer />} />
          <Route path="utilities/pomodoro-stats" element={<PomodoroStats />} />
          <Route path="utilities/local-mock/setup" element={<AdminSetup />} />
          <Route path="utilities/local-mock/join" element={<JoinLobby />} />
          {/* This route is for the admin to view the lobby within the dashboard */}
          <Route path="utilities/local-mock/lobby/:sessionId" element={<LobbyView />} />
          <Route path="utilities/sessions" element={<SessionListPage />} />
          <Route path="utilities/sessions/:sessionId" element={<SessionAttemptsPage />} />
          <Route path="utilities/sessions/:sessionId/attempts/:attemptId" element={<RealTimeAnalysisPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
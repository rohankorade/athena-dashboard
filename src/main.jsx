// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext.jsx';
import App from './App.jsx';
import './index.css';
import './App.css';

// Import our new page components
import DashboardHome from './pages/DashboardHome.jsx';
import CSP from './pages/CSP.jsx';
import Editorials from './pages/Editorials.jsx';
import GeneralStudies from './pages/GeneralStudies.jsx';
import Sociology from './pages/Sociology.jsx';
import AnswerWriting from './pages/AnswerWriting.jsx';
import NoteView from './pages/NoteView.jsx';
import PlayerPage from './pages/PlayerPage.jsx';

// Utilities
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
import PracticeTestList from './pages/utilities/practice/PracticeTestList.jsx';
import PracticePage from './pages/utilities/practice/PracticePage.jsx';
import PracticeResultPage from './pages/utilities/practice/PracticeResultPage.jsx';
import StashBrowserPage from './pages/utilities/StashBrowserPage.jsx';
import StashCollectionPage from './pages/utilities/StashCollectionPage.jsx';

// Authentication
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* --- Public, Self-Contained Routes --- */}
          <Route element={<ParticipantLayout />}>
            <Route path="/join" element={<JoinLobby />} />
            <Route path="/local-mock/lobby/:sessionId" element={<LobbyView />} />
            <Route path="/exam/:attemptId" element={<ExamPage />} />
            <Route path="/results/:attemptId" element={<ResultsPage />} />
            <Route path="/player" element={<PlayerPage />} />
          </Route>

          {/* --- Login Route (Public) --- */}
          <Route path="/login" element={<LoginPage />} />

          {/* --- Main Protected Application Routes --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />}>
              {/* Child pages that will render inside App's <Outlet> */}
              <Route index element={<DashboardHome />} />
              <Route path="csp" element={<CSP />} />
              <Route path="editorials" element={<Editorials />} />
              <Route path="editorials/view/:noteId" element={<NoteView />} />
              <Route path="general-studies" element={<GeneralStudies />} />
              <Route path="sociology" element={<Sociology />} />
              <Route path="answer-writing" element={<AnswerWriting />} />
              {/* Nested routes for utilities */}
              <Route path="utilities" element={<Utilities />} />
              <Route path="utilities/practice" element={<PracticeTestList />} />
              <Route path="utilities/practice/attempt/:attemptId" element={<PracticePage />} />
              <Route path="utilities/practice/results/:attemptId" element={<PracticeResultPage />} />
              <Route path="utilities/pomodoro-timer" element={<PomodoroTimer />} />
              <Route path="utilities/local-mock/setup" element={<AdminSetup />} />
              <Route path="utilities/local-mock/join" element={<JoinLobby />} />
              <Route path="utilities/local-mock/lobby/:sessionId" element={<LobbyView />} />
              <Route path="utilities/sessions" element={<SessionListPage />} />
              <Route path="utilities/sessions/:sessionId" element={<SessionAttemptsPage />} />
              <Route path="utilities/sessions/:sessionId/attempts/:attemptId" element={<RealTimeAnalysisPage />} />
              <Route path="utilities/stash" element={<StashBrowserPage />} />
              <Route path="utilities/stash/:collectionName" element={<StashCollectionPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  </React.StrictMode>,
)
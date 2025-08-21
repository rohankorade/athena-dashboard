// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx'
import './index.css'

// Import our new page components
import DashboardHome from './pages/DashboardHome.jsx';
import CSP from './pages/CSP.jsx';
import Editorials from './pages/Editorials.jsx';
import GeneralStudies from './pages/GeneralStudies.jsx';
import Sociology from './pages/Sociology.jsx';
import AnswerWriting from './pages/AnswerWriting.jsx';
import Utilities from './pages/Utilities.jsx';
import NoteView from './pages/NoteView.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App component is the parent layout */}
        <Route path="/" element={<App />}>
          {/* Child pages that will render inside App's <Outlet> */}
          <Route index element={<DashboardHome />} />
          <Route path="csp" element={<CSP />} />
          <Route path="editorials" element={<Editorials />} />
          <Route path="editorials/view/:noteId" element={<NoteView />} />
          <Route path="general-studies" element={<GeneralStudies />} />
          <Route path="sociology" element={<Sociology />} />
          <Route path="answer-writing" element={<AnswerWriting />} />
          <Route path="utilities" element={<Utilities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
// src/pages/Editorials.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NoteListItem from '../components/NoteListItem';
import StatsDashboard from '../components/StatsDashboard';
import NextToRead from '../components/NextToRead';
import PillInput from '../components/PillInput';

// Month names for display
const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Editorials() {
  const [dateTree, setDateTree] = useState({});
  const [notes, setNotes] = useState([]);

  // State for the drill-down navigation
  const [viewLevel, setViewLevel] = useState('years');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextToRead, setNextToRead] = useState(null);

  // --- State for Search Mode ---
  const [searchTerms, setSearchTerms] = useState([]);
  const [searchMode, setSearchMode] = useState('OR');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const fetchDashboardData = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch Stats
    fetch('http://localhost:5000/api/editorials/stats', { headers })
      .then(res => res.json())
      .then(data => setStats(data));
      
    // Fetch Next to Read
    fetch('http://localhost:5000/api/editorials/next-to-read', { headers })
      .then(res => res.json())
      .then(data => setNextToRead(data));
  };

  // Fetch the initial date tree on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch('http://localhost:5000/api/editorials/dates', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const treeObject = data.reduce((acc, yearData) => {
          acc[yearData._id] = yearData.months.reduce((monthAcc, monthData) => {
            monthAcc[monthData.month] = monthData.days.sort((a, b) => a - b);
            return monthAcc;
          }, {});
          return acc;
        }, {});
        setDateTree(treeObject);
      });
    fetchDashboardData();
  }, []);

  // Fetch notes for the selected day
  useEffect(() => {
    if (selectedDate) {
      const { year, month, day } = selectedDate;
      const token = localStorage.getItem('authToken');
      fetch(`http://localhost:5000/api/editorials/by-date?year=${year}&month=${month}&day=${day}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setNotes(data));
    } else {
      setNotes([]);
    }
  }, [selectedDate]);

  // Handler for the "Mark as Read/Unread" toggle
  const toggleReadStatus = async (id, newStatus) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:5000/api/editorials/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isRead: newStatus }),
    });
    if (response.ok) {
        const updatedNote = await response.json();
        setNotes(notes.map(n => n._id === id ? updatedNote : n));
        fetchDashboardData();
    }
  };
  
  // --- Navigation Handlers ---
  const selectYear = (year) => { setSelectedYear(year); setViewLevel('months'); };
  const selectMonth = (month) => { setSelectedMonth(month); setViewLevel('days'); };
  const goBackToYears = () => { setViewLevel('years'); setSelectedYear(null); setSelectedMonth(null); setSelectedDate(null);};
  const goBackToMonths = () => { setViewLevel('months'); setSelectedMonth(null); };

  // --- Render Functions for each level ---
  const renderYears = () => Object.keys(dateTree).map(year => <li key={year} onClick={() => selectYear(year)}>{year}</li>);
  const renderMonths = () => Object.keys(dateTree[selectedYear]).map(month => <li key={month} onClick={() => selectMonth(month)}>{MONTH_NAMES[month]}</li>);
  const renderDays = () => dateTree[selectedYear][selectedMonth].map(day => (
    <li 
      key={day} 
      onClick={() => setSelectedDate({ year: selectedYear, month: selectedMonth, day: day })}
      className={selectedDate?.day === day ? 'active-day' : ''}
    >
      {day}
    </li>
  ));

  // --- Search Handlers ---
  const handleSearch = async () => {
    if (searchTerms.length === 0) return;
    setIsSearching(true);
    const termsQuery = searchTerms.join(',');
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`http://localhost:5000/api/editorials/search?terms=${termsQuery}&mode=${searchMode}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setSearchResults(data);
  };

  const clearSearch = () => {
    setIsSearching(false);
    setSearchTerms([]);
    setSearchResults([]);
  };

  return (
    <div className="page-container">
      <div className="page-header search-header">
        <PillInput terms={searchTerms} setTerms={setSearchTerms} />
        <div className="search-controls">
          <div className="search-mode-selector">
            <label><input type="radio" value="OR" checked={searchMode === 'OR'} onChange={() => setSearchMode('OR')} /> Match ANY (OR)</label>
            <label><input type="radio" value="AND" checked={searchMode === 'AND'} onChange={() => setSearchMode('AND')} /> Match ALL (AND)</label>
          </div>
          <button onClick={handleSearch} className="button button-primary">Search</button>
          {isSearching && <button onClick={clearSearch} className="button button-secondary">Clear</button>}
        </div>
      </div>
      <div className="page-content">
        {isSearching ? (
          <main className="right-column full-width">
            <h3>Search Results ({searchResults.length})</h3>
            {searchResults.map(note => <NoteListItem key={note._id} note={note} onToggleRead={toggleReadStatus} />)}
          </main>
        ) : (
          <>
            <aside className="left-column">
              <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={goBackToYears}>🏠</span>
                {selectedYear && <span>&nbsp;&gt;&nbsp;<span className="breadcrumb-link" onClick={goBackToMonths}>{selectedYear}</span></span>}
                {selectedMonth && <span>&nbsp;&gt;&nbsp;{MONTH_NAMES[selectedMonth]}</span>}
              </div>
              <ul className="drill-down-list">
                {viewLevel === 'years' && renderYears()}
                {viewLevel === 'months' && selectedYear && renderMonths()}
                {viewLevel === 'days' && selectedMonth && renderDays()}
              </ul>
              <Link to="/" className="button button-secondary back-button">
                Back to Dashboard
              </Link>
            </aside>
            <main className="right-column">
              {selectedDate && (
                <h3 className="right-column-header">
                  {`${selectedDate.day} ${MONTH_NAMES[selectedDate.month]} ${selectedDate.year}`}
                </h3>
              )}
              {notes.length > 0 ? (
                notes.map(note => <NoteListItem key={note._id} note={note} onToggleRead={toggleReadStatus} />)
              ) : (
                <div className="dashboard-view">
                  <StatsDashboard stats={stats} />
                  <NextToRead note={nextToRead} onToggleRead={toggleReadStatus} />
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default Editorials;
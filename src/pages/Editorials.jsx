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
  const [viewLevel, setViewLevel] = useState('years'); // 'years', 'months', or 'days'
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextToRead, setNextToRead] = useState(null);

  // --- State for Search Mode ---
  const [searchTerms, setSearchTerms] = useState([]);
  const [searchMode, setSearchMode] = useState('OR'); // 'OR' or 'AND'
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const fetchDashboardData = () => {
    // Fetch Stats
    fetch('http://localhost:5000/api/editorials/stats')
      .then(res => res.json())
      .then(data => setStats(data));
    // Fetch Next to Read
    fetch('http://localhost:5000/api/editorials/next-to-read')
      .then(res => res.json())
      .then(data => setNextToRead(data));
  };

  // Fetch the initial date tree on component mount
  useEffect(() => {
    fetch('http://localhost:5000/api/editorials/dates')
      .then(res => res.json())
      .then(data => {
        // Convert the API's array response into a more easily searchable object
        const treeObject = data.reduce((acc, yearData) => {
          acc[yearData._id] = yearData.months.reduce((monthAcc, monthData) => {
            monthAcc[monthData.month] = monthData.days.sort((a, b) => a - b);
            return monthAcc;
          }, {});
          return acc;
        }, {});
        setDateTree(treeObject);
      });
    // Fetch all dashboard data
    fetchDashboardData();
  }, []);

  // Handler for selecting a day to fetch notes
  const handleDaySelect = (day) => {
    setSelectedDate({ year: selectedYear, month: selectedMonth, day: day });
  };

  // This useEffect hook runs EVERY TIME 'selectedDate' changes,
  // triggering the network call to fetch the notes for that day.
  useEffect(() => {
    if (selectedDate) {
      const { year, month, day } = selectedDate;
      fetch(`http://localhost:5000/api/editorials/by-date?year=${year}&month=${month}&day=${day}`)
        .then(res => res.json())
        .then(data => setNotes(data));
    } else {
      setNotes([]); // Clear notes if no date is selected
    }
  }, [selectedDate]); // The dependency array ensures this runs when 'selectedDate' changes

  // Handler for the "Mark as Read/Unread" toggle
  const toggleReadStatus = async (id, newStatus) => {
    const response = await fetch(`http://localhost:5000/api/editorials/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: newStatus }),
    });
    if (response.ok) {
        const updatedNote = await response.json();
        setNotes(notes.map(n => n._id === id ? updatedNote : n));
        fetchDashboardData(); // Refresh stats and next-to-read
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
      onClick={() => handleDaySelect(day)}
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
    console.log("Searching for terms:", termsQuery, "with mode:", searchMode); // Log the search terms and mode
    // Make the API call to search editorials
    const response = await fetch(`http://localhost:5000/api/editorials/search?terms=${termsQuery}&mode=${searchMode}`);
    const data = await response.json();
    console.log("Received search data:", data); // Log the received data
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
            {searchResults.map(note => <NoteListItem key={note._id} note={note} onToggleRead={() => {}} />)}
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
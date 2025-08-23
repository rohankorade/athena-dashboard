// src/components/Performance.jsx

import React, { useState, useEffect } from 'react';
import AddSeriesModal from './AddSeriesModal';
import AddTestModal from './AddTestModal'; // Import modals
import PerformanceChart from './PerformanceChart'; // Import chart
import PerformanceList from './PerformanceList'; // Import list

function Performance() {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for our two modals
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Fetch all test series
  const fetchSeries = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/test-series', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSeriesList(data);
      // If a series isn't selected yet, default to the first one
      if (data.length > 0 && !selectedSeries) {
        setSelectedSeries(data[0]._id);
      }
    } catch (error) { console.error("Failed to fetch test series:", error); }
  };

  // Fetch tests for the currently selected series
  const fetchTests = async () => {
    if (!selectedSeries) return;
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/tests/${selectedSeries}`, {
        headers: {
          // Add the Authorization header
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTests(data);
    } catch (error) { console.error("Failed to fetch tests:", error); }
  };

  // Initial fetch for the series list
  useEffect(() => {
    setIsLoading(true);
    fetchSeries().finally(() => setIsLoading(false));
  }, []);

  // Refetch tests whenever the selected series changes
  useEffect(() => {
    fetchTests();
  }, [selectedSeries]);


  // Handle loading state
  if (isLoading) {
    return <div>Loading performance data...</div>;
  }
  
  // --- RENDER LOGIC ---

  return (
    <>
      <AddSeriesModal isOpen={isSeriesModalOpen} onRequestClose={() => setIsSeriesModalOpen(false)} onSeriesAdded={fetchSeries} />
      {seriesList.length > 0 && (
        <AddTestModal isOpen={isTestModalOpen} onRequestClose={() => setIsTestModalOpen(false)} onTestAdded={fetchTests} seriesList={seriesList} selectedSeries={selectedSeries} />
      )}

      <div className="performance-header">
        {seriesList.length > 0 ? (
          <select value={selectedSeries} onChange={e => setSelectedSeries(e.target.value)}>
            {seriesList.map(series => (<option key={series._id} value={series._id}>{series.name}</option>))}
          </select>
        ) : <h4>Performance</h4>}
        <div>
          <button onClick={() => setIsSeriesModalOpen(true)} className="button button-secondary">Add Series</button>
          {seriesList.length > 0 && (
            <button onClick={() => setIsTestModalOpen(true)} className="button button-primary">Add Test Score</button>
          )}
        </div>
      </div>

      <div className="performance-content">
        {seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', width: '100%' }}>
            <h4>No test series found.</h4>
            <p>Click "Add Series" to get started.</p>
          </div>
        ) : isLoading ? (
          <p>Loading tests...</p>
        ) : tests.length > 0 ? (
          <>
            <div className="performance-table-container">
              <PerformanceList data={tests} />
            </div>
            <div className="performance-chart-container">
              <PerformanceChart data={tests} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', width: '100%' }}>
            <h4>No tests found for this series.</h4>
            <p>Click "Add Test Score" to get started.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default Performance;
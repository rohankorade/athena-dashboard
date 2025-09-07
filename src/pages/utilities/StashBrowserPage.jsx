// src/pages/utilities/StashBrowserPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import StashSidebar from '../../components/StashSidebar';
import StashContentArea from '../../components/StashContentArea';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

function StashBrowserPage() {
  const [collections, setCollections] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [contentData, setContentData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async (view, page) => {
    setIsLoading(true);
    setContentData({}); // Clear previous data to prevent flash of old content
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      if (view === 'dashboard') {
        const [statsRes, recentRes] = await Promise.all([
          fetch('http://localhost:5000/api/stash/dashboard/stats', { headers }),
          fetch('http://localhost:5000/api/stash/dashboard/recent', { headers })
        ]);
        setContentData({ stats: await statsRes.json(), recent: await recentRes.json() });
      } else if (view === 'searchResults') {
        const res = await fetch(`http://localhost:5000/api/stash/search?q=${debouncedSearchTerm}`, { headers });
        setContentData({ videos: await res.json() });
      } else {
        const res = await fetch(`http://localhost:5000/api/stash/collections/${view}?page=${page}`, { headers });
        setContentData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      setContentData({ videos: [] }); // Set to empty on error
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchCollections = async () => {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const res = await fetch('http://localhost:5000/api/stash/collections', { headers });
        setCollections(await res.json());
      } catch (error) { console.error("Failed to fetch collections:", error); }
    };
    fetchCollections();
    fetchData('dashboard', 1); // Fetch initial dashboard view
  }, []); // Runs only once on mount

  useEffect(() => {
    if (debouncedSearchTerm) {
      setActiveView('searchResults');
      fetchData('searchResults');
    } else if (searchTerm === '' && activeView === 'searchResults') {
      setActiveView('dashboard');
      fetchData('dashboard');
    }
  }, [debouncedSearchTerm, searchTerm, activeView, fetchData]);

  const handleSelectView = (viewName) => {
    setSearchTerm('');
    setActiveView(viewName);
    setCurrentPage(1);
    fetchData(viewName, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchData(activeView, newPage);
  };

  return (
    <div className="stash-browser-layout">
      <StashSidebar 
        collections={collections}
        activeView={activeView}
        onSelectView={handleSelectView}
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
      />
      <StashContentArea 
        view={activeView}
        data={contentData}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default StashBrowserPage;
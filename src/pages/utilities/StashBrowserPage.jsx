// src/pages/utilities/StashBrowserPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const [contentData, setContentData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // --- NEW: React Router hooks for navigation and URL parameters ---
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract parameters from the URL. The '*' in the route makes them available under the '*' key.
  const routeParams = (params['*'] || '').split('/');
  const [view, collectionName, pageOrAction, pageNumber] = routeParams;

  const currentPage = pageOrAction === 'page' ? parseInt(pageNumber, 10) : 1;
  const searchTerm = view === 'search' ? collectionName : '';

  const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

  // --- MODIFIED: Data fetching is now triggered by URL changes ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setContentData({});
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      if (view === 'dashboard') {
        const [statsRes, recentRes] = await Promise.all([
          fetch('http://localhost:5000/api/stash/dashboard/stats', { headers }),
          fetch('http://localhost:5000/api/stash/dashboard/recent', { headers })
        ]);
        setContentData({ stats: await statsRes.json(), recent: await recentRes.json() });
      } else if (view === 'search' && searchTerm) {
        const res = await fetch(`http://localhost:5000/api/stash/search?q=${searchTerm}`, { headers });
        setContentData({ videos: await res.json() });
      } else if (view) { // This now handles collections
        const res = await fetch(`http://localhost:5000/api/stash/collections/${view}?page=${currentPage}`, { headers });
        setContentData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      setContentData({ videos: [] });
    } finally {
      setIsLoading(false);
    }
  }, [view, collectionName, currentPage, searchTerm]); // Dependencies are now URL params

  // --- Initial data load and redirection ---
  useEffect(() => {
    // If the user lands on the base /stash route, redirect to the dashboard
    if (location.pathname === '/utilities/stash' || location.pathname === '/utilities/stash/') {
        navigate('/utilities/stash/dashboard', { replace: true });
        return;
    }

    const fetchCollections = async () => {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      try {
        const res = await fetch('http://localhost:5000/api/stash/collections', { headers });
        setCollections(await res.json());
      } catch (error) { console.error("Failed to fetch collections:", error); }
    };

    fetchCollections();
    fetchData();
  }, [fetchData, location.pathname, navigate]);

  // --- NEW: Effect to handle search navigation ---
  useEffect(() => {
    if (debouncedSearchTerm) {
      navigate(`/utilities/stash/search/${encodeURIComponent(debouncedSearchTerm)}`);
    }
    // If the search box is cleared while on the search page, go back to dashboard
    else if (!debouncedSearchTerm && view === 'search') {
      navigate('/utilities/stash/dashboard');
    }
  }, [debouncedSearchTerm, navigate, view]);


  return (
    <div className="stash-browser-layout">
      <StashSidebar 
        collections={collections}
        activeView={view === 'search' ? 'search' : view}
        searchTerm={localSearchTerm}
        onSearchChange={(e) => setLocalSearchTerm(e.target.value)}
      />
      <StashContentArea 
        view={view}
        data={contentData}
        isLoading={isLoading}
        collectionName={view} // Pass collectionName for pagination links
      />
    </div>
  );
}

export default StashBrowserPage;
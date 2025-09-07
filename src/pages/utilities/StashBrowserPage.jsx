// src/pages/utilities/StashBrowserPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StashSidebar from '../../components/StashSidebar';
import StashContentArea from '../../components/StashContentArea';
import { preloadAuthenticatedImage } from '../../hooks/useAuthenticatedImage';

// A custom hook for debouncing a function call, not just a value.
// This is more suitable for triggering navigation.
const useDebouncedCallback = (callback, delay) => {
  const callbackRef = React.useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    let handler;
    const debounced = (...args) => {
      clearTimeout(handler);
      handler = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    };
    return debounced;
  }, [delay]);
};


function StashBrowserPage() {
  const [collections, setCollections] = useState([]);
  const [contentData, setContentData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- URL remains the single source of truth for what's displayed ---
  const routeParams = (params['*'] || '').split('/');
  const view = routeParams[0] || 'dashboard';
  let collectionName = null;
  let searchTerm = '';
  let currentPage = 1;

  if (view === 'search') {
    searchTerm = decodeURIComponent(routeParams[1] || '');
    if (routeParams[2] === 'page' && routeParams[3]) {
      currentPage = parseInt(routeParams[3], 10) || 1;
    }
  } else if (view !== 'dashboard') {
    collectionName = view;
    if (routeParams[1] === 'page' && routeParams[2]) {
      currentPage = parseInt(routeParams[2], 10) || 1;
    }
  }
  
  // --- STATE REFACTOR ---
  // `inputValue` now ONLY represents the visual text in the search box.
  const [inputValue, setInputValue] = useState(searchTerm);

  // --- LOGIC REFACTOR ---
  // Create a debounced function that will handle the navigation.
  const debouncedNavigate = useDebouncedCallback((value) => {
    if (value) {
      navigate(`/utilities/stash/search/${encodeURIComponent(value)}/page/1`);
    } else {
      // Only navigate to dashboard if we are coming from a search.
      if (location.pathname.startsWith('/utilities/stash/search')) {
        navigate('/utilities/stash/dashboard');
      }
    }
  }, 500);

  // The new handler for the search input.
  const handleSearchChange = (e) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue); // Update the visual input immediately
    debouncedNavigate(newInputValue.trim()); // Trigger the debounced navigation
  };

  // --- EFFECTS REFACTOR ---
  // Effect 1: Keeps the visual input synced with the URL (for back/forward buttons).
  useEffect(() => {
    // If the URL's search term changes and doesn't match the input box, update the input box.
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm]); // Note: We remove `inputValue` from dependencies to prevent loops.

  // --- Fetching logic can remain the same ---
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
        const res = await fetch(`http://localhost:5000/api/stash/search?q=${searchTerm}&page=${currentPage}`, { headers });
        setContentData(await res.json());
      } else if (collectionName) {
        const res = await fetch(`http://localhost:5000/api/stash/collections/${collectionName}?page=${currentPage}`, { headers });
        setContentData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
      setContentData({ videos: [] });
    } finally {
      setIsLoading(false);
    }
  }, [view, collectionName, searchTerm, currentPage]);

  useEffect(() => {
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

  useEffect(() => {
    if (contentData && contentData.videos && contentData.videos.length > 0) {
      contentData.videos.forEach(video => {
        if (video.scene_preview) {
          const preloadUrl = `/api/stash/image?url=${encodeURIComponent(video.scene_preview)}`;
          preloadAuthenticatedImage(preloadUrl);
        }
      });
    }
  }, [contentData.videos]);

  return (
    <div className="stash-browser-layout">
      <StashSidebar 
        collections={collections}
        searchTerm={inputValue} // The input is controlled by our new state
        onSearchChange={handleSearchChange} // Use the new handler
      />
      <StashContentArea 
        view={view}
        data={contentData}
        isLoading={isLoading}
        collectionName={collectionName}
        searchTerm={searchTerm} // Content rendering always uses the truth from the URL
      />
    </div>
  );
}

export default StashBrowserPage;
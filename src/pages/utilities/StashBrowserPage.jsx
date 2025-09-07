// src/pages/utilities/StashBrowserPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StashSidebar from '../../components/StashSidebar';
import StashContentArea from '../../components/StashContentArea';
import { preloadAuthenticatedImage } from '../../hooks/useAuthenticatedImage';

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

  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // --- URL is the source of truth ---
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
  
  // --- Separate state for the input field ---
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedInputValue = useDebounce(inputValue, 500);

  // --- This function fetches data based on the URL ---
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

  // --- This effect fetches data when the component loads or the URL changes ---
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


  // --- This effect syncs the URL's search term TO the input box ---
  useEffect(() => {
    // If the search term from the URL is different from what's in the input box, update the input box.
    // This handles direct navigation, and using the browser's back/forward buttons.
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm]);

  // --- This effect syncs the user's typing in the input box TO the URL ---
  useEffect(() => {
    // This effect should only trigger navigation, not state updates.
    const trimmedDebounced = debouncedInputValue.trim();
    
    // If the user's debounced input is different from what the URL currently shows...
    if (trimmedDebounced !== searchTerm) {
      if (trimmedDebounced) {
        // ...and they've typed something, navigate to the new search results.
        navigate(`/utilities/stash/search/${encodeURIComponent(trimmedDebounced)}/page/1`);
      } else if (searchTerm) {
        // ...and they've cleared the box (while a search was active), go to the dashboard.
        navigate('/utilities/stash/dashboard');
      }
    }
  }, [debouncedInputValue, searchTerm, navigate]);

  // Preloading effect for hover images
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
        searchTerm={inputValue} // The input is now controlled by its own state
        onSearchChange={(e) => setInputValue(e.target.value)} // Typing updates the input state
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
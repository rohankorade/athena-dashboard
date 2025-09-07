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
  
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedInputValue = useDebounce(inputValue, 500);

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
    if (searchTerm !== inputValue) {
      setInputValue(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    const trimmedDebounced = debouncedInputValue.trim();
    
    // The check `inputValue === trimmedDebounced` is crucial. It prevents this effect
    // from firing with a stale debounced value when navigating away from the search view.
    // When a nav link is clicked, `inputValue` is cleared instantly, but `debouncedInputValue`
    // is not. This check ensures we only navigate when the input has settled.
    if (trimmedDebounced !== searchTerm && inputValue === trimmedDebounced) {
      if (trimmedDebounced) {
        navigate(`/utilities/stash/search/${encodeURIComponent(trimmedDebounced)}/page/1`);
      } else if (searchTerm) {
        navigate('/utilities/stash/dashboard');
      }
    }
  }, [debouncedInputValue, searchTerm, navigate, inputValue]);

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

  // 1. Create the handler function to clear the input value.
  const handleNavLinkClick = () => {
    setInputValue('');
  };

  return (
    <div className="stash-browser-layout">
      <StashSidebar 
        collections={collections}
        searchTerm={inputValue}
        onSearchChange={(e) => setInputValue(e.target.value)}
        // 2. Pass the handler down to the sidebar component.
        onNavLinkClick={handleNavLinkClick}
      />
      <StashContentArea 
        view={view}
        data={contentData}
        isLoading={isLoading}
        collectionName={collectionName}
        searchTerm={searchTerm}
      />
    </div>
  );
}

export default StashBrowserPage;
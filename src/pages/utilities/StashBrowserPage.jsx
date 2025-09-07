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
  const [localSearchTerm, setLocalSearchTerm] = useState('');

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

  const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

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
    // FIX: Only perform navigation actions if the debounced term has changed.
    // This prevents the effect from firing incorrectly when navigating away from the search page.
    if (debouncedSearchTerm !== searchTerm) {
      if (debouncedSearchTerm) {
        navigate(`/utilities/stash/search/${encodeURIComponent(debouncedSearchTerm)}/page/1`);
      } else if (view === 'search') {
        // Only navigate away if the box is cleared WHILE on the search page.
        navigate('/utilities/stash/dashboard');
      }
    }
  }, [debouncedSearchTerm, searchTerm, view, navigate]);
  
  // Sync URL search term to local state for the input box
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Preloading effect (unchanged)
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
        searchTerm={localSearchTerm}
        onSearchChange={(e) => setLocalSearchTerm(e.target.value)}
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
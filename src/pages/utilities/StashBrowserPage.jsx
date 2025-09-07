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

  const isInitialMount = React.useRef(true);
  const prevLocationKey = React.useRef(location.key);

  useEffect(() => {
    // Don't run on the very first render of the component instance.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationKey.current = location.key; // Make sure ref is up to date
      return;
    }

    // If the location key has changed, it's a navigation event. Don't run search logic.
    // React Router gives each location a unique key. This is the most reliable
    // way to detect a navigation event vs. a simple state-change re-render.
    if (prevLocationKey.current !== location.key) {
      prevLocationKey.current = location.key; // Update key and bail.
      return;
    }

    // If we get here, it's a state change on the same page (e.g., user typing).
    if (debouncedSearchTerm !== searchTerm) {
      if (debouncedSearchTerm) {
        navigate(`/utilities/stash/search/${encodeURIComponent(debouncedSearchTerm)}/page/1`);
      } else if (view === 'search') {
        navigate('/utilities/stash/dashboard');
      }
    }
  }, [debouncedSearchTerm, searchTerm, view, navigate, location.key]);
  
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
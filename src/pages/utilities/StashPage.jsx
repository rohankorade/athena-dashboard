// src/pages/utilities/StashPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StashVideoCard from '../../components/StashVideoCard';

// A simple debounce hook to prevent API calls on every keystroke
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function StashPage() {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  // Fetch all collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:5000/api/stash/collections', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollections();
  }, []);

  // Fetch search results when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true);
      const performSearch = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`http://localhost:5000/api/stash/search?q=${debouncedSearchTerm}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Failed to perform search:", error);
        } finally {
          setIsSearching(false);
        }
      };
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Stash</h1>
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search all videos by title..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="page-content" style={{ overflowY: 'auto', padding: '1rem', alignItems: 'flex-start' }}>
        {searchTerm ? (
          // Display search results
          <div className="stash-search-results">
            <h3>Search Results for "{debouncedSearchTerm}"</h3>
            {isSearching ? <p>Searching...</p> : 
              searchResults.length > 0 ? 
                searchResults.map(video => <StashVideoCard key={video._id} video={video} />) : 
                <p>No results found.</p>
            }
          </div>
        ) : (
          // Display collection grid
          isLoading ? <p>Loading collections...</p> :
          <div className="utilities-grid" style={{ width: '100%' }}>
            {collections.map((col) => (
              <Link to={`/utilities/stash/${col.name}`} key={col.name} className="utility-card">
                <h3>{col.name.replace(/_/g, ' ')}</h3>
                <div className="card-divider"></div>
                <p>{col.count} Videos</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StashPage;
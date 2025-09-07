// src/hooks/useAuthenticatedImage.js

import { useState, useEffect } from 'react';

const useAuthenticatedImage = (url) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let objectUrl = null;

    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError(new Error('Authentication token not found.'));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);

      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]); // Rerun effect if URL changes

  return { imageSrc, loading, error };
};

// --- NEW: Preloading Function ---
// This function will be called to warm up the cache for a given image URL.
export const preloadAuthenticatedImage = (url) => {
  if (!url) {
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('Authentication token not found, cannot preload image.');
    return;
  }

  // We don't need to handle the response, just making the request is enough
  // to get the image into the server-side and browser cache.
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).catch(err => {
    // We can log errors, but we don't need to do anything else.
    // The user experience will just be the same as before if preloading fails.
    console.error(`Failed to preload image: ${url}`, err);
  });
};


export default useAuthenticatedImage;
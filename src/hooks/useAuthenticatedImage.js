// src/hooks/useAuthenticatedImage.js

import { useState, useEffect } from 'react';

const useAuthenticatedImage = (url) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- NEW: State to specifically track if the image is corrupt/invalid ---
  const [isCorrupt, setIsCorrupt] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let objectUrl = null;

    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      setIsCorrupt(false); // Reset on new fetch

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

        // --- MODIFIED: Handle server-side verification failure ---
        if (response.status === 502) {
            setIsCorrupt(true);
            throw new Error(`Server indicated corrupt source image.`);
        }

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
  }, [url]);

  // Return the new state
  return { imageSrc, loading, error, isCorrupt };
};

export const preloadAuthenticatedImage = (url) => {
  if (!url) {
    return;
  }
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('Authentication token not found, cannot preload image.');
    return;
  }
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).catch(err => {
    console.error(`Failed to preload image: ${url}`, err);
  });
};

export default useAuthenticatedImage;
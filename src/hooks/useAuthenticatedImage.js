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

export default useAuthenticatedImage;

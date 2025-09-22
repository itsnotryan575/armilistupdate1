import { useEffect, useState, useRef } from 'react';
import { DatabaseService } from '@/services/DatabaseService';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const initializeFramework = async () => {
      try {
        console.log('Initializing framework...');
        await DatabaseService.init();
        
        if (DatabaseService.getIsWebFallback()) {
          console.log('Database initialized in web fallback mode');
          setError('Database features are limited in web browsers. Using demo data for preview.');
        } else {
          console.log('Database initialized successfully');
        }
        
        if (isMountedRef.current) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize framework:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError('Failed to initialize the application. Please try refreshing the page.');
        if (isMountedRef.current) {
          setIsReady(false);
        }
      }
    };

    initializeFramework();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { isReady, error };
}
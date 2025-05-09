
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Define the maximum number of AI calls allowed per day.
const API_CALL_LIMIT = 5;

interface ApiUsageData {
  count: number;
  lastResetDate: string; // Stores date in YYYY-MM-DD format
}

interface ApiUsageContextType {
  canMakeApiCall: () => boolean;
  recordApiCall: () => void;
  getRemainingCalls: () => number;
  getLimit: () => number;
}

const ApiUsageContext = createContext<ApiUsageContextType | undefined>(undefined);

export function ApiUsageProvider({ children }: { children: React.ReactNode }) {
  const getInitialDateString = () => new Date().toISOString().split('T')[0];

  const [usageData, setUsageData] = useLocalStorage<ApiUsageData>('apiUsageData', {
    count: 0,
    lastResetDate: getInitialDateString(),
  });

  // State to track the current date, updating periodically to handle midnight crossover
  const [currentDateString, setCurrentDateString] = useState(getInitialDateString());

  useEffect(() => {
    // Update currentDateString every minute to check if the day has changed
    const interval = setInterval(() => {
      setCurrentDateString(new Date().toISOString().split('T')[0]);
    }, 60 * 1000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Effect to reset the API call count if the current date is different from the last reset date
  useEffect(() => {
    if (usageData.lastResetDate !== currentDateString) {
      setUsageData({ count: 0, lastResetDate: currentDateString });
    }
  }, [currentDateString, usageData.lastResetDate, setUsageData]);

  const canMakeApiCall = useCallback(() => {
    // If the stored date is not today, it means the counter should have been reset.
    // This allows calls if the day has changed, relying on useEffect to formally reset.
    if (usageData.lastResetDate !== currentDateString) {
      return API_CALL_LIMIT > 0; 
    }
    return usageData.count < API_CALL_LIMIT;
  }, [usageData.count, usageData.lastResetDate, currentDateString]);

  const recordApiCall = useCallback(() => {
    setUsageData(prevData => {
      if (prevData.lastResetDate !== currentDateString) {
        // If date changed since last record, this is the first call of the new day
        return { count: 1, lastResetDate: currentDateString };
      }
      // Increment count, ensuring it doesn't exceed the limit (though canMakeApiCall should prevent this)
      return { ...prevData, count: Math.min(prevData.count + 1, API_CALL_LIMIT) };
    });
  }, [setUsageData, currentDateString]);

  const getRemainingCalls = useCallback(() => {
    if (usageData.lastResetDate !== currentDateString) {
      return API_CALL_LIMIT; // New day, full limit available
    }
    return Math.max(0, API_CALL_LIMIT - usageData.count);
  }, [usageData.count, usageData.lastResetDate, currentDateString]);
  
  const getLimit = useCallback(() => API_CALL_LIMIT, []);

  const value = useMemo(() => ({
    canMakeApiCall,
    recordApiCall,
    getRemainingCalls,
    getLimit,
  }), [canMakeApiCall, recordApiCall, getRemainingCalls, getLimit]);

  return (
    <ApiUsageContext.Provider value={value}>
      {children}
    </ApiUsageContext.Provider>
  );
}

export function useApiUsage() {
  const context = useContext(ApiUsageContext);
  if (context === undefined) {
    throw new Error('useApiUsage must be used within an ApiUsageProvider');
  }
  return context;
}

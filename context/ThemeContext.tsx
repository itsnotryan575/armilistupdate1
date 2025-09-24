import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArmiList } from '@/types/armi-intents';

type ThemePreference = 'light' | 'dark' | 'system';
type UsageMode = 'social' | 'personal' | 'professional';
type ArmiListFilter = 'All' | ArmiList;

interface ThemeContextType {
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  usageMode: UsageMode;
  setUsageMode: (mode: UsageMode) => void;
  currentListType: ArmiListFilter;
  setCurrentListType: (listType: ArmiListFilter) => void;
  getRosterLabel: () => string;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [usageMode, setUsageModeState] = useState<UsageMode>('social');
  const [currentListType, setCurrentListTypeState] = useState<ArmiListFilter>('All');
  const [isLoaded, setIsLoaded] = useState(false);

  // Calculate effective isDark based on preference and system
  const isDark = themePreference === 'system' 
    ? systemColorScheme === 'dark'
    : themePreference === 'dark';

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_preference');
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemePreferenceState(saved as ThemePreference);
      }
      
      const savedUsage = await AsyncStorage.getItem('usage_mode');
      if (savedUsage && ['social', 'personal', 'professional'].includes(savedUsage)) {
        setUsageModeState(savedUsage as UsageMode);
      }
      
      const savedListType = await AsyncStorage.getItem('current_list_type');
      if (savedListType && ['All', 'Roster', 'Network', 'People'].includes(savedListType)) {
        setCurrentListTypeState(savedListType as ArmiListFilter);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem('theme_preference', preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setUsageMode = async (mode: UsageMode) => {
    try {
      await AsyncStorage.setItem('usage_mode', mode);
      setUsageModeState(mode);
    } catch (error) {
      console.error('Error saving usage mode:', error);
    }
  };

  const setCurrentListType = async (listType: ArmiListFilter) => {
    try {
      await AsyncStorage.setItem('current_list_type', listType);
      setCurrentListTypeState(listType);
    } catch (error) {
      console.error('Error saving current list type:', error);
    }
  };
  const getRosterLabel = () => {
    switch (currentListType) {
      case 'All':
        return 'Contacts';
      case 'Roster':
        return 'Roster';
      case 'Network':
        return 'Network';
      case 'People':
        return 'People';
      default:
        return 'Contacts';
    }
  };
  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, themePreference, setThemePreference, usageMode, setUsageMode, currentListType, setCurrentListType, getRosterLabel, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
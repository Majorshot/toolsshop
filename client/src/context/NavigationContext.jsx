import React, { createContext, useContext, useState, useRef, useEffect, startTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopProgressBar } from '../components/TopProgressBar';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const trickleTimersRef = useRef([]);
  const fadeTimerRef = useRef(null);
  const lastNavRef = useRef({ time: 0, to: '' });

  const clearAllTimers = () => {
    trickleTimersRef.current.forEach(id => clearTimeout(id));
    trickleTimersRef.current = [];
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const startLoading = () => {
    clearAllTimers();
    setVisible(true);
    setIsNavigating(true);
    setProgress(28);

    // Progressive trickling animation to indicate active loading
    const t1 = setTimeout(() => setProgress(55), 120);
    const t2 = setTimeout(() => setProgress(76), 350);
    const t3 = setTimeout(() => setProgress(88), 750);
    trickleTimersRef.current = [t1, t2, t3];
  };

  const stopLoading = () => {
    trickleTimersRef.current.forEach(id => clearTimeout(id));
    trickleTimersRef.current = [];

    setProgress(100);
    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      const resetTimer = setTimeout(() => {
        setProgress(0);
        setIsNavigating(false);
      }, 200);
      trickleTimersRef.current.push(resetTimer);
    }, 160);
  };

  // Whenever the URL changes, finish the progress bar cleanly
  useEffect(() => {
    stopLoading();
    return () => clearAllTimers();
  }, [location.pathname, location.search]);

  /**
   * safeNavigate:
   * 1. Debounces rapid/repeated clicks within 400ms.
   * 2. Prevents redundant navigation to the exact same URL.
   * 3. Triggers immediate visual feedback (TopProgressBar) at 0ms.
   * 4. Wraps navigation in React concurrent startTransition to prevent main-thread freeze.
   */
  const safeNavigate = (to, options = {}) => {
    if (!to) return;

    let targetPath = '';
    let targetSearch = '';

    if (typeof to === 'string') {
      const [path, search] = to.split('?');
      targetPath = path || '';
      targetSearch = search ? `?${search}` : '';
    } else if (typeof to === 'object') {
      targetPath = to.pathname || '';
      targetSearch = to.search || '';
    }

    const currentPath = location.pathname;
    const currentSearch = location.search;
    const toKey = `${targetPath}${targetSearch}`;

    // 1. Prevent duplicate navigation to current location
    if (targetPath === currentPath && targetSearch === currentSearch && !options.allowSamePage) {
      return;
    }

    // 2. Debounce rapid identical clicks (within 400ms)
    const now = Date.now();
    if (now - lastNavRef.current.time < 400 && lastNavRef.current.to === toKey) {
      return;
    }
    lastNavRef.current = { time: now, to: toKey };

    // 3. Immediate tactile visual feedback
    startLoading();

    // 4. Concurrent transition
    startTransition(() => {
      navigate(to, options);
    });
  };

  return (
    <NavigationContext.Provider
      value={{
        safeNavigate,
        isNavigating,
        startLoading,
        stopLoading
      }}
    >
      <TopProgressBar visible={visible} progress={progress} />
      {children}
    </NavigationContext.Provider>
  );
};

export const useSafeNavigate = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useSafeNavigate must be used within a NavigationProvider');
  }
  return context;
};

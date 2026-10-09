import React from 'react';

/**
 * TopProgressBar - High-performance, zero-dependency route loading indicator
 * Provides immediate visual feedback across the top of the viewport.
 */
export const TopProgressBar = ({ visible = false, progress = 0 }) => {
  if (!visible && progress === 0) return null;

  return (
    <div
      className="top-nav-progress-container"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Loading page navigation"
    >
      <div
        className="top-nav-progress-bar"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          opacity: visible ? 1 : 0
        }}
      >
        <div className="top-nav-progress-peg" />
      </div>
    </div>
  );
};

export default TopProgressBar;


import React from 'react';

export const PlusIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const WellIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="4" className={className}>
    <path d="M12 4v16M4 12h16" />
  </svg>
);

export const InletIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="#eab308" className={className}>
    <path d="M12 2L2 20h20L12 2z" />
  </svg>
);

export const SeriesInletIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="#eab308" className={className}>
    <path d="M12 2l10 10-10 10L2 12z" />
  </svg>
);

export const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="#ef4444" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const DrawIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

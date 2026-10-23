// Fallback definitions for web editor TypeScript worker (Monaco)
// This ensures the in-browser editor recognizes JSX elements and React without squiggly lines.
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};

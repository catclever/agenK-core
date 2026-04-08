import type { CSSProperties, ReactNode } from 'react';

export interface CanvasProps {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  width?: number | string;
  height?: number | string;
  layout?: 'absolute' | 'flex' | 'grid';
  className?: string; // useful for tailwind styling instead of absolute coords 
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export interface BaseComponentProps {
  collection: string;
  id?: string; 
  query?: any; 
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  width?: number | string;
  height?: number | string;
  layout?: 'absolute' | 'flex' | 'grid';
  className?: string;
  navigate?: (path: string) => void;
  [key: string]: any;
}

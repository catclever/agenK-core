import { CSSProperties, ReactNode } from 'react';

export interface CanvasProps {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  width?: number | string;
  height?: number | string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export interface BaseComponentProps {
  // Data Binding
  collection: string;
  id?: string; // Single entity binding
  query?: any; // List binding (RxDB query)
  
  // Visual Props (passed to CanvasContainer)
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  
  // Custom Props
  navigate?: (path: string) => void;
  [key: string]: any;
}

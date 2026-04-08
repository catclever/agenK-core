import React from 'react';
import type { CanvasProps } from './types';

export const CanvasContainer: React.FC<CanvasProps> = ({
  x,
  y,
  scale = 1,
  rotation = 0,
  opacity = 1,
  zIndex = 0,
  width = 'auto',
  height = 'auto',
  className = '',
  children,
  style,
  onClick
}) => {
  const isAbsolute = x !== undefined || y !== undefined;
  
  const containerStyle: React.CSSProperties = isAbsolute ? {
    position: 'absolute',
    left: x || 0,
    top: y || 0,
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: '0 0',
    opacity,
    zIndex,
    width,
    height,
    ...style
  } : {
    opacity,
    zIndex,
    width,
    height,
    ...style
  };

  return (
    <div className={className} style={containerStyle} onClick={onClick}>
      {children}
    </div>
  );
};

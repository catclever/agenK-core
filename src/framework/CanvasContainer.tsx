import React from 'react';
import { CanvasProps } from './types';

export const CanvasContainer: React.FC<CanvasProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotation = 0,
  opacity = 1,
  zIndex = 0,
  width = 'auto',
  height = 'auto',
  children,
  className,
  style,
  onClick
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: '0 0', // Align to top-left as requested
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

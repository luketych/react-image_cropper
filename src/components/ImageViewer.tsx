import React, { useState } from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import { ZoomIn, ZoomOut } from '@mui/icons-material';

interface ImageViewerProps {
  /**
   * The source URL of the image to display
   */
  src: string;
  /**
   * Optional alt text for the image
   */
  alt?: string;
  /**
   * Optional width of the container
   */
  width?: number | string;
  /**
   * Optional height of the container
   */
  height?: number | string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '',
  width = '100%',
  height = '400px'
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 1,
          zIndex: 1
        }}
      >
        <IconButton onClick={handleZoomIn} color="primary">
          <ZoomIn />
        </IconButton>
        <IconButton onClick={handleZoomOut} color="primary">
          <ZoomOut />
        </IconButton>
      </Box>
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          cursor: 'grab',
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      </Box>
    </Paper>
  );
}; 